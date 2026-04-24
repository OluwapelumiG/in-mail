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
  Settings as SettingsIcon,
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
        <div className="flex h-[600px] items-center justify-center">
           <div className="flex flex-col items-center gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/20">Loading Dashboard...</p>
           </div>
        </div>
      </DashboardLayout>
    )
  }

  const credentials = [
    { id: "host", label: "SMTP Host", value: typeof window !== 'undefined' ? window.location.hostname : "localhost", icon: Globe },
    { id: "ports", label: "SMTP Ports", value: config?.smtp_ports || [25, 465, 587, 2525], icon: Zap },
    { id: "apikey", label: "API Key", value: currentInbox?.api_key || "", icon: Key, secret: false },
    { id: "apisecret", label: "API Secret", value: currentInbox?.api_secret || "", icon: ShieldCheck, secret: true },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 max-w-[1400px] mx-auto pb-24 px-6 md:px-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight">Mailbox Overview</h1>
            <div className="flex items-center gap-4">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                 Active Mailbox: <span className="text-foreground/60">{currentInbox?.name || "Initializing..."}</span>
               </span>
            </div>
          </div>
        
        </div>

        {/* Main Grid: Config and Analytics side-by-side */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
           
           {/* Left Column: Server Configuration */}
           <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="flex items-center gap-4 px-2">
                 <h3 className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.4em]">Server Configuration</h3>
                 <div className="h-px flex-1 bg-border/5" />
                 <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground/20" />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 {credentials.map((cred, i) => {
                   const isRevealed = cred.secret ? revealedFields[cred.id] : true
                   return (
                     <Card key={i} className={cn(
                       "group border-border/30 bg-card/50 backdrop-blur-xl shadow-sm transition-all duration-500 overflow-hidden relative",
                       isRevealed && cred.secret && "ring-1 ring-primary/20 border-primary/20 shadow-primary/5"
                     )}>
                        <CardContent className="p-5">
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500 border shrink-0",
                                      isRevealed && cred.secret 
                                        ? "bg-primary/10 text-primary border-primary/20 shadow-inner shadow-primary/5" 
                                        : "bg-muted/10 text-muted-foreground/20 border-border/5"
                                    )}>
                                       {cred.secret ? (isRevealed ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />) : <cred.icon className="h-4 w-4" />}
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 block">{cred.label}</span>
                                 </div>
                              </div>

                              <div className={cn(
                                "relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-500 group/value overflow-hidden",
                                isRevealed && cred.secret 
                                  ? "bg-primary/[0.03] border-primary/10" 
                                  : "bg-muted/10 border-border/5"
                              )}>
                                 <div className="flex-1 min-w-0">
                                    {cred.id === "ports" && Array.isArray(cred.value) ? (
                                      <div className="flex flex-wrap gap-2">
                                        {cred.value.map(port => (
                                          <Button
                                            key={port}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(port.toString(), `port-${port}`)}
                                            className="h-6 px-2 rounded-md bg-background text-[10px] font-mono tracking-wider transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                                          >
                                            {copiedField === `port-${port}` ? <Check className="h-3 w-3 mr-1" /> : null}
                                            {port}
                                          </Button>
                                        ))}
                                      </div>
                                    ) : (
                                      <code className={cn(
                                        "text-xs font-semibold font-mono tracking-tight transition-all duration-500 block truncate",
                                        isRevealed 
                                          ? "text-foreground/70" 
                                          : "text-muted-foreground/10 tracking-[0.5em]"
                                      )}>
                                         {isRevealed ? cred.value as string : "••••••••••••••••"}
                                      </code>
                                    )}
                                 </div>
                                 
                                 <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {cred.secret && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => toggleReveal(cred.id)}
                                        className={cn(
                                          "h-8 w-8 rounded-lg transition-all",
                                          isRevealed 
                                            ? "text-primary bg-primary/10 hover:bg-primary/20" 
                                            : "text-muted-foreground/20 hover:text-foreground hover:bg-muted/30"
                                        )}
                                      >
                                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      </Button>
                                    )}
                                    {cred.id !== "ports" && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => copyToClipboard(cred.value as string, cred.label)}
                                        className={cn(
                                          "h-8 w-8 rounded-lg transition-all",
                                          copiedField === cred.label
                                            ? "text-emerald-500 bg-emerald-500/10"
                                            : "text-muted-foreground/20 hover:text-foreground hover:bg-muted/30"
                                        )}
                                      >
                                        {copiedField === cred.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                      </Button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                   )
                 })}
              </div>
           </div>

           {/* Right Column: Analytics */}
           <div className="xl:col-span-8 flex flex-col gap-6">
              <div className="flex items-center gap-4 px-2">
                 <h3 className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.4em]">Email Volume Analysis</h3>
                 <div className="h-px flex-1 bg-border/5" />
                 <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/20" />
              </div>
              
              <Card className="border-border/30 bg-card/50 backdrop-blur-xl shadow-sm p-10 flex-1 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <TrendingUp className="h-64 w-64 -rotate-12" />
                 </div>
                 
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-8 relative z-10">
                    <div>
                       <h3 className="text-2xl font-semibold text-foreground tracking-tight">Email Volume Analysis</h3>
                       <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          Last 7 Days Activity
                       </p>
                    </div>
                    <div className="flex items-center gap-10">
                       <div className="text-right">
                          <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] block mb-1.5">Peak Daily Emails</span>
                          <span className="text-xl font-semibold text-foreground tabular-nums">{(stats && Math.max(...stats.map(s => s.count))) || 0} msgs/d</span>
                       </div>
                       <div className="h-10 w-px bg-border/10" />
                       <div className="text-right">
                          <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] block mb-1.5">Total Received</span>
                          <span className="text-xl font-semibold text-foreground tabular-nums">{(stats || []).reduce((acc, curr) => acc + curr.count, 0)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="h-[400px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={stats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                             <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="12 12" vertical={false} stroke="oklch(var(--border) / 0.04)" />
                          <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor', opacity: 0.6, letterSpacing: '0.1em' }}
                            dy={15}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 900, fill: 'oklch(var(--muted-foreground) / 0.2)' }}
                          />
                          <Tooltip 
                             cursor={{ stroke: 'oklch(var(--primary) / 0.1)', strokeWidth: 1 }}
                             contentStyle={{ 
                               backgroundColor: 'oklch(var(--card))', 
                               border: '1px solid oklch(var(--border) / 0.1)', 
                               borderRadius: '24px',
                               boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                               fontSize: '12px',
                               fontWeight: 800,
                               padding: '16px 20px',
                               backdropFilter: 'blur(20px)'
                             }}
                             labelStyle={{ marginBottom: '10px', opacity: 0.3, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.2em', fontWeight: 900 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="oklch(var(--primary))" 
                            strokeWidth={5} 
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            animationDuration={2500}
                            animationEasing="ease-in-out"
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
           </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
