import  React  from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../state/UseAuthStore'

export default function Protected({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="p-6">Chargement…</div>
  return user ? children : <Navigate to="/login" replace />
}

Protected.propTypes = {
  children: PropTypes.node
}
