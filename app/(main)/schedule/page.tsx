"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, RefreshCw, BookOpen, ChevronRight } from "lucide-react"

interface ScheduleItem {
  id: string
  courseName: string
  courseCode: string
  startTime: string
  endTime: string
  dayOfWeek: string
  room: string
  teacher?: { name: string }
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun"
}

export default function SchedulePage() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [allSlots, setAllSlots] = useState<ScheduleItem[]>([])

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

  useEffect(() => {
    setSelectedDay(today)
    fetchAllSchedule()
  }, [])

  const fetchAllSchedule = async () => {
    setLoading(true)
    try {
      // Fetch for all days by fetching multiple times
      const results: ScheduleItem[] = []
      const seen = new Set<string>()

      // First get today
      const res = await apiClient.get("/api/schedule/my")
      const todayData: ScheduleItem[] = res.data

      // Now fetch entire week by calling with each day param
      const weekRes = await apiClient.get("/api/schedule/week")
      const weekData: ScheduleItem[] = weekRes.data
      setAllSlots(weekData)
      setSchedule(todayData)
    } catch {
      // Fallback: just use today
      try {
        const res = await apiClient.get("/api/schedule/my")
        setSchedule(res.data)
        setAllSlots(res.data)
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const daySlots = allSlots.filter((s) => s.dayOfWeek === selectedDay)
  const todaySlots = allSlots.filter((s) => s.dayOfWeek === today)

  const getStatusForSlot = (slot: ScheduleItem) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    if (slot.dayOfWeek !== today) return "other"
    if (currentTime >= slot.startTime && currentTime <= slot.endTime) return "current"
    if (currentTime > slot.endTime) return "completed"
    return "upcoming"
  }

  const statusColors: Record<string, string> = {
    current: "bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-300",
    completed: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300",
    upcoming: "bg-background border-border",
    other: "bg-background border-border",
  }

  const statusBadge: Record<string, string> = {
    current: "bg-blue-500 text-white",
    completed: "bg-green-500 text-white",
    upcoming: "",
    other: "",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllSchedule}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.map((day) => {
          const count = allSlots.filter((s) => s.dayOfWeek === day).length
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                selectedDay === day
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              } ${day === today ? "ring-2 ring-primary/30" : ""}`}
            >
              <div>{DAY_LABELS[day]}</div>
              <div className="text-xs opacity-70">{count} classes</div>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{allSlots.length}</div>
            <div className="text-sm text-muted-foreground">Total This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{todaySlots.length}</div>
            <div className="text-sm text-muted-foreground">Today's Classes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {todaySlots.filter((s) => getStatusForSlot(s) === "upcoming").length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {DAY_LABELS[selectedDay] || selectedDay} Schedule
            {selectedDay === today && <Badge variant="secondary">Today</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : daySlots.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No classes scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => {
                const status = getStatusForSlot(slot)
                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${statusColors[status]}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-semibold">{slot.startTime}</div>
                        <div className="text-xs text-muted-foreground">{slot.endTime}</div>
                      </div>
                      <div className="w-px h-10 bg-border" />
                      <div>
                        <h4 className="font-semibold">{slot.courseName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{slot.courseCode}</span>
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {slot.room}
                            </span>
                          )}
                          {slot.teacher && <span>· {slot.teacher.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === "current" && (
                        <Badge className={statusBadge[status]}>In Progress</Badge>
                      )}
                      {status === "completed" && (
                        <Badge className={statusBadge[status]}>Done</Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
