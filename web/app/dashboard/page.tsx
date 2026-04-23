"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  Plus,
  Zap,
  TrendingUp,
  MoreVertical,
  DollarSign,
  CreditCard,
  ChevronRight,
  Mail,
  Shield,
  ArrowUpRight,
  Sparkles,
  Trophy
} from "lucide-react"
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  LineChart,
  Line
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { EmptyState } from "@/components/EmptyState"
import { CreateInboxDialog } from "@/components/forms/CreateInboxDialog"
import { applicationApi, messageApi } from "@/lib/api"
import { useApplication } from "@/contexts/ApplicationContext"
import { cn } from "@/lib/utils"

const sparklineData = [
  { val: 10 }, { val: 25 }, { val: 15 }, { val: 40 }, { val: 30 }, { val: 55 }, { val: 45 }
]

export default function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const { currentInbox } = useApplication()

  const { data: inboxes, isLoading: isInboxesLoading } = useQuery({
    queryKey: ["inboxes"],
    queryFn: () => applicationApi.list(),
  })

  const { data: recentMessages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["recent-messages", currentInbox?.id],
    queryFn: () => messageApi.list({ application_id: currentInbox?.id, limit: 5 }),
    enabled: !!inboxes && inboxes.length > 0,
  })

  if (isInboxesLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
           <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  if (!inboxes || inboxes.length === 0) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Cluster Offline"
          description="Initialize your first forensic SMTP entry point to begin intercepting mail streams."
          actionLabel="Deploy First Node"
          onAction={() => setIsCreateOpen(true)}
        />
        <CreateInboxDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      actions={
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg h-10 px-6 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
        >
          Invite Members
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      {/* Top Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div>
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black tracking-tight">$88.5k</h3>
                 <span className="text-[10px] font-bold text-muted-foreground">-18%</span>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Total Profit</p>
           </div>
           <div className="h-12 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={sparklineData}>
                    <Bar dataKey="val" fill="#2d6a4f" radius={[2, 2, 0, 0]} barSize={4} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div>
              <h3 className="text-xl font-black tracking-tight">Order</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Last week</p>
           </div>
           <div className="h-12 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={sparklineData}>
                    <Bar dataKey="val" fill="#52b788" radius={[2, 2, 0, 0]} barSize={8} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black">124K</span>
              <span className="text-[10px] font-bold text-green-600">+12.6%</span>
           </div>
        </Card>

        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div>
              <h3 className="text-xl font-black tracking-tight">Profit</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Last Month</p>
           </div>
           <div className="h-12 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="val" stroke="#2d6a4f" strokeWidth={2} dot={{ r: 3, fill: "#2d6a4f" }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
           <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black">624K</span>
              <span className="text-[10px] font-bold text-green-600">+12.6%</span>
           </div>
        </Card>

        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div>
              <h3 className="text-xl font-black tracking-tight">User reach</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Last week</p>
           </div>
           <div className="h-12 w-full mt-4 flex items-center justify-center relative">
              <div className="h-12 w-12 rounded-full border-[6px] border-muted" />
              <div className="absolute h-12 w-12 rounded-full border-[6px] border-[#2d6a4f] border-t-transparent border-r-transparent -rotate-45" />
              <div className="absolute flex flex-col items-center">
                 <span className="text-[10px] font-black">500</span>
                 <span className="text-[8px] font-bold text-muted-foreground uppercase">Visitors</span>
              </div>
           </div>
           <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black">32K</span>
              <span className="text-[10px] font-bold text-green-600">+12%</span>
           </div>
        </Card>

        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div className="flex items-center justify-between">
              <div className="p-2 bg-[#d8f3dc] rounded-lg text-[#2d6a4f]">
                 <DollarSign className="h-4 w-4" />
              </div>
           </div>
           <div className="mt-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Income</p>
              <h3 className="text-xl font-black tracking-tight mt-1">$4,673</h3>
           </div>
           <div className="mt-4">
              <span className="px-2 py-1 bg-[#d8f3dc] text-[#2d6a4f] text-[8px] font-black uppercase rounded-md">+25.2%</span>
           </div>
        </Card>

        <Card className="premium-card p-6 flex flex-col justify-between min-h-[160px]">
           <div className="flex items-center justify-between">
              <div className="p-2 bg-[#f8edeb] rounded-lg text-destructive">
                 <CreditCard className="h-4 w-4" />
              </div>
           </div>
           <div className="mt-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Expense</p>
              <h3 className="text-xl font-black tracking-tight mt-1">$1.28K</h3>
           </div>
           <div className="mt-4">
              <span className="px-2 py-1 bg-[#f8edeb] text-destructive text-[8px] font-black uppercase rounded-md">-12.2%</span>
           </div>
        </Card>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 premium-card p-8">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-black tracking-tight">Total Transaction</h3>
                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Weekly overview</p>
              </div>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
           </div>
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                    { name: "Jan", val: 38 },
                    { name: "Feb", val: 52 },
                    { name: "Mar", val: 32 },
                    { name: "Apr", val: 12 },
                    { name: "May", val: 35 },
                    { name: "Jun", val: 28 },
                    { name: "Jul", val: 33 },
                    { name: "Aug", val: 25 },
                 ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted)/0.3)" }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                    <Bar dataKey="val" fill="#52b788" radius={[6, 6, 0, 0]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <div className="flex flex-col gap-8">
           {/* Report Card */}
           <Card className="premium-card p-8">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-sm font-black tracking-tight uppercase">Report</h3>
                 <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Last month transactions $23.4K</p>
              <div className="grid grid-cols-2 gap-8 mb-10">
                 <div className="text-center">
                    <div className="h-10 w-10 bg-[#d8f3dc] rounded-lg flex items-center justify-center mx-auto mb-3">
                       <DollarSign className="h-5 w-5 text-[#2d6a4f]" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">This week</p>
                    <p className="text-lg font-black">+82.46%</p>
                 </div>
                 <div className="text-center border-l">
                    <div className="h-10 w-10 bg-[#f8edeb] rounded-lg flex items-center justify-center mx-auto mb-3">
                       <CreditCard className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">This week</p>
                    <p className="text-lg font-black">-24.8%</p>
                 </div>
              </div>
              <div className="pt-8 border-t">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Performance</p>
                       <p className="text-xl font-black">+94.13%</p>
                    </div>
                    <Button className="h-10 px-6 rounded-lg bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-[10px] uppercase tracking-widest">View Report</Button>
                 </div>
              </div>
           </Card>

           {/* Total Sales Small Chart */}
           <Card className="premium-card p-8">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-black tracking-tight">Total sales</h3>
                 </div>
                 <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest rounded-md px-3 border-muted">Details</Button>
              </div>
              <div className="mb-8">
                 <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">$2,150.00</span>
                    <span className="px-1.5 py-0.5 bg-[#d8f3dc] text-[#2d6a4f] text-[8px] font-black rounded-md">+5%</span>
                 </div>
              </div>
              <div className="space-y-4 mb-8">
                 <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-3">
                       <div className="h-3 w-3 rounded-full border-2 border-muted" />
                       <span className="text-muted-foreground">Online Store</span>
                    </div>
                    <span className="font-black">$20k <span className="text-green-600 ml-1">+12.6%</span></span>
                 </div>
                 <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-3">
                       <div className="h-3 w-3 rounded-full border-2 border-muted" />
                       <span className="text-muted-foreground">Offline Store</span>
                    </div>
                    <span className="font-black">$20k <span className="text-destructive ml-1">-4.2%</span></span>
                 </div>
              </div>
              <div className="h-32 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                       { name: "10:00", val: 10 },
                       { name: "12:00", val: 30 },
                       { name: "14:00", val: 20 },
                       { name: "16:00", val: 40 },
                       { name: "18:00", val: 35 },
                       { name: "20:00", val: 55 },
                    ]}>
                       <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#52b788" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#52b788" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" hide />
                       <Area type="monotone" dataKey="val" stroke="#52b788" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                 </ResponsiveContainer>
                 <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground mt-2 px-1">
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                    <span>18:00</span>
                    <span>20:00</span>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Bottom Grid Sections */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upgrade Plan */}
        <Card className="premium-card p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black tracking-tight">Upgrade your plan</h3>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
           </div>
           <p className="text-[11px] font-bold text-muted-foreground leading-relaxed mb-8">
              To fully enjoy all the amazing features and benefits of our premium plan.
           </p>
           <div className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-[#2d6a4f] bg-[#d8f3dc]/20 flex items-center justify-between group cursor-pointer transition-all">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-[#2d6a4f] rounded-lg flex items-center justify-center">
                       <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                       <p className="text-xs font-black">Platinum</p>
                       <p className="text-[10px] font-bold text-[#2d6a4f]">Active Plan</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black">$5,550</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Per Year</p>
                 </div>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-xl border-muted hover:bg-muted/50 text-[10px] font-black uppercase tracking-widest">Choose Plan</Button>
           </div>
        </Card>

        {/* Earning Report */}
        <Card className="premium-card p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black tracking-tight">Earning Report</h3>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
           </div>
           <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-10">Weekly Earning overview</p>
           
           <div className="flex items-start gap-8 mb-10">
              <div className="p-3 bg-[#d8f3dc] rounded-lg text-[#2d6a4f]">
                 <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Net profit</p>
                 <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black">$1,623</span>
                    <span className="text-[10px] font-black text-green-600 flex items-center gap-1">
                       <ArrowUpRight className="h-3 w-3" /> 20.3%
                    </span>
                 </div>
              </div>
           </div>

           <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={sparklineData}>
                    <Bar dataKey="val" fill="#2d6a4f" radius={[4, 4, 0, 0]} barSize={30} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* Master Class Card */}
        <Card className="premium-card overflow-hidden">
           <CardContent className="p-0">
              <div className="p-8">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-muted border overflow-hidden" />
                       <div>
                          <p className="text-xs font-black">Design strategy master class</p>
                          <p className="text-[10px] font-bold text-muted-foreground">07 Jun 2025 at 10:00 PM</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
                 </div>
              </div>
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                 <img 
                    src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800" 
                    alt="Master class" 
                    className="w-full h-full object-cover opacity-80"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                 <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
                    <div className="flex -space-x-3">
                       {[1,2,3,4].map(i => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted" />
                       ))}
                       <div className="h-8 w-8 rounded-full border-2 border-white bg-[#2d6a4f] flex items-center justify-center text-[10px] font-bold text-white">
                          +12
                       </div>
                    </div>
                    <Button className="h-10 px-6 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/30">Join Now</Button>
                 </div>
              </div>
           </CardContent>
        </Card>
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
