import { FormEvent, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import './Auth.css'
import { SessionUser } from './types'

export default function Auth({ onAuth }: { onAuth: (user: SessionUser) => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: string }>({
    text: '',
    type: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    if (!isSupabaseConfigured) {
      setMessage({
        text: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
        type: 'error',
      })
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        onAuth({
          email: data.user?.email ?? email,
          name: data.user?.user_metadata?.name ?? 'User',
          id: data.user?.id,
        })
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        setMessage({
          text: 'Check your email to confirm your account!',
          type: 'success',
        })
        setIsLogin(true)
        setEmail('')
        setPassword('')

        if (data.user) {
          onAuth({
            email: data.user.email ?? email,
            name: data.user.user_metadata?.name ?? 'New User',
            id: data.user.id,
          })
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        setMessage({ text: 'Something went wrong.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-circle">🔐</div>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to continue' : 'Sign up to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}
