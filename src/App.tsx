import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import { SessionUser } from './types'

export default function App() {
  const [session, setSession] = useState<SessionUser | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession({
          email: data.session.user.email ?? '',
          name: data.session.user.user_metadata?.name ?? 'User',
          id: data.session.user.id,
        })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      if (sessionData?.user) {
        setSession({
          email: sessionData.user.email ?? '',
          name: sessionData.user.user_metadata?.name ?? 'User',
          id: sessionData.user.id,
        })
      } else {
        setSession(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return session ? (
    <Dashboard session={session} onLogout={handleLogout} />
  ) : (
    <Auth onAuth={setSession} />
  )
}

