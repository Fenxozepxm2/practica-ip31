import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            px-4 py-3 
            bg-input-background 
            border border-border 
            rounded-md
            text-foreground
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            transition-all
            ${error ? 'border-destructive' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-destructive">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
