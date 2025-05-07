import React from 'react';

interface AlertProps {
  variant?: 'default' | 'bauhaus' | 'neumorphic';
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant = 'default', className = '', children }: AlertProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    bauhaus: 'bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]',
    neumorphic: 'bg-gray-50 border border-gray-100 shadow-[4px_4px_8px_rgba(0,0,0,0.05),-4px_-4px_8px_rgba(255,255,255,0.8)]',
  };

  return (
    <div
      className={`p-4 rounded-md ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <h5 className={`font-bold mb-1 text-black ${className}`}>{children}</h5>
  );
}

export function AlertDescription({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`text-sm text-black ${className}`}>{children}</div>
  );
} 