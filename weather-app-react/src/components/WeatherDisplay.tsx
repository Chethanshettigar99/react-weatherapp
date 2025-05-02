"use client"

import { useState, useEffect, type FormEvent } from "react"
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { db } from "../firebase"

// Import background images
import clearBg from "../img/sun.jpg"
import cloudsBg from "../img/cloud.jpeg"
import rainBg from "../img/rain.jpg"
import thunderstormBg from "../img/thunder.jpg"
import snowBg from "../img/snow.jpg"
import mistBg from "../img/mist.jpg"
import defaultBg from "../img/ind.jpg"

// Interfaces
interface Weather {
  main: string
  description: string
  icon: string
}
interface Main {
  temp: number
  feels_like: number
  humidity: number
}
interface Wind {
  speed: number
}
interface Sys {
  country: string
  sunrise: number
  sunset: number
}
interface Coord {
  lon: number
  lat: number
}
interface WeatherData {
  name: string
  sys: Sys
  main: Main
  weather: Weather[]
  wind: Wind
  coord: Coord
}
interface ForecastItem {
  dt: number
  main: Main
  weather: Weather[]
}

interface WeatherDisplayProps {
  user: any
  initialCity?: string | null
}

const WeatherDisplay = ({ user, initialCity = null }: WeatherDisplayProps) => {
  const [city, setCity] = useState<string>(initialCity || "")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastItem[] | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>(defaultBg)
  const [isCelsius, setIsCelsius] = useState<boolean>(true)
  const [favoriteCities, setFavoriteCities] = useState<string[]>([])

  // Replace with your actual API key
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY
  const baseUrl = "https://api.openweathermap.org/data/2.5/"

  useEffect(() => {
    if (user) {
      fetchFavoriteCities(user.uid)
    }
  }, [user])

  useEffect(() => {
    if (initialCity) {
      setCity(initialCity)
      fetchWeatherData(initialCity)
    }
  }, [initialCity])

  const fetchFavoriteCities = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const docSnap = await getDoc(userDocRef)
      if (docSnap.exists() && docSnap.data()?.favorites) {
        setFavoriteCities(docSnap.data().favorites)
      } else {
        // Initialize favorites if the document doesn't exist or has no favorites
        await updateDoc(userDocRef, { favorites: [] })
        setFavoriteCities([])
      }
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const celsiusToFahrenheit = (celsius: number): number => (celsius * 9) / 5 + 32
  const toggleTemperatureUnit = () => setIsCelsius(!isCelsius)

  const fetchWeatherData = async (cityName: string = city) => {
    if (!cityName) {
      setError("Please enter a city name.")
      setWeatherData(null)
      setForecastData(null)
      setBackgroundImage(defaultBg)
      return
    }

    setLoading(true)
    setError(null)
    setWeatherData(null)
    setForecastData(null)
    setBackgroundImage(defaultBg)

    try {
      const weatherUrl = `${baseUrl}weather?q=${cityName}&appid=${apiKey}&units=metric`
      const weatherResponse = await fetch(weatherUrl)
      if (!weatherResponse.ok) {
        throw new Error(`Could not find the city. Enter a valid name.`)
      }
      const currentWeatherData: WeatherData = await weatherResponse.json()
      setWeatherData(currentWeatherData)

      // Save search to history if user is logged in
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid)
          await updateDoc(userDocRef, {
            searchHistory: arrayUnion({
              city: currentWeatherData.name,
              country: currentWeatherData.sys.country,
              timestamp: new Date().toISOString(),
            }),
          })
        } catch (error) {
          console.error("Error saving search history:", error)
        }
      }

      const forecastUrl = `${baseUrl}forecast?q=${cityName}&appid=${apiKey}&units=metric`
      const forecastResponse = await fetch(forecastUrl)
      if (!forecastResponse.ok) {
        throw new Error(`Could not find the city. Enter a valid name.`)
      }
      const forecastJsonData = await forecastResponse.json()

      const dailyForecasts: { [date: string]: ForecastItem } = {}
      forecastJsonData.list.forEach((item: ForecastItem) => {
        const date = new Date(item.dt * 1000).toLocaleDateString()
        if (
          !dailyForecasts[date] ||
          Math.abs(new Date(item.dt * 1000).getHours() - 12) <
            Math.abs(new Date(dailyForecasts[date].dt * 1000).getHours() - 12)
        ) {
          dailyForecasts[date] = item
        }
      })

      const forecastArray = Object.values(dailyForecasts)
      setForecastData(forecastArray.slice(0, 7))
    } catch (err: any) {
      console.error("Fetching error:", err)
      setError(err.message || "Failed to fetch weather data. Check the city name and API key.")
      setWeatherData(null)
      setForecastData(null)
      setBackgroundImage(defaultBg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    fetchWeatherData()
  }

  const addToFavorites = async () => {
    if (!user) {
      setError("Please log in to add favorites.")
      return
    }
    if (weatherData?.name && favoriteCities.includes(weatherData.name)) {
      setError(`${weatherData.name} is already in your favorites.`)
      return
    }
    if (weatherData?.name) {
      try {
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          favorites: arrayUnion(weatherData.name),
        })
        setFavoriteCities([...favoriteCities, weatherData.name])
        setError(null)
      } catch (error) {
        console.error("Error adding to favorites:", error)
        setError("Failed to add to favorites. Please try again.")
      }
    }
  }

  useEffect(() => {
    if (weatherData && weatherData.weather.length > 0) {
      const condition = weatherData.weather[0].main.toLowerCase()
      switch (condition) {
        case "clear":
          setBackgroundImage(clearBg)
          break
        case "clouds":
          setBackgroundImage(cloudsBg)
          break
        case "rain":
        case "drizzle":
          setBackgroundImage(rainBg)
          break
        case "thunderstorm":
          setBackgroundImage(thunderstormBg)
          break
        case "snow":
          setBackgroundImage(snowBg)
          break
        case "mist":
        case "smoke":
        case "haze":
        case "fog":
          setBackgroundImage(mistBg)
          break
        default:
          setBackgroundImage(defaultBg)
          break
      }
    } else {
      setBackgroundImage(defaultBg)
    }
  }, [weatherData])

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

      {weatherData && !error && (
        <div className="weather-current">
          <div
            className="weather-background"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="weather-overlay">
              <h2 className="weather-title">
                Current Weather in {weatherData.name}, {weatherData.sys?.country}
              </h2>

              <div className="weather-info">
                <div className="weather-icon">
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                    alt={weatherData.weather[0].description}
                    className="w-24 h-24"
                  />
                </div>

                <div className="weather-details">
                  <div className="temp-display">
                    {isCelsius
                      ? `${weatherData.main.temp.toFixed(1)}`
                      : `${celsiusToFahrenheit(weatherData.main.temp).toFixed(1)}`}
                    <span className="unit">°{isCelsius ? "C" : "F"}</span>
                    <button onClick={toggleTemperatureUnit} className="temp-toggle-btn">
                      Switch to {isCelsius ? "°F" : "°C"}
                    </button>
                  </div>

                  <p className="weather-condition">
                    <strong>Condition:</strong> {weatherData.weather[0].description}
                  </p>

                  <p className="weather-meta">
                    <strong>Feels like:</strong>{" "}
                    {isCelsius
                      ? `${weatherData.main.feels_like.toFixed(1)}°C`
                      : `${celsiusToFahrenheit(weatherData.main.feels_like).toFixed(1)}°F`}
                  </p>

                  <p className="weather-meta">
                    <strong>Humidity:</strong> {weatherData.main.humidity}%
                  </p>

                  <p className="weather-meta">
                    <strong>Wind Speed:</strong> {weatherData.wind.speed} m/s
                  </p>

                  {user && (
                    <button
                      onClick={addToFavorites}
                      disabled={favoriteCities.includes(weatherData.name)}
                      className="favorite-btn"
                    >
                      {favoriteCities.includes(weatherData.name) ? "Added to Favorites" : "Add to Favorites"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {forecastData && forecastData.length > 0 && !error && (
        <div className="forecast">
          <h2 className="forecast-title">6-DAY FORECAST</h2>
          <div className="forecast-container">
            {forecastData.map((item, index) => (
              <div key={index} className="forecast-item">
                <div className="forecast-day">
                  {new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="forecast-icon">
                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                  />
                </div>
                <div className="forecast-desc">{item.weather[0].description}</div>
                <div className="forecast-temp">
                  {isCelsius ? `${item.main.temp.toFixed(0)}°` : `${celsiusToFahrenheit(item.main.temp).toFixed(0)}°`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherDisplay
