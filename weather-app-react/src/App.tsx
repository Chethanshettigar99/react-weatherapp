"use client"

import { useState, useEffect } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import Login from "./components/Login"
import Register from "./components/Register"
import WeatherDashboard from "./components/WeatherDashboard"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAuthChange = (user: any) => {
    setUser(user)
    navigate("/")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<WeatherDashboard user={user} />} />
      <Route path="/login" element={<Login onAuthChange={handleAuthChange} />} />
      <Route path="/register" element={<Register onAuthChange={handleAuthChange} />} />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute user={user}>
            <WeatherDashboard user={user} initialTab="favorites" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute user={user}>
            <WeatherDashboard user={user} initialTab="history" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/details"
        element={
          <ProtectedRoute user={user}>
            <WeatherDashboard user={user} initialTab="details" />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
