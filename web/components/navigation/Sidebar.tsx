"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Inbox, 
  Settings, 
  User, 
  Plus, 
  ChevronRight,
  LogOut,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApplication } from "@/contexts/ApplicationContext"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreateInboxDialog } from "@/components/forms/CreateInboxDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Sidebar() {
  const pathname = usePathname()
  const { inboxes, currentInbox, setCurrentInbox } = useApplication()
  const { logout, user } = useAuth()
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inboxes", href: "/messages", icon: Inbox },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Profile", href: "/profile", icon: User },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 flex flex-col border-r bg-card shadow-sm z-40">
      <div className="p-8 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
             <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground uppercase">InMail</span>
        </Link>
      </div>

      <div className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full h-14 justify-between px-4 rounded-2xl border-none bg-muted/40 hover:bg-muted/60 transition-all group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Inbox className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">Active Inbox</p>
                  <p className="text-sm font-semibold truncate text-foreground">{currentInbox?.name || "Select Inbox"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 shadow-2xl border-none">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">Switch Workspace</DropdownMenuLabel>
            <ScrollArea className="h-48">
              {inboxes.map((inbox) => (
                <DropdownMenuItem 
                  key={inbox.id} 
                  onSelect={() => setCurrentInbox(inbox)}
                  className="rounded-xl p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      currentInbox?.id === inbox.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <Inbox className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm">{inbox.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem onSelect={() => setShowCreateDialog(true)} className="rounded-xl p-3 cursor-pointer text-primary font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Create New Mailbox
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-semibold text-sm group",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", pathname === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {item.name}
              {pathname === item.href && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-6 border-t border-border/50">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-black">
                 {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-semibold truncate">{user?.username}</p>
                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Root Session</p>
              </div>
           </div>
           <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-destructive transition-colors" onClick={logout}>
              <LogOut className="h-5 w-5" />
           </Button>
        </div>
      </div>

      <CreateInboxDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </aside>
  )
}
