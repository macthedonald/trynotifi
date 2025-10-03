import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-700 focus-visible:ring-primary shadow-sm',
      secondary: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 focus-visible:ring-primary shadow-sm',
      outline: 'border border-primary bg-transparent text-primary hover:bg-purple-50 focus-visible:ring-primary',
      ghost: 'text-gray-900 hover:bg-gray-100 focus-visible:ring-primary'
    }

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm min-h-[44px] lg:min-h-[36px]',
      md: 'h-11 px-5 text-sm min-h-[46px] lg:min-h-[42px]',
      lg: 'h-12 px-6 text-base min-h-[48px] lg:min-h-[48px]',
    }

    return (
      <button
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'