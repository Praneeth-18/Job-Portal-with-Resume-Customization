import React, { ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none rounded-ios';
  
  const variantClasses = {
    primary: 'btn-primary bg-accent text-white hover:brightness-110',
    secondary: 'btn-secondary border border-accent text-accent hover:bg-accent hover:text-white',
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton; 