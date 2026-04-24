"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApplication } from "@/contexts/ApplicationContext"
import { applicationApi } from "@/lib/api"
import { Loader2, Zap } from "lucide-react"

interface CreateInboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInboxDialog({ open, onOpenChange }: CreateInboxDialogProps) {
  const { setCurrentInbox } = useApplication()
  const [name, setName] = React.useState("")
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (name: string) => applicationApi.create(name),
    onSuccess: (newInbox) => {
      queryClient.invalidateQueries({ queryKey: ["inboxes"] })
      setCurrentInbox(newInbox)
      onOpenChange(false)
      setName("")
    }
  })

  const handleCreate = () => {
    if (!name || createMutation.isPending) return
    createMutation.mutate(name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-card p-10 max-w-md animate-in fade-in zoom-in duration-300">
        <DialogHeader className="space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2">
             <Zap className="h-8 w-8" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight leading-tight">Create New Mailbox</DialogTitle>
          <DialogDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground leading-relaxed">
            Set up a new mailbox to receive and manage emails.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-8 py-6">
          <div className="space-y-3">
            <Label htmlFor="inbox-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
              Mailbox Name
            </Label>
            <Input
              id="inbox-name"
              placeholder="e.g. Personal Inbox"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="h-14 rounded-2xl bg-muted/40 border-none px-6 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 font-semibold uppercase text-[10px] tracking-widest flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={createMutation.isPending || !name} 
            className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all flex-1"
          >
            {createMutation.isPending ? (
               <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
               </div>
            ) : "Create Mailbox"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
