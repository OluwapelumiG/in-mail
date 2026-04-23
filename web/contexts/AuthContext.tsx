"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/api"
import { getToken, getUser, setToken, setUser, removeToken, removeUser } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null)
  const [token, setTokenState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    const savedToken = getToken()
    const savedUser = getUser()
    
    if (savedToken && savedUser) {
      setTokenState(savedToken)
      setUserState(savedUser)
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    setTokenState(newToken)
    setUserState(newUser)
    router.push("/dashboard")
  }

  const logout = () => {
    removeToken()
    removeUser()
    setTokenState(null)
    setUserState(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
