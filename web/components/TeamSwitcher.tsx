"use client"

import * as React from "react"
import {
  Check,
  ChevronsUpDown,
  PlusCircle,
  Mail,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApplication } from "@/contexts/ApplicationContext"
import { CreateInboxDialog } from "@/components/forms/CreateInboxDialog"

export function TeamSwitcher() {
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const { currentInbox, inboxes, setCurrentInbox } = useApplication()

  const selectedTeam = inboxes?.find((inbox) => inbox.id === currentInbox?.id)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[220px] justify-between h-10 rounded-md border-border/40 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-sm transition-all")}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-white/20 text-white">
                <Mail className="h-3 w-3" />
              </div>
              <span className="truncate text-[12px] uppercase tracking-wider">{selectedTeam?.name || "Select Inbox"}</span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[220px] p-0 border-border/40 shadow-xl overflow-hidden">
          <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Inboxes
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuGroup className="p-1">
            {inboxes?.map((inbox) => (
              <DropdownMenuItem
                key={inbox.id}
                onClick={() => setCurrentInbox(inbox)}
                className="text-sm py-2 px-3 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                   <Mail className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                   <span className="font-medium text-foreground/80">{inbox.name}</span>
                </div>
                {selectedTeam?.id === inbox.id && (
                  <Check className="ml-auto h-4 w-4 text-primary animate-in fade-in zoom-in duration-200" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="m-0" />
          <div className="p-1">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                setShowNewTeamDialog(true)
              }}
              className="text-sm py-2.5 px-3 flex items-center gap-2 cursor-pointer text-primary font-semibold hover:bg-primary/5"
            >
              <PlusCircle className="h-4 w-4" />
              Create Inbox
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateInboxDialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog} />
    </>
  )
}
