import { React, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from './state/UseAuthStore'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallBack'
import Dashboard from './pages/DashBoard'
import Protected from './components/Protected'

const router = createBrowserRouter([
  { path: '/login', element: <Login/> },
  { path: '/auth/callback', element: <AuthCallback/> },
  { path: '/', element: (
      <Protected>
        <Dashboard/>
      </Protected>
    )
  }
])

export default function App() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [])
  return <RouterProvider router={router}/>
}
