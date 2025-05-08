import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Timeline({ children, className, ...props }: TimelineProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  )
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  time?: string
  children?: React.ReactNode
}

export function TimelineItem({ icon, title, time, children, className, ...props }: TimelineItemProps) {
  return (
    <div className={cn("flex gap-3", className)} {...props}>
      {icon && (
        <div className="flex-none mt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
            {icon}
          </div>
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium leading-none">{title}</p>
          {time && <p className="text-xs text-muted-foreground">{time}</p>}
        </div>
        {children && (
          <p className="text-sm text-muted-foreground">{children}</p>
        )}
      </div>
    </div>
  )
} 