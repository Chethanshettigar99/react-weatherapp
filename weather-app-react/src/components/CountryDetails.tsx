"use client"

import { useState, type FormEvent } from "react"

interface CountryData {
  name: string
  country: string
  sunrise: number
  sunset: number
  lat: number
  lon: number
}

const CountryDetails = () => {
  const [city, setCity] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countryData, setCountryData] = useState<CountryData | null>(null)

  // Replace with your actual API key
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
  const baseUrl = "https://api.openweathermap.org/data/2.5/"

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!city) {
      setError("Please enter a city name")
      return
    }

    setLoading(true)
    setError(null)
    setCountryData(null)

    try {
      const response = await fetch(`${baseUrl}weather?q=${city}&appid=${apiKey}`)

      if (!response.ok) {
        throw new Error("City not found. Please check the spelling and try again.")
      }

      const data = await response.json()

      setCountryData({
        name: data.name,
        country: data.sys.country,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        lat: data.coord.lat,
        lon: data.coord.lon,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-content">
          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="search-input"
            />
            <button type="submit" disabled={loading} className="search-button">
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="card-content">
            <div className="loading">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      )}

      {countryData && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {countryData.name}, {countryData.country}
            </h2>
          </div>
          <div className="card-content">
            <div className="country-grid">
              <div className="country-section">
                <h3 className="country-section-title">Coordinates</h3>
                <p className="country-data">Latitude: {countryData.lat.toFixed(4)}</p>
                <p className="country-data">Longitude: {countryData.lon.toFixed(4)}</p>
              </div>

              <div className="country-section">
                <h3 className="country-section-title">Sun Schedule</h3>
                <p className="country-data">Sunrise: {formatTime(countryData.sunrise)}</p>
                <p className="country-data">Sunset: {formatTime(countryData.sunset)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CountryDetails
