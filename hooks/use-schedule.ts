"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export interface ScheduleItem {
  id: string
  courseName: string
  courseCode: string
  startTime: string
  endTime: string
  dayOfWeek: string
  teacher?: {
    name: string
  }
}

export const useSchedule = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get("/api/schedule/my")
      setSchedule(response.data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch schedule")
      console.error("Schedule fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [])

  return { schedule, isLoading, error, refetch: fetchSchedule }
}
