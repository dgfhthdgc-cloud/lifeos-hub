import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const variantStyles = {
      primary: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-sm shadow-emerald-500/20 active:scale-98',
      secondary: 'bg-neutral-800 hover:bg-neutral-700 text-white font-medium',
      outline: 'border border-neutral-300 dark:border-neutral-700 bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium',
      ghost: 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium',
      danger: 'bg-rose-500 hover:bg-rose-400 text-white font-bold shadow-sm shadow-rose-500/20',
    };

    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-[11px] rounded-lg',
      sm: 'px-3 py-2 text-xs rounded-xl',
      md: 'px-4 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
