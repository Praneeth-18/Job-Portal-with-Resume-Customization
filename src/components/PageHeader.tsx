import React from 'react';

export interface PageHeaderProps {
  heading: string;
  text?: string;
}

export function PageHeader({ heading, text }: PageHeaderProps) {
  return (
    <div className="pb-8">
      <div className="section-card mb-4">
        <h1 className="text-3xl font-medium text-white tracking-tight">{heading}</h1>
        {text && (
          <p className="mt-2 text-white/80 max-w-3xl font-light">
            {text}
          </p>
        )}
      </div>
    </div>
  );
} 