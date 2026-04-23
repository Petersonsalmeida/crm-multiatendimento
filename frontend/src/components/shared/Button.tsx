import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-primary ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-whatsapp-primary text-bg-base hover:bg-whatsapp-primary-hover active:bg-whatsapp-secondary',
  secondary:
    'bg-whatsapp-secondary text-text-primary hover:bg-whatsapp-secondary-hover active:bg-whatsapp-dark',
  ghost:
    'bg-transparent text-text-primary hover:bg-bg-hover active:bg-bg-elevated border border-border-subtle',
  danger:
    'bg-danger text-text-primary hover:bg-danger-hover active:bg-danger-hover',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? <Spinner /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});
