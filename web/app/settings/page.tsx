"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Inbox,
  Trash2,
  User,
  Mail,
  AlertTriangle,
  RefreshCw,
  AtSign,
} from "lucide-react"

import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { userApi, User as UserType } from "@/lib/api"

/* ─── Skeleton ─── */
function InboxSkeleton() {
  return (
    <div className="divide-y divide-border/40">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-8 py-5 animate-pulse">
          <div className="h-10 w-10 rounded-2xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded-full bg-muted" />
            <div className="h-2.5 w-28 rounded-full bg-muted/60" />
          </div>
          <div className="h-8 w-8 rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  )
}

/* ─── Single row ─── */
function InboxRow({
  inbox,
  isCurrentUser,
  onDeleteRequest,
}: {
  inbox: UserType
  isCurrentUser: boolean
  onDeleteRequest: (inbox: UserType) => void
}) {
  return (
    <div className="flex items-center gap-4 px-8 py-5 group hover:bg-muted/25 transition-colors duration-150">
      {/* Avatar */}
      <div
        className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold uppercase tracking-wider
          ${isCurrentUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
      >
        {inbox.username.charAt(0)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold tracking-tight truncate">{inbox.username}</span>
          {isCurrentUser && (
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
          {inbox.role === "root" && (
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Root
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <AtSign className="h-3 w-3 shrink-0" />
            {inbox.mailbox_name}
          </span>
          {inbox.email && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">
              <Mail className="h-3 w-3 shrink-0" />
              {inbox.email}
            </span>
          )}
        </div>
      </div>

      {/* Delete button — hidden until hover, disabled for self */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteRequest(inbox)}
        disabled={isCurrentUser}
        className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-0 disabled:pointer-events-none"
        title={isCurrentUser ? "Cannot delete your own inbox" : "Delete inbox"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

/* ─── Page ─── */
export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = React.useState<UserType | null>(null)

  /* Own identity */
  const { data: selfMailbox } = useQuery({
    queryKey: ["mailboxes"],
    queryFn: () => userApi.listMailboxes(),
    select: (data) => data[0],
  })

  /* Root: all users from admin endpoint */
  const {
    data: allUsers,
    isLoading: adminLoading,
    isError: adminError,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => userApi.listUsers(),
    retry: false,
  })

  /* Fallback for non-root: own mailboxes only */
  const { data: ownMailboxes, isLoading: ownLoading } = useQuery({
    queryKey: ["own-mailboxes"],
    queryFn: () => userApi.listMailboxes(),
    enabled: adminError,
  })

  const inboxes: UserType[] = allUsers ?? ownMailboxes ?? []
  const loading = adminError ? ownLoading : adminLoading
  const currentUserId = selfMailbox?.id

  /* Delete mutation */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      queryClient.invalidateQueries({ queryKey: ["own-mailboxes"] })
      setPendingDelete(null)
    },
    onError: () => {
      // keep dialog open so user sees it didn't work
    },
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    queryClient.invalidateQueries({ queryKey: ["own-mailboxes"] })
  }

  return (
    <DashboardLayout title="Inboxes" subtitle="Manage your email inboxes">
      <div className="max-w-3xl">
        <Card className="premium-card overflow-hidden">
          {/* Header */}
          <CardHeader className="px-8 py-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Inbox className="h-[18px] w-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold tracking-tight">All Inboxes</CardTitle>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-widest mt-0.5">
                  {loading
                    ? "Loading…"
                    : `${inboxes.length} inbox${inboxes.length !== 1 ? "es" : ""}`}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                onClick={refresh}
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>

          {/* Body */}
          <CardContent className="p-0">
            {loading ? (
              <InboxSkeleton />
            ) : inboxes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                <div className="h-14 w-14 rounded-3xl bg-muted flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">No inboxes found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {inboxes.map((inbox) => (
                  <InboxRow
                    key={inbox.id}
                    inbox={inbox}
                    isCurrentUser={inbox.id === currentUserId}
                    onDeleteRequest={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm delete dialog */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="rounded-3xl border border-border/60 bg-card max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight">Delete inbox?</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">{pendingDelete?.mailbox_name}</span>{" "}
              and all its messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteMutation.isError && (
            <p className="text-xs font-semibold text-destructive bg-destructive/10 rounded-xl px-4 py-2">
              Failed to delete inbox. Please try again.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl h-10 font-semibold flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="rounded-xl h-10 bg-destructive hover:bg-destructive/90 text-white font-semibold flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              {deleteMutation.isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : null}
              Delete inbox
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
