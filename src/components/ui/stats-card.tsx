import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  value: string | number
  description?: string
}

export function StatsCard({ 
  icon, 
  title, 
  value, 
  description, 
  className, 
  ...props 
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <h3 className="text-2xl font-bold tracking-tight">
              {value}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 