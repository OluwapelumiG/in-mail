"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Filter, 
  Mail, 
  ChevronRight, 
  Loader2,
  Inbox,
  Clock,
  ShieldCheck,
  Hash,
  Download,
  Trash2,
  ChevronLeft,
  MoreHorizontal,
  CheckCircle2,
  Circle,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { messageApi } from "@/lib/api"
import { useApplication } from "@/contexts/ApplicationContext"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 20

export default function MessagesPage() {
  const { currentInbox } = useApplication()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page on search or inbox change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, currentInbox?.id])

  const { data, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", currentInbox?.id, debouncedSearch, currentPage],
    queryFn: () => messageApi.list({ 
      application_id: currentInbox?.id, 
      q: debouncedSearch,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE
    }),
    enabled: !!currentInbox,
  })

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => messageApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
      setSelectedIds([])
    }
  })

  const messages = data?.messages || []
  const totalMessages = data?.total || 0
  const totalPages = Math.ceil(totalMessages / ITEMS_PER_PAGE)

  const toggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(messages.map(m => m.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedIds.length} messages?`)) {
      deleteMutation.mutate(selectedIds)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-20 w-full px-4 md:px-8">
        {/* Header Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight">Incoming Messages</h1>
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                 Current Mailbox: <span className="text-foreground/60">{currentInbox?.name || "Global"}</span>
               </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
             <div className="relative group w-full sm:min-w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search subject, sender, or content..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl bg-accent/30 border-border/10 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm pl-11 shadow-sm"
                />
             </div>
             <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-border/20 bg-background/50 backdrop-blur-sm hover:bg-accent/5 shrink-0">
                <Filter className="h-4 w-4 opacity-40" />
             </Button>
          </div>
        </div>

        {/* Toolbar & Bulk Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-accent/20 border border-border/5">
                 <Checkbox 
                   checked={messages.length > 0 && selectedIds.length === messages.length}
                   onCheckedChange={toggleSelectAll}
                   className="rounded-md border-muted-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                 />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Select All</span>
              </div>
              
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                   <div className="h-4 w-px bg-border/10 mx-1" />
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => setSelectedIds([])}
                     className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-primary"
                   >
                      Clear ({selectedIds.length})
                   </Button>
                   <Button 
                     variant="destructive" 
                     size="sm" 
                     onClick={handleDeleteSelected}
                     disabled={deleteMutation.isPending}
                     className="h-8 px-4 rounded-lg text-[10px] text-white font-semibold uppercase tracking-widest shadow-lg shadow-destructive/10"
                   >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      {deleteMutation.isPending ? "Deleting..." : "Delete Selected"}
                   </Button>
                </div>
              )}
           </div>

           <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mr-4">
                {totalMessages} Total Messages
              </span>
              <div className="flex items-center bg-accent/20 rounded-xl p-1 border border-border/5">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   disabled={currentPage === 1}
                   onClick={() => setCurrentPage(prev => prev - 1)}
                   className="h-8 w-8 rounded-lg hover:bg-background"
                 >
                    <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <div className="px-4 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground/80">{currentPage}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/30 uppercase">of</span>
                    <span className="text-xs font-bold text-foreground/80">{totalPages || 1}</span>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   disabled={currentPage === totalPages || totalPages === 0}
                   onClick={() => setCurrentPage(prev => prev + 1)}
                   className="h-8 w-8 rounded-lg hover:bg-background"
                 >
                    <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
           </div>
        </div>

        {/* Messages List Container */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden">
           <CardContent className="p-0">
              {isMessagesLoading ? (
                 <div className="p-32 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                       <Loader2 className="h-10 w-10 animate-spin text-primary" />
                       <div className="absolute inset-0 h-10 w-10 animate-ping bg-primary/10 rounded-full" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Fetching messages...</p>
                 </div>
              ) : messages.length === 0 ? (
                 <div className="p-40 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 rounded-3xl bg-muted/20 flex items-center justify-center text-muted-foreground/10 mb-8 border border-border/5">
                       <Inbox className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground/30 tracking-tight mb-2">No Records Found</h3>
                    <p className="text-sm text-muted-foreground/20 max-w-xs font-medium">The inbox is currently empty or no results match your search query.</p>
                 </div>
              ) : (
                 <div className="divide-y divide-border/5">
                    {messages.map((message) => (
                       <div 
                         key={message.id} 
                         className={cn(
                           "group flex items-center gap-0 hover:bg-primary/[0.01] transition-all duration-300 relative",
                           !message.is_read && "bg-primary/[0.01]"
                         )}
                       >
                          {/* Left Accent for Unread */}
                          {!message.is_read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                          )}
                          
                          {/* Checkbox Area */}
                          <div className="pl-6 pr-4 py-4">
                             <Checkbox 
                               checked={selectedIds.includes(message.id)}
                               onCheckedChange={() => toggleSelect(message.id)}
                               className="rounded-md border-muted-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                             />
                          </div>

                          {/* Message Content */}
                          <div 
                            onClick={() => router.push(`/messages/${message.id}`)}
                            className="flex-1 flex items-center gap-4 py-3 pr-6 cursor-pointer min-w-0"
                          >
                             <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                <div className="w-full md:w-56 shrink-0 truncate">
                                   <span className={cn(
                                     "text-sm",
                                     message.is_read ? "text-foreground/70 font-medium" : "text-foreground font-bold"
                                   )}>
                                      {message.from.split('<')[0].trim() || message.from}
                                   </span>
                                </div>

                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                   <span className={cn(
                                     "text-sm truncate",
                                     message.is_read ? "text-muted-foreground" : "text-foreground font-semibold"
                                   )}>
                                      {message.subject || "(No Subject)"}
                                   </span>
                                   {!message.is_read && (
                                     <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                   )}
                                </div>

                                <div className="shrink-0 text-right md:w-24 hidden sm:block">
                                   <span className={cn(
                                     "text-xs tabular-nums",
                                     message.is_read ? "text-muted-foreground/60" : "text-foreground font-semibold"
                                   )}>
                                      {new Date(message.received_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                   </span>
                                </div>
                             </div>

                             {/* Action Menu */}
                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-lg hover:bg-accent/40 text-muted-foreground/30 hover:text-primary"
                                >
                                   <ChevronRight className="h-5 w-5" />
                                </Button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="flex items-center justify-center py-4">
           <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/20">
             InMail <span className="mx-4 opacity-50">/</span> Host: {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
           </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
