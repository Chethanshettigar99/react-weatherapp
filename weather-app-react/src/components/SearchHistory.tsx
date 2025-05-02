"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { db } from "../firebase"

interface SearchHistoryItem {
  city: string
  country: string
  timestamp: string
}

interface SearchHistoryProps {
  userId: string
  onViewCity: (city: string) => void
}

const SearchHistory = ({ userId, onViewCity }: SearchHistoryProps) => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const userDocRef = doc(db, "users", userId)
        const docSnap = await getDoc(userDocRef)

        if (docSnap.exists() && docSnap.data()?.searchHistory) {
          setHistory(docSnap.data().searchHistory)
        } else {
          setHistory([])
        }
      } catch (error) {
        console.error("Error fetching search history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSearchHistory()
  }, [userId])

  const handleRemove = async (item: SearchHistoryItem) => {
    try {
      const userDocRef = doc(db, "users", userId)
      await updateDoc(userDocRef, {
        searchHistory: arrayRemove(item),
      })

      // Update local state
      setHistory(
        history.filter(
          (historyItem) =>
            !(
              historyItem.city === item.city &&
              historyItem.country === item.country &&
              historyItem.timestamp === item.timestamp
            ),
        ),
      )
    } catch (error) {
      console.error("Error removing history item:", error)
      alert("Failed to remove from history. Please try again.")
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

  if (history.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="empty-state">
            <h3 className="empty-title">No search history yet</h3>
            <p className="empty-description">Your search history will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Your Search History</h2>
      </div>
      <div className="card-content">
        <div className="overflow-x-auto">
          <table className="history-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Country</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index}>
                  <td>{item.city}</td>
                  <td>{item.country}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td>
                    <div className="history-actions">
                      <button className="history-view-btn" onClick={() => onViewCity(item.city)}>
                        View
                      </button>
                      <button className="history-remove-btn" onClick={() => handleRemove(item)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SearchHistory
