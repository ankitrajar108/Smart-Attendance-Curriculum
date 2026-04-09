"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, CheckCircle, Clock, BarChart3, BookOpen, Calendar, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface AttendanceStats {
  total: number
  present: number
  absent: number
  late: number
}

interface AttendanceRecord {
  id: string
  status: string
  markedAt: string
  courseName: string
  courseCode: string
  teacher: string
  startTime: string
  endTime: string
  dayOfWeek: string
}

export default function AttendancePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [markedSlots, setMarkedSlots] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, late: 0 })
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [markingSlot, setMarkingSlot] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [schedRes, recordsRes, todayRes] = await Promise.all([
        apiClient.get("/api/schedule/my"),
        apiClient.get("/api/attendance/records"),
        apiClient.get("/api/attendance/mark"),
      ])
      setSchedule(schedRes.data)
      setStats(recordsRes.data.stats || { total: 0, present: 0, absent: 0, late: 0 })
      setRecords(recordsRes.data.records?.slice(0, 10) || [])

      // Mark which slots are already marked today
      const todayMarked = new Set<string>(
        todayRes.data.map((r: any) => r.timetableSlotId)
      )
      setMarkedSlots(todayMarked)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (slotId: string) => {
    setMarkingSlot(slotId)
    try {
      await apiClient.post("/api/attendance/mark", { timetableSlotId: slotId })
      setMarkedSlots((prev) => new Set([...prev, slotId]))
      toast({ title: "✅ Attendance Marked!", description: "Your attendance has been recorded successfully." })
      fetchData()
    } catch (err: any) {
      toast({
        title: "Already Marked",
        description: err.response?.data?.message || "Attendance marking failed",
        variant: "destructive",
      })
    } finally {
      setMarkingSlot(null)
    }
  }

  const getCurrentSlot = () => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    return schedule.find((s) => s.startTime <= currentTime && s.endTime >= currentTime)
  }

  const currentSlot = getCurrentSlot()
  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  const statusColors: Record<string, string> = {
    PRESENT: "bg-green-500",
    ABSENT: "bg-red-500",
    LATE: "bg-yellow-500",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Track and manage your class attendance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
            <div className="text-sm text-muted-foreground">Attendance Rate</div>
            <Progress value={attendanceRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-muted-foreground">Late</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Class - Mark Attendance */}
      {currentSlot && (
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Clock className="w-4 h-4 text-blue-500" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{currentSlot.courseName}</span> is in progress!
                <span className="text-muted-foreground ml-2">
                  {currentSlot.startTime} - {currentSlot.endTime}
                </span>
              </div>
              {markedSlots.has(currentSlot.id) ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Marked
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => markAttendance(currentSlot.id)}
                  disabled={!!markingSlot}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Mark Now
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule with Mark Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>Mark your attendance for each class</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No classes today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((slot) => {
                  const isMarked = markedSlots.has(slot.id)
                  const isMarking = markingSlot === slot.id
                  const now = new Date().toTimeString().slice(0, 5)
                  const isPast = now > slot.endTime
                  const isCurrent = now >= slot.startTime && now <= slot.endTime

                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isCurrent ? "border-blue-500/50 bg-blue-500/5" : "border-border"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{slot.courseName}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.startTime} - {slot.endTime} · {slot.room}
                        </div>
                      </div>
                      {isMarked ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Done
                        </Badge>
                      ) : isPast ? (
                        <Badge variant="destructive">Missed</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          onClick={() => markAttendance(slot.id)}
                          disabled={!!markingSlot}
                        >
                          {isMarking ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <QrCode className="w-3 h-3 mr-1" />
                              Mark
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent History
            </CardTitle>
            <CardDescription>Your last 10 attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No records yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium text-sm">{record.courseName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.markedAt).toLocaleDateString()} · {record.dayOfWeek}
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${statusColors[record.status]}`} />
                    <Badge
                      variant={record.status === "PRESENT" ? "default" : record.status === "LATE" ? "secondary" : "destructive"}
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
