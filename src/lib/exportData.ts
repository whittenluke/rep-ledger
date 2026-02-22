import { supabase } from '@/lib/supabase'

export interface ExportedData {
  exportedAt: string
  version: 1
  exercises: unknown[]
  workout_templates: unknown[]
  template_exercises: unknown[]
  scheduled_workouts: unknown[]
  workout_sessions: unknown[]
  session_sets: unknown[]
}

export async function exportUserData(): Promise<ExportedData> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const [exercisesRes, templatesRes, scheduledRes, sessionsRes] = await Promise.all([
    supabase.from('exercises').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('workout_templates').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('scheduled_workouts').select('*').eq('user_id', user.id).order('scheduled_date'),
    supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
  ])

  if (exercisesRes.error) throw exercisesRes.error
  if (templatesRes.error) throw templatesRes.error
  if (scheduledRes.error) throw scheduledRes.error
  if (sessionsRes.error) throw sessionsRes.error

  const templateIds = (templatesRes.data ?? []).map((t: { id: string }) => t.id)
  const sessionIds = (sessionsRes.data ?? []).map((s: { id: string }) => s.id)

  const [templateExercisesRes, sessionSetsRes] = await Promise.all([
    templateIds.length > 0
      ? supabase.from('template_exercises').select('*').in('template_id', templateIds)
      : Promise.resolve({ data: [], error: null }),
    sessionIds.length > 0
      ? supabase.from('session_sets').select('*').in('session_id', sessionIds).order('logged_at')
      : Promise.resolve({ data: [], error: null }),
  ])

  if (templateExercisesRes.error) throw templateExercisesRes.error
  if (sessionSetsRes.error) throw sessionSetsRes.error

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    exercises: exercisesRes.data ?? [],
    workout_templates: templatesRes.data ?? [],
    template_exercises: templateExercisesRes.data ?? [],
    scheduled_workouts: scheduledRes.data ?? [],
    workout_sessions: sessionsRes.data ?? [],
    session_sets: sessionSetsRes.data ?? [],
  }
}
