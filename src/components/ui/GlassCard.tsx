import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass relative transition-all duration-300 hover:shadow-[0_12px_40px_rgba(99,102,241,0.15)] hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
