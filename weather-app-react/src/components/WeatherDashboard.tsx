"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import WeatherDisplay from "./WeatherDisplay"
import FavoritesList from "./FavoritesList"
import SearchHistory from "./SearchHistory"
import CountryDetails from "./CountryDetails"

interface WeatherDashboardProps {
  user: any
  initialTab?: "weather" | "favorites" | "history" | "details"
}

const WeatherDashboard = ({ user, initialTab = "weather" }: WeatherDashboardProps) => {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleViewCity = (city: string) => {
    setSelectedCity(city)
    setActiveTab("weather")
  }

  return (
    <div className="weather-dashboard">
      <div className="dashboard-container">
        <header className="header">
          <div>
            <h1 className="header-title text-3xl font-bold">
              Weather <span>Forecast</span>
            </h1>
            <p className="header-tagline">Your reliable weather companion</p>
          </div>
          <div className="auth-buttons">
            {!user ? (
              <>
                <Link to="/login" className="inline-btn">
                  Login
                </Link>
                <Link to="/register" className="inline-btn">
                  Register
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="inline-btn" >
                Logout
              </button>
            )}
          </div>
        </header>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "weather" ? "active" : ""}`}
            onClick={() => setActiveTab("weather")}
          >
            Weather
          </button>
          {user && (
            <>
              <button
                className={`tab-button ${activeTab === "favorites" ? "active" : ""}`}
                onClick={() => setActiveTab("favorites")}
              >
                Favorites
              </button>
              <button
                className={`tab-button ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Search History
              </button>
              <button
                className={`tab-button ${activeTab === "details" ? "active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                Geo Info and Sun Times
              </button>
            </>
          )}
        </div>

        <div>
          {activeTab === "weather" && <WeatherDisplay user={user} initialCity={selectedCity} />}
          {user && activeTab === "favorites" && <FavoritesList userId={user.uid} onViewCity={handleViewCity} />}
          {user && activeTab === "history" && <SearchHistory userId={user.uid} onViewCity={handleViewCity} />}
          {user && activeTab === "details" && <CountryDetails />}
        </div>
      </div>
    </div>
  )
}

export default WeatherDashboard
