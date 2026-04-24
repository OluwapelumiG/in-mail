"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Copy,
  Check,
  Zap,
  Key,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Globe,
  Database,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Settings as SettingsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { useApplication } from "@/contexts/ApplicationContext"
import { configApi, messageApi } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { currentInbox, isLoading: isAppLoading } = useApplication()
  const [copiedField, setCopiedField] = React.useState<string | null>(null)
  const [revealedFields, setRevealedFields] = React.useState<Record<string, boolean>>({})
  const [showCredentials, setShowCredentials] = React.useState(false)

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get(),
  })

  const { data: stats } = useQuery({
    queryKey: ["stats", currentInbox?.id],
    queryFn: async () => {
      if (!currentInbox) return []
      const res = await messageApi.list({ application_id: currentInbox.id, limit: 1000 })
      
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const grouped = last7Days.map(day => ({
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        count: res.messages.filter(m => m.received_at.startsWith(day)).length
      }))

      return grouped
    },
    enabled: !!currentInbox
  })

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const toggleReveal = (field: string) => {
    setRevealedFields(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (isAppLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
           <Loader2 className="h-6 w-6 animate-spin text-primary/20" />
        </div>
      </DashboardLayout>
    )
  }

  const credentials = [
    { id: "host", label: "SMTP Host", value: typeof window !== 'undefined' ? window.location.hostname : "localhost", icon: Globe, description: "Incoming mail server address" },
    { id: "ports", label: "SMTP Ports", value: config?.smtp_ports?.join(", ") || "25, 465, 587, 2525", icon: Zap, description: "Ports used for receiving emails" },
    { id: "apikey", label: "API Key", value: currentInbox?.api_key || "", icon: Key, secret: false, description: "Public identifier for this mailbox" },
    { id: "apisecret", label: "API Secret", value: currentInbox?.api_secret || "", icon: ShieldCheck, secret: true, description: "Secure access key for mailbox integration" },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight">Mailbox Overview</h1>
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                 Active Mailbox: <span className="text-foreground/60">{currentInbox?.name}</span>
               </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" className="h-11 rounded-xl border-border/20 bg-background/50 backdrop-blur-sm px-6 text-xs font-semibold gap-2 hover:bg-accent/5 transition-all">
                <Database className="h-4 w-4 opacity-40" />
                Database Settings
             </Button>
             <Button className="h-11 rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs tracking-widest shadow-xl shadow-primary/10 transition-all">
                REFRESH DATA
             </Button>
          </div>
        </div>

        {/* Server Configuration (Collapsible) */}
        <div className="space-y-6">
           <Button 
             variant="ghost" 
             onClick={() => setShowCredentials(!showCredentials)}
             className="group flex items-center gap-3 px-0 hover:bg-transparent text-muted-foreground/40 hover:text-primary transition-colors"
           >
              <div className={cn(
                "h-8 w-8 rounded-lg border border-border/10 flex items-center justify-center transition-all",
                showCredentials ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/20"
              )}>
                 <SettingsIcon className={cn("h-4 w-4 transition-transform duration-500", showCredentials && "rotate-90")} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{showCredentials ? "Hide Server Configuration" : "Show Server Configuration"}</span>
           </Button>

           {showCredentials && (
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-500">
                {credentials.map((cred, i) => {
                  const isRevealed = cred.secret ? revealedFields[cred.id] : true
                  return (
                    <Card key={i} className={cn(
                      "group border-border/30 bg-card/50 backdrop-blur-xl shadow-sm transition-all duration-500 overflow-hidden relative",
                      isRevealed && cred.secret && "ring-1 ring-primary/20 border-primary/20 shadow-primary/5"
                    )}>
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                          <cred.icon className="h-24 w-24 -rotate-12" />
                       </div>
                       <CardContent className="p-8">
                          <div className="flex flex-col gap-6">
                             {/* Label & Header */}
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                     "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 border",
                                     isRevealed && cred.secret 
                                       ? "bg-primary/10 text-primary border-primary/20" 
                                       : "bg-muted/20 text-muted-foreground/40 border-border/10"
                                   )}>
                                      {cred.secret ? (isRevealed ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />) : <cred.icon className="h-5 w-5" />}
                                   </div>
                                   <div>
                                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/30 block mb-0.5">{cred.label}</span>
                                      <p className="text-[10px] font-medium text-muted-foreground/20 italic">{cred.description}</p>
                                   </div>
                                </div>
                             </div>

                             {/* Value Display Box */}
                             <div className={cn(
                               "relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-500 group/value overflow-hidden",
                               isRevealed && cred.secret 
                                 ? "bg-primary/[0.02] border-primary/15" 
                                 : "bg-muted/30 border-border/5"
                             )}>
                                <div className="flex-1 min-w-0">
                                   <code className={cn(
                                     "text-sm font-semibold font-mono tracking-tight transition-all duration-500 block truncate",
                                     isRevealed 
                                       ? "text-foreground/90" 
                                       : "text-muted-foreground/20 tracking-[0.3em]"
                                   )}>
                                      {isRevealed ? cred.value : "••••••••••••••••••••••••••••••••"}
                                   </code>
                                </div>
                                
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                   {cred.secret && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       onClick={() => toggleReveal(cred.id)}
                                       className={cn(
                                         "h-9 w-9 rounded-lg transition-all",
                                         isRevealed 
                                           ? "text-primary bg-primary/10 hover:bg-primary/20" 
                                           : "text-muted-foreground/20 hover:text-foreground hover:bg-muted"
                                       )}
                                     >
                                       {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                     </Button>
                                   )}
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => copyToClipboard(cred.value, cred.label)}
                                     className={cn(
                                       "h-9 w-9 rounded-lg transition-all",
                                       copiedField === cred.label
                                         ? "text-emerald-500 bg-emerald-500/10"
                                         : "text-muted-foreground/20 hover:text-foreground hover:bg-muted"
                                     )}
                                   >
                                     {copiedField === cred.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                   </Button>
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  )
                })}
             </div>
           )}
        </div>

        {/* Analytics Section */}
        <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm p-10">
           <div className="flex items-center justify-between mb-12">
              <div>
                 <h3 className="text-2xl font-semibold text-foreground tracking-tight">Email Volume Analysis</h3>
                 <p className="text-[11px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Last 7 Days Activity
                 </p>
              </div>
              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest block mb-1">Peak Daily Emails</span>
                    <span className="text-lg font-semibold text-foreground">{(stats && Math.max(...stats.map(s => s.count))) || 0} msgs/d</span>
                 </div>
                 <div className="h-10 w-px bg-border/10" />
                 <div className="text-right">
                    <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest block mb-1">Total Received</span>
                    <span className="text-lg font-semibold text-foreground">{(stats || []).reduce((acc, curr) => acc + curr.count, 0)}</span>
                 </div>
              </div>
           </div>

           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                       <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="oklch(var(--border) / 0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'oklch(var(--muted-foreground) / 0.2)', letterSpacing: '0.15em' }}
                      dy={20}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'oklch(var(--muted-foreground) / 0.2)' }}
                      dx={-10}
                    />
                    <Tooltip 
                       cursor={{ stroke: 'oklch(var(--primary) / 0.2)', strokeWidth: 2 }}
                       contentStyle={{ 
                         backgroundColor: 'oklch(var(--card))', 
                         border: '1px solid oklch(var(--border) / 0.1)', 
                         borderRadius: '16px',
                         boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                         fontSize: '12px',
                         fontWeight: 600,
                         padding: '12px 16px'
                       }}
                       labelStyle={{ marginBottom: '8px', opacity: 0.3, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="oklch(var(--primary))" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      animationDuration={2000}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
