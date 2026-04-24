"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { 
  Search, 
  Filter, 
  Mail, 
  ChevronRight, 
  Loader2,
  Inbox,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Hash,
  Download,
  Trash2,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { messageApi } from "@/lib/api"
import { useApplication } from "@/contexts/ApplicationContext"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { currentInbox } = useApplication()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", currentInbox?.id],
    queryFn: () => messageApi.list({ application_id: currentInbox?.id, limit: 50 }),
    enabled: !!currentInbox,
  })

  const filteredMessages = messages?.messages.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.to?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 max-w-[1200px] mx-auto pb-20 w-full">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight">Incoming Messages</h1>
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                 Current Mailbox: <span className="text-foreground/60">{currentInbox?.name || "Global"}</span>
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search metadata..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl bg-accent/30 border-border/10 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm pl-11"
                />
             </div>
             <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-border/20 bg-background/50 backdrop-blur-sm hover:bg-accent/5">
                <Filter className="h-4 w-4 opacity-40" />
             </Button>
          </div>
        </div>

        {/* Messages List Container */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-border/10 bg-accent/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                Found {filteredMessages.length} Messages
              </span>
              <div className="flex items-center gap-4">
                 <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 hover:text-primary">
                    Clear Selection
                 </Button>
                 <div className="h-4 w-px bg-border/10" />
                 <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-destructive/40 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Purge All
                 </Button>
              </div>
           </div>

           <CardContent className="p-0">
              {isMessagesLoading ? (
                 <div className="p-24 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                       <Loader2 className="h-10 w-10 animate-spin text-primary" />
                       <div className="absolute inset-0 h-10 w-10 animate-ping bg-primary/10 rounded-full" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Syncing mailbox...</p>
                 </div>
              ) : filteredMessages.length === 0 ? (
                 <div className="p-32 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground/20 mb-8 border border-border/5">
                       <Inbox className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground/40 tracking-tight mb-2">No Records Found</h3>
                    <p className="text-sm text-muted-foreground/30 max-w-xs font-medium">The inbox for this mailbox is currently empty or doesn't match your query.</p>
                 </div>
              ) : (
                 <div className="divide-y divide-border/5">
                    {filteredMessages.map((message) => (
                       <div 
                         key={message.id} 
                         onClick={() => router.push(`/messages/${message.id}`)}
                         className="p-8 flex items-center gap-8 hover:bg-primary/[0.02] transition-all duration-300 group cursor-pointer relative"
                       >
                          {/* Left Accent */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                          
                          {/* Icon Cluster */}
                          <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/40 group-hover:bg-primary/10 group-hover:text-primary border border-border/10 group-hover:border-primary/20 transition-all duration-500 shrink-0">
                             <Mail className="h-6 w-6" />
                          </div>

                          {/* Content Cluster */}
                          <div className="flex-1 min-w-0 space-y-3">
                             <div className="flex items-center justify-between">
                                <h4 className="text-base font-semibold text-foreground/80 group-hover:text-foreground transition-colors truncate pr-8">
                                   {message.subject || "(No Subject)"}
                                </h4>
                                <div className="flex items-center gap-3 text-muted-foreground/30 shrink-0">
                                   <Clock className="h-3.5 w-3.5" />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">
                                      {new Date(message.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                             </div>

                             <div className="flex items-center flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">From</span>
                                   <Badge variant="outline" className="rounded-lg h-6 px-3 bg-accent/40 border-border/10 text-[10px] font-bold text-foreground/60 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                      {message.from}
                                   </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">To</span>
                                   <Badge variant="outline" className="rounded-lg h-6 px-3 bg-accent/40 border-border/10 text-[10px] font-bold text-foreground/60">
                                      {message.to}
                                   </Badge>
                                </div>
                             </div>

                             <div className="flex items-center gap-6 pt-1">
                                <div className="flex items-center gap-2">
                                   <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/40" />
                                   <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.1em]">MIME Verified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Hash className="h-3.5 w-3.5 text-blue-500/40" />
                                   <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-[0.1em]">2 Segments</span>
                                </div>
                             </div>
                          </div>

                          {/* Action Cluster */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                             <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/20 bg-background hover:text-primary transition-all shadow-sm">
                                <Download className="h-4 w-4" />
                             </Button>
                             <Button size="icon" className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                <ChevronRight className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
