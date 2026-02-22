import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BottomNav } from '@/components/layout/BottomNav'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { StartWorkoutProvider } from '@/contexts/StartWorkoutContext'
import { Login } from '@/app/routes/Login'
import { AuthCallback } from '@/app/routes/AuthCallback'
import { Dashboard } from '@/app/routes/Dashboard'
import { Calendar } from '@/app/routes/Calendar'
import { Progress } from '@/app/routes/Progress'
import { More } from '@/app/routes/More'
import { Exercises } from '@/app/routes/Exercises'
import { Builder } from '@/app/routes/Builder'
import { TemplateEdit } from '@/app/routes/TemplateEdit'
import { ActiveWorkout } from '@/app/routes/ActiveWorkout'
import { History } from '@/app/routes/History'
import { SessionDetail } from '@/app/routes/SessionDetail'
import { Settings } from '@/app/routes/Settings'

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Outlet />
      </main>
      <InstallPrompt />
      <BottomNav />
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    element: (
      <StartWorkoutProvider>
        <AuthGuard>
          <AuthenticatedLayout />
        </AuthGuard>
      </StartWorkoutProvider>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'calendar', element: <Calendar /> },
      { path: 'progress', element: <Progress /> },
      { path: 'more', element: <More /> },
      { path: 'exercises', element: <Exercises /> },
      { path: 'builder', element: <Builder /> },
      { path: 'builder/:id', element: <TemplateEdit /> },
      { path: 'session/:id', element: <ActiveWorkout /> },
      { path: 'history', element: <History /> },
      { path: 'history/:sessionId', element: <SessionDetail /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
