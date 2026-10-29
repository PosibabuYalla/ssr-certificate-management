import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#1e3a5f] text-white',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        destructive: 'bg-red-100 text-red-800',
        secondary: 'bg-gray-100 text-gray-800',
        golden: 'bg-amber-100 text-amber-700',
        draft: 'bg-blue-100 text-blue-800',
        issued: 'bg-green-100 text-green-800',
        revoked: 'bg-red-100 text-red-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
