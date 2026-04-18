import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-xl bg-white/80 border border-primary/15 px-4 py-3 text-sm text-gray-900',
              'transition-colors duration-200 ease-in-out',
              'focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none',
              'placeholder:text-gray-400',
              icon && 'pl-10',
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 ml-1 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
