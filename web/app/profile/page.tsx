"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { userApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircledIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Loader2, Shield, Key, User as UserIcon, Lock } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [success, setSuccess] = React.useState("")
  const [error, setError] = React.useState("")

  const passwordMutation = useMutation({
    mutationFn: (password: string) => userApi.updatePassword(user?.id || "", password),
    onSuccess: () => {
      setSuccess("Password updated successfully.")
      setTimeout(() => setSuccess(""), 5000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update password.")
    }
  })

  const passwordShape = z.object({
    password: z.string().min(8, "Security key must be at least 8 characters"),
    confirmPassword: z.string()
  })

  const passwordSchema = passwordShape.refine(data => data.password === data.confirmPassword, {
    message: "Keys do not match",
    path: ["confirmPassword"]
  })

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setError("")
      passwordMutation.mutate(value.password)
    },
  })

  return (
    <DashboardLayout title="Administrator Profile" subtitle="Manage your account security">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
           <Card className="premium-card overflow-hidden">
              <div className="h-32 bg-gradient-to-tr from-primary to-accent" />
              <CardContent className="p-8 -mt-12 text-center">
                 <div className="inline-flex h-24 w-24 rounded-full border-4 border-card bg-muted items-center justify-center text-4xl font-black text-primary shadow-xl">
                    {user?.username?.charAt(0).toUpperCase()}
                 </div>
                 <h3 className="mt-4 text-2xl font-black tracking-tight">{user?.username}</h3>
                 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-1">System Administrator</p>
                 
                 <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/30 text-left">
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                       <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs font-semibold">Active</span>
                       </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 text-left">
                       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Role</p>
                       <span className="text-xs font-semibold uppercase">{user?.role}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="premium-card bg-zinc-950 text-white border-none shadow-2xl">
              <CardHeader className="p-8 pb-4">
                 <div className="flex items-center gap-3 text-primary">
                    <Shield className="h-5 w-5" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Security Audit</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                 <p className="text-xs text-zinc-400 leading-relaxed">
                    Last password rotation: <span className="text-white font-mono">Never</span>
                 </p>
                 <p className="text-xs text-zinc-400 leading-relaxed">
                    Active sessions: <span className="text-white font-mono">1 current</span>
                 </p>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-2">
           <Card className="premium-card">
              <CardHeader className="p-8 border-b border-border/50">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                       <Key className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight">Change Password</CardTitle>
                 </div>
                 <CardDescription className="text-xs font-semibold uppercase tracking-widest">Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                 {success && (
                    <Alert className="mb-8 border-green-500/20 bg-green-500/10 text-green-600 rounded-2xl animate-in fade-in slide-in-from-top-4">
                       <CheckCircledIcon className="h-4 w-4" />
                       <AlertDescription className="text-xs font-semibold uppercase tracking-widest">{success}</AlertDescription>
                    </Alert>
                 )}
                 {error && (
                    <Alert variant="destructive" className="mb-8 rounded-2xl bg-destructive/10 border-destructive/20 text-destructive">
                       <ExclamationTriangleIcon className="h-4 w-4" />
                       <AlertDescription className="text-xs font-semibold uppercase tracking-widest">{error}</AlertDescription>
                    </Alert>
                 )}

                 <form
                    onSubmit={(e) => {
                       e.preventDefault()
                       e.stopPropagation()
                       form.handleSubmit()
                    }}
                    className="space-y-8 max-w-md"
                 >
                    <form.Field
                       name="password"
                       validators={{
                          onChange: ({ value }) => {
                             const res = passwordShape.shape.password.safeParse(value)
                             return res.success ? undefined : res.error.issues[0].message
                          },
                       }}
                       children={(field) => (
                          <div className="space-y-3">
                             <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">New Password</Label>
                             <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                   id={field.name}
                                   name={field.name}
                                   type="password"
                                   value={field.state.value}
                                   onBlur={field.handleBlur}
                                   onChange={(e) => field.handleChange(e.target.value)}
                                   className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-mono"
                                />
                             </div>
                             {field.state.meta.errors ? (
                                <p className="text-[10px] text-destructive font-semibold uppercase tracking-widest ml-1">{field.state.meta.errors.join(", ")}</p>
                             ) : null}
                          </div>
                       )}
                    />

                     <form.Field
                        name="confirmPassword"
                        validators={{
                           onChange: ({ value }) => {
                              const res = passwordShape.shape.confirmPassword.safeParse(value)
                              return res.success ? undefined : res.error.issues[0].message
                           },
                        }}
                        children={(field) => (
                          <div className="space-y-3">
                             <Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Confirm Password</Label>
                             <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                   id={field.name}
                                   name={field.name}
                                   type="password"
                                   value={field.state.value}
                                   onBlur={field.handleBlur}
                                   onChange={(e) => field.handleChange(e.target.value)}
                                   className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-mono"
                                />
                             </div>
                             {field.state.meta.errors ? (
                                <p className="text-[10px] text-destructive font-semibold uppercase tracking-widest ml-1">{field.state.meta.errors.join(", ")}</p>
                             ) : null}
                          </div>
                       )}
                    />

                    <Button 
                       type="submit" 
                       className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                       disabled={passwordMutation.isPending}
                    >
                       {passwordMutation.isPending ? (
                          <div className="flex items-center gap-2">
                             <Loader2 className="h-4 w-4 animate-spin" />
                             <span>Updating Password...</span>
                          </div>
                       ) : (
                          "Update Password"
                       )}
                    </Button>
                 </form>
              </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
