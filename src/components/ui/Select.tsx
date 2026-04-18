import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'block w-full appearance-none rounded-xl bg-white/80 border border-primary/15 px-4 py-3 pr-10 text-sm text-gray-900',
              'transition-colors duration-200 ease-in-out',
              'focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none',
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className
            )}
            {...props}
          >
            <option value="" disabled>Select an option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 ml-1 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
