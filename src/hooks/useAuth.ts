import { useState, useEffect } from 'react'
import { User } from '@/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('hook')

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const handleSignIn = () => {
    const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/callback/discord`
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`
    window.location.href = discordAuthUrl
  }

  const fetchUser = async () => {
    setIsLoadingAuth(true)
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user || null)
      } else {
        setUser(null)
      }
    } catch (error) {
      log.error('Failed to fetch user info', { error: error instanceof Error ? error.message : String(error) })
      setUser(null)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return {
    user,
    isLoadingAuth,
    handleSignIn,
    fetchUser,
  }
}