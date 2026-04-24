"use client"

import * as React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Loader2, 
  Bell, 
  Search, 
  LayoutDashboard, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Inbox,
  Mail
} from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TeamSwitcher } from "@/components/TeamSwitcher"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, user, logout } = useAuth()
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Messages", href: "/messages", icon: Mail },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Integrated Header Unit */}
      <header className="bg-background sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 pt-6 pb-2">
          {/* Top Row */}
          <div className="flex items-center justify-between pb-6">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-md flex items-center justify-center shadow-md shadow-black/5 overflow-hidden border border-border/10">
                 <Image src="/inmail.png" alt="InMail Logo" width={40} height={40} className="object-contain" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground/90 uppercase">INMAIL</span>
            </div>

            {/* Search Bar - Centered */}
            <div className="flex-1 max-w-sm mx-12">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Type to search..." 
                  className="w-full h-10 rounded-md bg-muted/40 border-border/10 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/20 text-sm font-medium pl-11"
                />
              </div>
            </div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                 <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:text-primary relative transition-colors">
                   <Bell className="h-5 w-5" />
                   <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-destructive rounded-full border-2 border-background" />
                 </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 border border-border/40 shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-accent text-[11px] font-semibold text-foreground/70">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 font-medium">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive font-medium">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* User's manual border row */}
        <div className="max-w-[1400px] mx-auto px-8 border-t-2 border-b-2 border-border/500">
          {/* Sub-Nav Row */}
          <div className="flex items-center justify-between h-14">
            <nav className="flex items-center h-full">
              {navItems.map((item) => {
                const active = pathname === item.href
                return (
                  <Link key={item.name} href={item.href} className="h-full">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "gap-2 px-6 h-full rounded-none text-sm font-bold transition-all relative",
                        active 
                          ? "text-primary" 
                          : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/20"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground/20")} />
                      {item.name}
                      {active && (
                        <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary" />
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
               <TeamSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 py-10 antialiased">
        <div className="flex flex-col gap-8">
           {children}
        </div>
      </main>
    </div>
  )
}
