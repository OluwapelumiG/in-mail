"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Settings as SettingsIcon, 
  Database, 
  Shield, 
  Zap, 
  Globe, 
  Bell, 
  HardDrive,
  Cpu,
  Fingerprint
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { configApi } from "@/lib/api"

export default function SettingsPage() {
  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get(),
  })

  const settingGroups = [
    {
      title: "Email Settings",
      description: "Manage system-level email behavior and routing",
      icon: <Database className="h-5 w-5" />,
      items: [
        { id: "persistence", label: "Save Message Content", description: "Save full email content to disk", checked: true },
        { id: "encryption", label: "Secure Storage", description: "Encrypt emails at rest using AES-256", checked: true },
        { id: "compression", label: "Storage Optimization", description: "Reduce storage space for repetitive emails", checked: false },
      ]
    },
    {
      title: "Real-time Monitoring",
      description: "Configure email activity and alert triggers",
      icon: <Zap className="h-5 w-5" />,
      items: [
        { id: "ws", label: "Live Updates", description: "Enable low-latency live updates", checked: true },
        { id: "alerts", label: "Anomaly Detection", description: "Notify on unusual email activity", checked: false },
      ]
    },
    {
      title: "Email Security",
      description: "Advanced scanning and filtering settings",
      icon: <Fingerprint className="h-5 w-5" />,
      items: [
        { id: "mime", label: "Deep Message Scan", description: "Scan all parts of the email including attachments", checked: true },
        { id: "heuristics", label: "Spam Protection", description: "Calculate spam and security risks", checked: true },
      ]
    }
  ]

  return (
    <DashboardLayout title="System Configuration" subtitle="Mail server & mailbox settings">
      <div className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-3">
           <Card className="premium-card lg:col-span-1 bg-primary/5 border-none shadow-none">
              <CardHeader className="p-8 pb-4">
                 <div className="p-3 bg-primary/10 rounded-2xl text-primary w-fit mb-4">
                    <Shield className="h-6 w-6" />
                 </div>
                 <CardTitle className="text-xl font-black tracking-tight">Server Health</CardTitle>
                 <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Version 2.4.0-Stable</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                       <span>Database Engine</span>
                       <span className="text-primary font-mono">PostgreSQL 15</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                       <span>Server Engine</span>
                       <span className="text-primary font-mono">Go/Fiber 2.0</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                       <span>Memory Usage</span>
                       <span className="text-primary font-mono">142 MB / 2 GB</span>
                    </div>
                 </div>
                 <Separator className="bg-primary/10" />
                 <Button variant="outline" className="w-full rounded-xl border-primary/20 bg-transparent text-primary font-semibold uppercase text-[10px] tracking-widest h-12 hover:bg-primary/5">
                    Run Server Check
                 </Button>
              </CardContent>
           </Card>

           <div className="lg:col-span-2 space-y-8">
              {settingGroups.map((group) => (
                <Card key={group.title} className="premium-card">
                  <CardHeader className="p-8 border-b border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-muted rounded-xl text-muted-foreground">
                          {group.icon}
                       </div>
                       <div>
                          <CardTitle className="text-lg font-semibold tracking-tight">{group.title}</CardTitle>
                          <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{group.description}</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 divide-y divide-border/50">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-6 first:pt-0 last:pb-0">
                         <div className="space-y-1">
                            <Label htmlFor={item.id} className="text-sm font-semibold tracking-tight cursor-pointer">{item.label}</Label>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{item.description}</p>
                         </div>
                         <Switch id={item.id} defaultChecked={item.checked} className="data-[state=checked]:bg-primary" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-end gap-4 p-8 bg-card/50 rounded-[2rem] border border-dashed border-border/50">
                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Configuration changes are atomic and permanent</p>
                 <Button className="rounded-xl px-10 h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20">Save Changes</Button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
