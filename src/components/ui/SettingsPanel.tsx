import React from 'react';
import { cn } from '../../lib/utils';

export interface SettingsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
