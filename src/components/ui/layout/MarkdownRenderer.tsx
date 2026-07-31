import React, { Suspense } from 'react';

const LazyMarkdown = React.lazy(() => import('./LazyMarkdown'));

interface MarkdownRendererProps {
  children?: string;
  components?: any;
  fallback?: React.ReactNode;
}

export function MarkdownRenderer({ children, components, fallback }: MarkdownRendererProps) {
  const content = children || '';
  
  const defaultFallback = fallback ?? (
    <div className="animate-pulse h-4 bg-stone-100 rounded w-1/2 my-1" />
  );

  return (
    <Suspense fallback={defaultFallback}>
      <LazyMarkdown content={content} components={components} />
    </Suspense>
  );
}
