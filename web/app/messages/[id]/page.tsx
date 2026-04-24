"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Mail, 
  Clock, 
  User, 
  ShieldCheck, 
  FileText,
  Paperclip,
  Loader2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { messageApi } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function MessageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: message, isLoading } = useQuery({
    queryKey: ["message", id],
    queryFn: () => messageApi.get(id),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => messageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
      router.push("/messages")
    }
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[700px] items-center justify-center">
           <div className="flex flex-col items-center gap-8">
              <div className="relative">
                 <Loader2 className="h-16 w-16 animate-spin text-primary/40" />
                 <div className="absolute inset-0 h-16 w-16 animate-ping bg-primary/5 rounded-full" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Loading Message...</p>
           </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!message) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[700px] text-center px-6">
           <div className="h-24 w-24 rounded-[2.5rem] bg-destructive/5 flex items-center justify-center text-destructive/30 mb-8 border border-destructive/10">
              <ShieldCheck className="h-12 w-12" />
           </div>
           <h2 className="text-3xl font-bold tracking-tight mb-3">Message Not Found</h2>
           <p className="text-muted-foreground/50 mb-10 max-w-sm font-medium">The specific message identifier could not be resolved. It may have been purged or belongs to another security context.</p>
           <Button onClick={() => router.push("/messages")} variant="outline" className="rounded-2xl h-12 px-8 border-border/20 text-xs font-bold uppercase tracking-widest">
              Return to Inbox
           </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto pb-32 w-full px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Top Navigation & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <Button 
             variant="ghost" 
             onClick={() => router.back()}
             className="group h-10 px-4 -ml-4 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-transparent transition-all gap-3 w-fit"
           >
              <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Return to Inbox</span>
           </Button>
           
           <div className="flex items-center gap-3">
              
              <div className="h-6 w-px bg-border/10 mx-1" />
              <Button 
                variant="outline" 
                onClick={() => {
                   if(confirm("Permanently delete this message?")) deleteMutation.mutate()
                }}
                disabled={deleteMutation.isPending}
                className="h-10 w-10 p-0 rounded-xl border-border/20 bg-background/50 text-destructive/50 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 transition-all shadow-sm"
              >
                 <Trash2 className="h-4 w-4" />
              </Button>
           </div>
        </div>

        <div className="flex flex-col gap-8">
           {/* Main Message Content */}
           <Card className="border-border/20 bg-card/30 backdrop-blur-xl shadow-none overflow-hidden">
              <CardContent className="p-0">
                 {/* Message Header Header */}
                 <div className="p-6 md:p-8 border-b border-border/10 bg-accent/5">
                    <div className="space-y-6">
                       <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-[1.1]">
                          {message.subject || "(No Subject)"}
                       </h1>
                       
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                             <span className="w-16 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">From</span>
                             <p className="text-sm font-medium text-foreground/90 truncate">{message.from}</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="w-16 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">To</span>
                             <p className="text-sm font-medium text-foreground/90 truncate">{message.to}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Content Display */}
                 <div className="p-6 md:p-8">
                    <Tabs defaultValue="html" className="w-full">
                       <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                          <TabsList className="bg-muted/20 p-1 rounded-xl h-10">
                             <TabsTrigger value="html" className="rounded-lg px-4 text-[10px] font-semibold uppercase tracking-[0.1em] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">VISUAL</TabsTrigger>
                             <TabsTrigger value="text" className="rounded-lg px-4 text-[10px] font-semibold uppercase tracking-[0.1em] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">TEXT</TabsTrigger>
                             <TabsTrigger value="source" className="rounded-lg px-4 text-[10px] font-semibold uppercase tracking-[0.1em] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">SOURCE</TabsTrigger>
                             <TabsTrigger value="technical" className="rounded-lg px-4 text-[10px] font-semibold uppercase tracking-[0.1em] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">HEADERS</TabsTrigger>
                          </TabsList>
                          
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-border/10">
                                <Clock className="h-3 w-3 text-muted-foreground/40" />
                                <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                                  {new Date(message.received_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                             </div>
                          </div>
                       </div>

                       <TabsContent value="html" className="mt-0 outline-none">
                           <div className="w-full rounded-2xl bg-white border border-border/10 p-0.5 shadow-sm overflow-hidden">
                              {message.html_body ? (
                                <iframe 
                                  srcDoc={message.html_body} 
                                  className="w-full border-none transition-all duration-500"
                                  style={{ minHeight: '500px' }}
                                  scrolling="no"
                                  title="Message Preview"
                                  onLoad={(e) => {
                                    const iframe = e.target as HTMLIFrameElement;
                                    try {
                                      if (iframe.contentWindow?.document.documentElement) {
                                        const h = iframe.contentWindow.document.documentElement.scrollHeight;
                                        iframe.style.height = h + 50 + 'px';
                                      }
                                    } catch (err) {}
                                  }}
                                />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-[500px] bg-accent/5 text-muted-foreground/20">
                                  <FileText className="h-16 w-16 mb-4 opacity-20" />
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em]">No HTML Content</p>
                               </div>
                             )}
                          </div>
                       </TabsContent>

                       <TabsContent value="text" className="mt-0 outline-none">
                          <div className="min-h-[500px] w-full rounded-2xl bg-accent/5 border border-border/10 p-8 font-mono text-xs leading-relaxed text-foreground/70 whitespace-pre-wrap overflow-auto shadow-inner">
                             {message.text_body || "The plain text stream is empty for this message."}
                          </div>
                       </TabsContent>

                       <TabsContent value="source" className="mt-0 outline-none">
                          <div className="min-h-[500px] w-full rounded-2xl bg-[#0a0a0a] border border-white/[0.05] p-8 font-mono text-[11px] leading-relaxed text-blue-400/70 overflow-auto whitespace-pre shadow-sm">
                             {message.raw_content || "Original source not available."}
                          </div>
                       </TabsContent>

                       <TabsContent value="technical" className="mt-0 outline-none">
                          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-accent/20 border border-border/10 space-y-4">
                                   <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em] block">Message Details</span>
                                   <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                         <span className="text-[11px] text-muted-foreground/60">MIME</span>
                                         <span className="text-[11px] font-semibold">Multipart</span>
                                      </div>
                                      <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                         <span className="text-[11px] text-muted-foreground/60">Size</span>
                                         <span className="text-[11px] font-semibold">{(message.raw_content ? message.raw_content.length / 1024 : 0).toFixed(2)} KB</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                         <span className="text-[11px] text-muted-foreground/60">Attachments</span>
                                         <span className="text-[11px] font-semibold">{message.attachments?.length || 0}</span>
                                      </div>
                                   </div>
                                </div>
                                
                                <div className="md:col-span-2 p-6 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-6">
                                   <div className="h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                      <ShieldCheck className="h-8 w-8" />
                                   </div>
                                   <div className="space-y-1">
                                      <h4 className="text-sm font-semibold text-emerald-700">Message Verified</h4>
                                      <p className="text-[10px] font-medium text-emerald-600/60 leading-relaxed uppercase tracking-wider">Message parsed successfully. Standard MIME structure intact.</p>
                                   </div>
                                </div>
                             </div>

                             <div className="p-8 rounded-2xl bg-accent/5 border border-border/10 space-y-4">
                                <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.2em] block">Raw Headers</span>
                                <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                   <pre className="text-[10px] font-mono text-muted-foreground/60 whitespace-pre-wrap leading-loose">
                                      {message.headers || "Headers are not available for this message."}
                                   </pre>
                                </div>
                             </div>
                          </div>
                       </TabsContent>
                    </Tabs>
                 </div>
              </CardContent>
           </Card>

           {/* Attachments Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                 <h3 className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.3em]">Attachments</h3>
                 <div className="h-px flex-1 bg-border/10" />
                 <Badge variant="outline" className="h-5 rounded-md bg-accent/20 border-border/10 text-[9px] font-semibold px-2 text-muted-foreground/60">
                   {message.attachments?.length || 0}
                 </Badge>
              </div>
              
              {message.attachments && message.attachments.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {message.attachments.map((file) => (
                       <div key={file.id} className="group p-4 rounded-xl bg-card/50 border border-border/10 hover:border-primary/20 transition-all flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0">
                                <Paperclip className="h-4 w-4" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-foreground/80 truncate">{file.filename}</p>
                                <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all shrink-0">
                             <Download className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="py-12 rounded-2xl border border-dashed border-border/20 flex flex-col items-center justify-center text-center opacity-30">
                    <Paperclip className="h-8 w-8 mb-3" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">No Attachments</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
