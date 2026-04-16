import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

/**
 * Button component with BEAM purple theming.
 * Built with class-variance-authority for type-safe variants.
 */
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // BEAM purple (#6B46C1) as default
        default: 'bg-primary text-primary-foreground hover:bg-primary-700 active:bg-primary-800',
        // Secondary variant
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // Outline variant
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        // Ghost variant
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        // Destructive variant
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // Link variant
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Render as a different element (e.g., anchor tag)
   */
  asChild?: boolean
}

/**
 * Button component with BEAM purple theming and multiple variants.
 *
 * @example
 * <Button>Click me</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="outline" size="sm">Small Outline</Button>
 * <Button variant="ghost" size="icon"><Icon /></Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
