import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioLibrary } from '../AudioLibrary';
import { STORAGE_KEYS, campaignKey } from '../../../lib/constants';
import { StoredAudioFile } from '../../../lib/audioFileStore';

describe('AudioLibrary', () => {
  const mockPlay = vi.fn().mockResolvedValue(undefined);
  const mockPause = vi.fn();
  const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockPlay.mockReset();
    mockPause.mockReset();
    mockCreateObjectURL.mockReset();
    mockRevokeObjectURL.mockReset();

    mockPlay.mockResolvedValue(undefined);
    mockCreateObjectURL.mockReturnValue('blob:mock-url');

    // Robustly patch HTMLMediaElement prototype in JSDOM
    window.HTMLMediaElement.prototype.play = mockPlay;
    window.HTMLMediaElement.prototype.pause = mockPause;

    // Directly assign mock static methods to native window.URL
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    cleanup();
  });

  it('adds file to uploading state when upload begins and removes after it resolves', async () => {
    let resolveAddFiles: () => void = () => {};
    const addFilesPromise = new Promise<void>((resolve) => {
      resolveAddFiles = resolve;
    });
    const addFilesMock = vi.fn().mockReturnValue(addFilesPromise);
    const removeFileMock = vi.fn();
    render(
      <AudioLibrary
        storedFiles={[]}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
      />
    );
    
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const ambientInput = inputs[0];
    const file = new File(['audio content'], 'test-track.mp3', { type: 'audio/mp3' });
    
    // Start upload
    await userEvent.upload(ambientInput, file);
    
    // Should show uploading indicator immediately
    expect(await screen.findByText('test-track.mp3')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(addFilesMock).toHaveBeenCalled();
    
    // Resolve the promise to finish upload
    resolveAddFiles();
    
    // Wait for the indicator to be removed
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  it('clears the uploading state even if the underlying write throws', async () => {
    const addFilesMock = vi.fn().mockRejectedValue(new Error('Storage quota exceeded'));
    const removeFileMock = vi.fn();
    render(
      <AudioLibrary
        storedFiles={[]}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
      />
    );
    
    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const ambientInput = inputs[0];
    const file = new File(['audio content'], 'fail-track.mp3', { type: 'audio/mp3' });
    
    // Start upload
    try {
      await userEvent.upload(ambientInput, file);
    } catch (e) {
      // ignore
    }
    
    // It throws, but it should still clean up the uploading state
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  it('adds file to uploading state when upload begins and removes after it resolves with exact File and category, and can render existing stored files', async () => {
    let resolveAddFiles: () => void = () => {};
    const addFilesPromise = new Promise<void>((resolve) => {
      resolveAddFiles = resolve;
    });
    const addFilesMock = vi.fn().mockReturnValue(addFilesPromise);
    const removeFileMock = vi.fn();
    
    const storedFiles: StoredAudioFile[] = [
      {
        id: 'file-ambient',
        name: 'Forest Rain.mp3',
        fileName: 'Forest Rain.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(10240)], { type: 'audio/mp3' }),
        addedAt: 1234567890,
      }
    ];

    render(
      <AudioLibrary
        storedFiles={storedFiles}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
      />
    );
    
    // Check that existing file renders name and correct size
    expect(screen.getByText('Forest Rain.mp3')).toBeInTheDocument();
    expect(screen.getByText('10.0 KB')).toBeInTheDocument();

    const inputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const ambientInput = inputs[0];
    const file = new File(['audio content'], 'test-track.mp3', { type: 'audio/mp3' });
    
    // Start upload
    fireEvent.change(ambientInput, { target: { files: [file] } });
    
    // Should show uploading indicator immediately
    expect(await screen.findByText('test-track.mp3')).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(addFilesMock).toHaveBeenCalledWith([file], 'ambient');
    
    // Resolve the promise to finish upload
    resolveAddFiles();
    
    // Wait for the indicator to be removed
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });
  });

  it('handles individual delete confirmation lifecycle', async () => {
    const addFilesMock = vi.fn();
    const removeFileMock = vi.fn().mockResolvedValue(undefined);
    
    const storedFiles: StoredAudioFile[] = [
      {
        id: 'file-delete',
        name: 'DeleteMe.mp3',
        fileName: 'DeleteMe.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(10240)], { type: 'audio/mp3' }),
        addedAt: 1234567890,
      }
    ];

    const campaignId = 'test-campaign';
    const layoutKey = campaignKey(STORAGE_KEYS.soundboardLayout, campaignId);
    
    const initialLayout = [
      { fileId: 'file-delete', slotId: 1 },
      { fileId: 'other-file', slotId: 2 }
    ];
    localStorage.setItem(layoutKey, JSON.stringify(initialLayout));

    render(
      <AudioLibrary
        storedFiles={storedFiles}
        addFiles={addFilesMock}
        removeFile={removeFileMock}
        campaignId={campaignId}
      />
    );
    
    const deleteBtn = screen.getByLabelText('Delete File');
    fireEvent.click(deleteBtn);

    expect(await screen.findByText('Delete File?')).toBeInTheDocument();
    expect(screen.getByText(/This will permanently remove "DeleteMe\.mp3" from your audio library\./)).toBeInTheDocument();
    expect(removeFileMock).not.toHaveBeenCalled();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    
    await waitFor(() => {
      expect(screen.queryByText('Delete File?')).not.toBeInTheDocument();
    });
    expect(removeFileMock).not.toHaveBeenCalled();

    fireEvent.click(deleteBtn);
    expect(await screen.findByText('Delete File?')).toBeInTheDocument();

    const storageEventSpy = vi.fn();
    window.addEventListener('storage', storageEventSpy);

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('Delete File?')).not.toBeInTheDocument();
      expect(removeFileMock).toHaveBeenCalledWith('file-delete');
    });

    const finalLayoutRaw = localStorage.getItem(layoutKey);
    expect(finalLayoutRaw).toBeDefined();
    const finalLayout = JSON.parse(finalLayoutRaw!);
    expect(finalLayout).toHaveLength(1);
    expect(finalLayout[0].fileId).toBe('other-file');

    expect(storageEventSpy).toHaveBeenCalled();
    window.removeEventListener('storage', storageEventSpy);
  });

  it('handles clear-all confirmation lifecycle', async () => {
    const clearAllFilesMock = vi.fn().mockResolvedValue(undefined);
    const storedFiles: StoredAudioFile[] = [
      {
        id: 'file-ambient',
        name: 'Forest Rain.mp3',
        fileName: 'Forest Rain.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(10240)], { type: 'audio/mp3' }),
        addedAt: 1234567890,
      }
    ];

    render(
      <AudioLibrary
        storedFiles={storedFiles}
        addFiles={vi.fn()}
        removeFile={vi.fn()}
        clearAllFiles={clearAllFilesMock}
      />
    );
    
    const clearAllBtn = screen.getByText('Clear all');
    fireEvent.click(clearAllBtn);

    expect(await screen.findByText(/Remove all 1 ambient tracks/)).toBeInTheDocument();
    expect(clearAllFilesMock).not.toHaveBeenCalled();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    
    await waitFor(() => {
      expect(screen.queryByText(/Remove all 1 ambient tracks/)).not.toBeInTheDocument();
    });
    expect(clearAllFilesMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTitle('Clear all ambient tracks'));
    expect(await screen.findByText(/Remove all 1 ambient tracks/)).toBeInTheDocument();

    const confirmBtn = screen.getByText('Remove all');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Remove all 1 ambient tracks/)).not.toBeInTheDocument();
      expect(clearAllFilesMock).toHaveBeenCalledWith('ambient');
    });
  });

  it('handles reset-mood-assignments confirmation lifecycle', async () => {
    const resetAllMoodsMock = vi.fn();
    const storedFiles: StoredAudioFile[] = [
      {
        id: 'file-ambient',
        name: 'Forest Rain.mp3',
        fileName: 'Forest Rain.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(10240)], { type: 'audio/mp3' }),
        addedAt: 1234567890,
      }
    ];

    const { container } = render(
      <AudioLibrary
        storedFiles={storedFiles}
        addFiles={vi.fn()}
        removeFile={vi.fn()}
        resetAllMoods={resetAllMoodsMock}
      />
    );

    const resetBtn = screen.getByText('Reset mood assignments');
    fireEvent.click(resetBtn);

    expect(await screen.findByText(/Clear all mood assignments/)).toBeInTheDocument();
    expect(resetAllMoodsMock).not.toHaveBeenCalled();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    
    await waitFor(() => {
      expect(screen.queryByText(/Clear all mood assignments/)).not.toBeInTheDocument();
    });
    expect(resetAllMoodsMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Reset mood assignments'));
    expect(await screen.findByText(/Clear all mood assignments/)).toBeInTheDocument();

    const confirmBtn = screen.getByText('Reset moods');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Clear all mood assignments/)).not.toBeInTheDocument();
      expect(resetAllMoodsMock).toHaveBeenCalled();
    });
  });

  it('enforces single-preview play, preemption, and toggling', async () => {
    const storedFiles: StoredAudioFile[] = [
      {
        id: 'file1',
        name: 'Track 1.mp3',
        fileName: 'Track 1.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(10240)], { type: 'audio/mp3' }),
        addedAt: 1234567890,
      },
      {
        id: 'file2',
        name: 'Track 2.mp3',
        fileName: 'Track 2.mp3',
        category: 'ambient',
        blob: new Blob([new ArrayBuffer(5120)], { type: 'audio/mp3' }),
        addedAt: 1234567891,
      }
    ];

    render(
      <AudioLibrary
        storedFiles={storedFiles}
        addFiles={vi.fn()}
        removeFile={vi.fn()}
      />
    );

    const previewButtons = screen.getAllByTitle('Preview 3s');
    expect(previewButtons).toHaveLength(2);

    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalled();
    });
    expect(mockPause).not.toHaveBeenCalled();

    fireEvent.click(previewButtons[1]);

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledTimes(1);
      expect(mockPlay).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(previewButtons[1]);

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalledTimes(2);
    });
  });
});
