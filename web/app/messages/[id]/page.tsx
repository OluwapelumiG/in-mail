"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Mail, 
  Clock, 
  User, 
  ShieldCheck, 
  Code, 
  FileText,
  Paperclip,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
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
  const id = params.id as string

  const { data: message, isLoading } = useQuery({
    queryKey: ["message", id],
    queryFn: () => messageApi.get(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[600px] items-center justify-center">
           <div className="flex flex-col items-center gap-6">
              <div className="relative">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 <div className="absolute inset-0 h-12 w-12 animate-ping bg-primary/10 rounded-full" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Opening Message...</p>
           </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!message) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[600px] text-center">
           <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mb-8">
              <ShieldCheck className="h-10 w-10" />
           </div>
           <h2 className="text-2xl font-semibold tracking-tight mb-2">Message Not Found</h2>
           <p className="text-muted-foreground mb-8 max-w-sm">The message you are looking for has been purged or moved.</p>
           <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
              Return to Inbox
           </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto pb-20 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-10">
           <Button 
             variant="ghost" 
             onClick={() => router.back()}
             className="group h-11 px-4 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-all gap-3"
           >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Back to Inbox</span>
           </Button>
           
           <div className="flex items-center gap-3">
              <Button variant="outline" className="h-11 rounded-xl border-border/20 bg-background/50 hover:bg-accent/5 text-xs font-semibold gap-2">
                 <Download className="h-4 w-4 opacity-40" />
                 Download Original
              </Button>
              <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-border/20 bg-background/50 text-destructive/40 hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20">
                 <Trash2 className="h-4 w-4" />
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Message Content Main */}
           <div className="lg:col-span-2 space-y-8">
              <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm overflow-hidden">
                 <div className="p-10 space-y-10">
                    {/* Header Info */}
                    <div className="space-y-8">
                       <h1 className="text-3xl font-semibold text-foreground tracking-tight leading-tight">
                          {message.subject || "(No Subject)"}
                       </h1>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="flex items-start gap-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0">
                                <User className="h-5 w-5" />
                             </div>
                             <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest block">Sender</span>
                                <p className="text-sm font-medium text-foreground/80">{message.from}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-4">
                             <div className="h-10 w-10 rounded-xl bg-accent/30 flex items-center justify-center text-muted-foreground border border-border/10 shrink-0">
                                <Mail className="h-5 w-5" />
                             </div>
                             <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest block">Recipient</span>
                                <p className="text-sm font-medium text-foreground/80">{message.to}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-border/5" />

                    {/* Content Tabs */}
                    <Tabs defaultValue="html" className="w-full">
                       <div className="flex items-center justify-between mb-6">
                          <TabsList className="bg-muted/20 p-1 rounded-xl h-10">
                             <TabsTrigger value="html" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Preview</TabsTrigger>
                             <TabsTrigger value="text" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Plain Text</TabsTrigger>
                             <TabsTrigger value="source" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Original Source</TabsTrigger>
                             <TabsTrigger value="technical" className="rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Technical Details</TabsTrigger>
                          </TabsList>
                          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-lg text-muted-foreground/30 hover:text-primary">
                             <Maximize2 className="h-4 w-4" />
                          </Button>
                       </div>

                       <TabsContent value="html" className="mt-0 focus-visible:outline-none">
                          <div className="min-h-[400px] w-full rounded-2xl bg-white/40 border border-border/10 p-8 shadow-inner">
                             {message.html_body ? (
                               <iframe 
                                 srcDoc={message.html_body} 
                                 className="w-full h-full min-h-[400px] border-none"
                                 title="Message Preview"
                               />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground/20">
                                  <FileText className="h-12 w-12 mb-4" />
                                  <p className="text-xs font-bold uppercase tracking-widest">No HTML Payload Found</p>
                               </div>
                             )}
                          </div>
                       </TabsContent>

                       <TabsContent value="text" className="mt-0 focus-visible:outline-none">
                          <div className="min-h-[400px] w-full rounded-2xl bg-black/[0.02] border border-border/10 p-8 font-mono text-xs leading-relaxed text-foreground/70 whitespace-pre-wrap">
                             {message.text_body || "No plain text content captured."}
                          </div>
                       </TabsContent>

                       <TabsContent value="source" className="mt-0 focus-visible:outline-none">
                          <div className="min-h-[400px] w-full rounded-2xl bg-[#1e1e1e] border border-white/5 p-8 font-mono text-[11px] leading-relaxed text-blue-300/80 overflow-x-auto whitespace-pre">
                             {message.raw_content || "Message source not available."}
                          </div>
                       </TabsContent>

                       <TabsContent value="technical" className="mt-0 focus-visible:outline-none">
                          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-accent/30 border border-border/10 space-y-4">
                                   <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] block">Message Details</span>
                                   <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                         <span className="text-xs text-muted-foreground">Received</span>
                                         <span className="text-xs font-semibold">{new Date(message.received_at).toLocaleString()}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                         <span className="text-xs text-muted-foreground">Format</span>
                                         <span className="text-xs font-semibold">MIME-Multipart</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                         <span className="text-xs text-muted-foreground">Size</span>
                                         <span className="text-xs font-semibold">{(message.raw_content ? message.raw_content.length / 1024 : 0).toFixed(2)} KB</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                                   <span className="text-[10px] font-bold text-emerald-500/30 uppercase tracking-[0.2em] block">Security & Verification</span>
                                   <div className="flex items-center gap-3">
                                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                      <div>
                                         <p className="text-xs font-semibold text-emerald-500">MIME Verified</p>
                                         <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest font-bold">Standard Integrity Pass</p>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             <div className="p-8 rounded-2xl bg-muted/30 border border-border/10 space-y-4">
                                <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] block">Technical Headers</span>
                                <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                   <pre className="text-[11px] font-mono text-muted-foreground/70 whitespace-pre-wrap leading-relaxed">
                                      {message.headers || "No technical headers available."}
                                   </pre>
                                </div>
                             </div>
                          </div>
                       </TabsContent>
                    </Tabs>
                 </div>
              </Card>
           </div>

           {/* Sidebar: Attachments */}
           <div className="lg:col-span-1 space-y-8">
              {/* Attachments Card */}
              <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm">
                 <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                       <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">Attachments</span>
                       <Badge variant="outline" className="h-5 text-[10px] border-border/10 text-muted-foreground/40">{message.attachments?.length || 0}</Badge>
                    </div>
                    
                    {message.attachments && message.attachments.length > 0 ? (
                       <div className="space-y-3">
                          {message.attachments.map((file) => (
                             <div key={file.id} className="p-4 rounded-2xl bg-accent/40 border border-border/5 hover:border-primary/10 transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                   <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center text-muted-foreground/30 group-hover:text-primary transition-colors">
                                      <Paperclip className="h-4 w-4" />
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[11px] font-semibold text-foreground/70 truncate group-hover:text-foreground transition-colors">{file.filename}</p>
                                      <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                                   </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground/20 hover:text-primary hover:bg-primary/5">
                                   <Download className="h-4 w-4" />
                                </Button>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                          <Paperclip className="h-8 w-8 mb-3" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Empty Payload</p>
                       </div>
                    )}
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
