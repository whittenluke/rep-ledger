import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setStatus('ok')
          navigate('/', { replace: true })
        } else {
          setStatus('error')
          navigate('/login', { replace: true })
        }
      })
      .catch(() => {
        setStatus('error')
        navigate('/login', { replace: true })
      })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">
        {status === 'loading' ? 'Signing you in…' : status === 'error' ? 'Something went wrong.' : ''}
      </p>
    </div>
  )
}
