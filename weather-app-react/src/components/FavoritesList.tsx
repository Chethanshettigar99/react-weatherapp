"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { db } from "../firebase"

interface FavoritesListProps {
  userId: string
  onViewCity: (city: string) => void
}

const FavoritesList = ({ userId, onViewCity }: FavoritesListProps) => {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const userDocRef = doc(db, "users", userId)
        const docSnap = await getDoc(userDocRef)

        if (docSnap.exists() && docSnap.data()?.favorites) {
          setFavorites(docSnap.data().favorites)
        } else {
          setFavorites([])
        }
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [userId])

  const handleRemove = async (city: string) => {
    try {
      const userDocRef = doc(db, "users", userId)
      await updateDoc(userDocRef, {
        favorites: arrayRemove(city),
      })

      // Update local state
      setFavorites(favorites.filter((item) => item !== city))
    } catch (error) {
      console.error("Error removing favorite:", error)
      alert("Failed to remove from favorites. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="empty-state">
            <h3 className="empty-title">No favorite cities yet</h3>
            <p className="empty-description">Search for a city and add it to your favorites</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Your Favorite Cities</h2>
      </div>
      <div className="card-content">
        <div className="favorites-grid">
          {favorites.map((city, index) => (
            <div key={index} className="favorite-card">
              <div className="favorite-image">
                <span className="favorite-initial">{city.charAt(0).toUpperCase()}</span>
              </div>
              <div className="favorite-content">
                <h3 className="favorite-name">{city}</h3>
                <div className="favorite-actions">
                  <button className="view-btn" onClick={() => onViewCity(city)}>
                    View Weather
                  </button>
                  <button className="remove-btn" onClick={() => handleRemove(city)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FavoritesList
