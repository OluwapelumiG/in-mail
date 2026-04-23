"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-query"
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
  Activity, 
  Github, 
  Facebook, 
  Chrome,
  Eye,
  EyeOff
} from "lucide-react"

const loginSchema = z.object({
  username: z.string().min(3, "Identification required"),
  password: z.string().min(6, "Security key too short"),
})

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  const loginMutation = useMutation({
    mutationFn: (values: z.infer<typeof loginSchema>) => 
      authApi.login(values.username, values.password),
    onSuccess: (data) => {
      login(data.token, { id: data.user_id, username: data.username, role: data.role as any })
      router.push("/dashboard")
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Access Denied: Invalid credentials")
    }
  })

  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")

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
    <div className="min-h-screen flex items-center justify-center bg-[#f2eee3] font-sans p-6">
      <Card className="w-full max-w-[450px] border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-foreground rounded-xl flex items-center justify-center mb-4">
              <Activity className="h-7 w-7 text-background" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#332a1c]">Welcome Back</h1>
            <p className="text-xs font-bold text-muted-foreground mt-1">Please enter your details to sign in</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <Button variant="outline" className="h-12 rounded-xl bg-white border-muted hover:bg-muted/30">
               <Chrome className="h-5 w-5 text-red-500" />
            </Button>
            <Button variant="outline" className="h-12 rounded-xl bg-white border-muted hover:bg-muted/30">
               <Facebook className="h-5 w-5 text-blue-600" />
            </Button>
            <Button variant="outline" className="h-12 rounded-xl bg-white border-muted hover:bg-muted/30">
               <Github className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-white px-4 text-muted-foreground">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest rounded-xl animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-[11px] font-black uppercase tracking-widest ml-1">Email address*</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl bg-white border-muted focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-black uppercase tracking-widest ml-1">Password*</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-white border-muted focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <Checkbox id="remember" className="rounded-md border-muted data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                 <label htmlFor="remember" className="text-[11px] font-bold text-muted-foreground cursor-pointer">Remember Me</label>
               </div>
               <button type="button" className="text-[11px] font-bold text-[#2d6a4f] hover:underline">Forgot Password?</button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-[#2d6a4f]/20 transition-all active:scale-[0.98]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authorizing...</span>
                </div>
              ) : (
                "Sign in to InMail Console"
              )}
            </Button>

            <p className="text-center text-[11px] font-bold text-muted-foreground">
               New on our platform? <button type="button" className="text-[#2d6a4f] hover:underline">Create an account</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
