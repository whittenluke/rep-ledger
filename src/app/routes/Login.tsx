import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }
    setStatus('sent')
    setMessage('Check your email for the magic link.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">Rep Ledger</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with a magic link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading' || status === 'sent'}
            className={cn(
              'w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
              'disabled:opacity-50'
            )}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'sent' || !email.trim()}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-primary-foreground bg-accent',
              'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {status === 'loading' ? 'Sending…' : status === 'sent' ? 'Check your email' : 'Send magic link'}
          </button>
        </form>
        {message && (
          <p
            className={cn(
              'text-sm text-center',
              status === 'error' ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
