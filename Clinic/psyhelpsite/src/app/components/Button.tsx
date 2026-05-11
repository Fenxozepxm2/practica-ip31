import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props 
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const baseStyles = 'rounded-lg transition-all duration-200 font-medium';
  
  const variantStyles = {
    primary: isDisabled 
      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
      : 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
    outline: 'border-2 border-border text-foreground hover:bg-secondary',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}