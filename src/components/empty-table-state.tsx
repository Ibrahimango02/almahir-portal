import { LucideIcon } from "lucide-react"

interface EmptyTableStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyTableState({ icon: Icon, title, description }: EmptyTableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {description}
      </p>
    </div>
  )
}

