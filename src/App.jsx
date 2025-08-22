import { React, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from './state/UseAuthStore'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallBack'
import Dashboard from './pages/DashBoard'
import Protected from './components/Protected'
import { supabase } from '../supabase_connection'
import BoardPage from './pages/BoardPage'
import Signup from './pages/Signup'

supabase.auth.getSession().then(r => console.log('supabase OK', r.data?.session))

const router = createBrowserRouter([
  { path: '/signup', element: <Signup/> },
  { path: '/login', element: <Login/> },
  { path: '/auth/callback', element: <AuthCallback/> },
  { path: '/', element: (
      <Protected>
        <Dashboard/>
      </Protected>
    )
  },
  { path: '/board/:id', element: (
    <Protected>
      <BoardPage/>
    </Protected>
  )
}
])

export default function App() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [])
  return <RouterProvider router={router}/>
}
