"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  LogOut,
  ChevronDown,
  Globe,
  Mail,
  Command,
  Eye,
  EyeOff
} from "lucide-react"
import Image from "next/image"

const loginSchema = z.object({
  username: z.string().min(3, "Identification required"),
  password: z.string().min(6, "Security key too short"),
})

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

  const loginMutation = useMutation({
    mutationFn: (values: z.infer<typeof loginSchema>) => 
      authApi.login(values.username, values.password),
    onSuccess: (data) => {
      login(data.token, { id: data.user_id, username: data.username, role: data.role } as any)
      router.push("/dashboard")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Access Denied: Invalid credentials")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const res = loginSchema.safeParse({ username, password })
    if (!res.success) {
      setError(res.error.issues[0].message)
      return
    }
    loginMutation.mutate({ username, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans p-6 relative overflow-hidden bg-background">
      {/* Faint Watermark Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: 'url("/inmail.png")', 
             backgroundSize: '120px 120px',
             backgroundRepeat: 'repeat'
           }} />

      <Card className="w-full max-w-[440px] border border-border/40 shadow-xl rounded-xl overflow-hidden bg-card z-10">
        {/* Decorative Top Section */}
        <div className="h-24 w-full bg-accent/20 relative overflow-hidden flex items-center justify-center border-b border-border/20">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="flex items-center gap-3 z-10">
             <div className="h-10 w-10 bg-white rounded-md flex items-center justify-center shadow-lg shadow-black/5 overflow-hidden border border-border/10">
                <Image src="/inmail.png" alt="InMail Logo" width={40} height={40} className="object-contain" />
             </div>
             <span className="text-xl font-semibold tracking-tight text-foreground/90 uppercase">INMAIL</span>
          </div>
        </div>

        <CardContent className="p-8 pt-10">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-3xl font-black tracking-tight text-foreground font-sans">Welcome Back</h1>
            <p className="text-[13px] font-semibold text-muted-foreground mt-2 font-sans opacity-70">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive text-[11px] font-semibold uppercase tracking-widest rounded-lg animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="username" className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 ml-0.5">Username*</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-lg bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm placeholder:text-muted-foreground/30"
                required 
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70 ml-0.5">Password*</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/20 text-sm placeholder:text-muted-foreground/30"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2.5">
                 <Checkbox id="remember" className="rounded border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                 <label htmlFor="remember" className="text-[12px] font-medium text-muted-foreground/70 cursor-pointer">Remember Me</label>
               </div>
               <button type="button" className="text-[12px] font-semibold text-primary hover:underline transition-all">Forgot Password?</button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-[0.15em] text-[12px] shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authorizing...</span>
                </div>
              ) : (
                "Sign in to InMail Console"
              )}
            </Button>

            <p className="text-center text-[12px] font-medium text-muted-foreground/70 leading-relaxed">
               New on our platform? <button type="button" className="text-primary font-semibold hover:underline ml-1">Create an account</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

