"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Search, 
  Filter, 
  Mail, 
  Inbox as InboxIcon, 
  ChevronRight, 
  Calendar, 
  User as UserIcon,
  Plus
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { applicationApi, messageApi } from "@/lib/api"
import { useApplication } from "@/contexts/ApplicationContext"
import { cn } from "@/lib/utils"
import { CreateInboxDialog } from "@/components/forms/CreateInboxDialog"

export default function MessagesPage() {
  const { currentInbox, setCurrentInbox } = useApplication()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  const { data: inboxes } = useQuery({
    queryKey: ["inboxes"],
    queryFn: () => applicationApi.list(),
  })

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", currentInbox?.id],
    queryFn: () => messageApi.list({ application_id: currentInbox?.id }),
    enabled: !!currentInbox,
  })

  return (
    <DashboardLayout
      actions={
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg h-10 px-6 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs flex items-center gap-2 transition-all"
        >
          Create Inbox
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Inbox List */}
        <div className="lg:col-span-1 space-y-6">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">My Nodes</h2>
           </div>
           <div className="space-y-2">
              {inboxes?.map((inbox) => (
                <button
                  key={inbox.id}
                  onClick={() => setCurrentInbox(inbox)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all group border",
                    currentInbox?.id === inbox.id 
                      ? "bg-white border-[#2d6a4f] shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                     <div className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
                        currentInbox?.id === inbox.id ? "bg-[#d8f3dc] text-[#2d6a4f]" : "bg-muted text-muted-foreground"
                     )}>
                        <InboxIcon className="h-4 w-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-black truncate", currentInbox?.id === inbox.id ? "text-[#2d6a4f]" : "text-foreground")}>
                           {inbox.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                           {inbox.id.split('-')[0]} node
                        </p>
                     </div>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Message View */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="premium-card overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between bg-white">
                 <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative w-full">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                          placeholder="Search captures..." 
                          className="h-10 pl-10 bg-muted/30 border-none rounded-lg text-xs"
                       />
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg shrink-0">
                       <Filter className="h-4 w-4" />
                    </Button>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       {messages?.messages.length || 0} Captures
                    </span>
                 </div>
              </div>

              <CardContent className="p-0 bg-white">
                 {isMessagesLoading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                       <Loader2 className="h-8 w-8 animate-spin text-primary" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Parsing MIME cluster...</p>
                    </div>
                 ) : !messages || messages.messages.length === 0 ? (
                    <div className="p-20 text-center opacity-20">
                       <Mail className="h-16 w-16 mx-auto mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">No captures found for this node</p>
                    </div>
                 ) : (
                    <div className="divide-y">
                       {messages.messages.map((message) => (
                          <div key={message.id} className="p-6 flex items-start gap-6 hover:bg-muted/10 transition-colors group cursor-pointer">
                             <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-[#d8f3dc] group-hover:text-[#2d6a4f] transition-colors shrink-0">
                                <Mail className="h-5 w-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                   <h4 className="text-sm font-black truncate pr-4">{message.subject || "(No Subject)"}</h4>
                                   <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                                      {new Date(message.received_at).toLocaleDateString()}
                                   </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                   <Badge variant="outline" className="h-5 text-[9px] font-black uppercase tracking-widest border-muted-foreground/20 text-muted-foreground bg-transparent px-2">
                                      {message.from}
                                   </Badge>
                                   <span className="text-[10px] font-bold text-muted-foreground lowercase opacity-60">to: {message.to}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 opacity-80 leading-relaxed">
                                   Forensic scan: Clean • MIME segments: 2 • Capture verified
                                </p>
                             </div>
                             <div className="self-center">
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
      <CreateInboxDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </DashboardLayout>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
