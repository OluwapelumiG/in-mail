"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Application, applicationApi } from "@/lib/api"
import { useAuth } from "./AuthContext"

interface ApplicationContextType {
  inboxes: Application[]
  currentInbox: Application | null
  setCurrentInbox: (app: Application) => void
  isLoading: boolean
  refreshInboxes: () => Promise<void>
}

const ApplicationContext = React.createContext<ApplicationContextType | undefined>(undefined)

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [currentInboxId, setCurrentInboxId] = React.useState<string | null>(null)

  const { data: inboxes = [], isLoading } = useQuery({
    queryKey: ["inboxes"],
    queryFn: () => applicationApi.list(),
    enabled: isAuthenticated,
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("currentApplicationId")
      if (savedId) setCurrentInboxId(savedId)
    }
  }, [])

  const currentInbox = React.useMemo(() => {
    if (inboxes.length === 0) return null
    if (currentInboxId) {
      const found = inboxes.find(i => i.id === currentInboxId)
      if (found) return found
    }
    return inboxes[0]
  }, [inboxes, currentInboxId])

  const setCurrentInbox = (app: Application) => {
    setCurrentInboxId(app.id)
    localStorage.setItem("currentApplicationId", app.id)
  }

  const refreshInboxes = async () => {
    await queryClient.invalidateQueries({ queryKey: ["inboxes"] })
  }

  return (
    <ApplicationContext.Provider
      value={{
        inboxes,
        currentInbox,
        setCurrentInbox,
        isLoading,
        refreshInboxes,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function useApplication() {
  const context = React.useContext(ApplicationContext)
  if (context === undefined) {
    throw new Error("useApplication must be used within an ApplicationProvider")
  }
  return context
}
