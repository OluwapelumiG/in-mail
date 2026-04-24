import { Inbox, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/5 text-primary mb-8 shadow-inner border border-primary/10">
        {icon || <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-3xl font-black tracking-tight text-foreground font-serif italic">{title}</h3>
      <p className="mx-auto mt-4 max-w-sm text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-10 rounded-2xl px-10 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95">
          <Plus className="mr-3 h-5 w-5" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
