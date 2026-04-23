"use client"

import * as React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Loader2, 
  Bell, 
  Search, 
  LayoutDashboard, 
  Inbox, 
  Settings, 
  User, 
  Languages, 
  Activity,
  LogOut
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const { isLoading, user, logout } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inboxes", href: "/messages", icon: Inbox },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Profile", href: "/profile", icon: User },
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing Systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Header */}
      <header className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center">
               <Activity className="h-5 w-5 text-background" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase">InMail <span className="text-primary">CRM</span></h1>
          </div>

          <div className="flex-1 max-w-xl px-12">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Type to search..." 
                className="w-full h-10 rounded-lg bg-muted/50 border-none pl-10 text-xs focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Languages className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Activity className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
               {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Sub-Header Navigation */}
        <div className="border-t">
          <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "gap-2 px-4 h-10 rounded-lg text-xs font-bold transition-all",
                      pathname === item.href 
                        ? "bg-primary/5 text-primary" 
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {actions}
              <Button 
                variant="ghost" 
                onClick={logout}
                className="h-10 rounded-lg gap-2 text-xs font-bold text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="flex flex-col gap-8">
           {children}
        </div>
      </main>
    </div>
  )
}
