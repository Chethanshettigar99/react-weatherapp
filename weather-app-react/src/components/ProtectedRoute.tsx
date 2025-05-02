import type React from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  user: any
  children: React.ReactNode
}

const ProtectedRoute = ({ user, children }: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
