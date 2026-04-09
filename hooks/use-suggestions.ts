"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export interface ActivitySuggestion {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: number
  relevantCourses: string[]
}

export const useSuggestions = () => {
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get("/api/suggestions/my")
      setSuggestions(response.data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch suggestions")
      console.error("Suggestions fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  return { suggestions, isLoading, error, refetch: fetchSuggestions }
}
