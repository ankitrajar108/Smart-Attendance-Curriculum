"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, Users, CheckCircle, XCircle, AlertCircle, RefreshCw, Clock } from "lucide-react"

interface AttendanceRecord {
  id: string
  status: string
  markedAt: string
  student: {
    id: string
    user: { name: string; email: string }
  }
}

interface TimetableSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  class: {
    courseName: string
    courseCode: string
  }
  attendanceRecords: AttendanceRecord[]
}

interface AttendanceData {
  slots: TimetableSlot[]
  stats: {
    total: number
    present: number
    absent: number
    late: number
  }
}

export default function TeacherAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/attendance/records")
      setData(res.data)
      if (res.data.slots?.length > 0) {
        setSelectedSlot(res.data.slots[0])
      }
    } catch { }
    finally { setLoading(false) }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "ABSENT": return <XCircle className="w-4 h-4 text-red-500" />
      case "LATE": return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const attendanceRate = data?.stats
    ? data.stats.total > 0
      ? Math.round((data.stats.present / data.stats.total) * 100)
      : 0
    : 0

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
  const todaySlots = data?.slots.filter((s) => s.dayOfWeek === today) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Attendance</h1>
          <p className="text-muted-foreground">Monitor student attendance across your classes</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
            <div className="text-sm text-muted-foreground">Overall Rate</div>
            <Progress value={attendanceRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{data?.stats.present || 0}</div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{data?.stats.absent || 0}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{data?.stats.late || 0}</div>
            <div className="text-sm text-muted-foreground">Late</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Slot List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
            <CardDescription>Select a session to view attendance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : !data?.slots.length ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No sessions found</div>
            ) : (
              <div className="divide-y">
                {data.slots.map((slot) => {
                  const recordCount = slot.attendanceRecords.length
                  const isToday = slot.dayOfWeek === today
                  return (
                    <button
                      key={slot.id}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedSlot?.id === slot.id ? "bg-primary/5 border-l-2 border-primary" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <div className="font-medium text-sm">{slot.class.courseName}</div>
                      <div className="text-xs text-muted-foreground">
                        {slot.dayOfWeek.slice(0, 3)} · {slot.startTime}–{slot.endTime}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{recordCount} records</Badge>
                        {isToday && <Badge className="text-xs bg-blue-500 text-white">Today</Badge>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedSlot ? (
                <>
                  {selectedSlot.class.courseName} — {selectedSlot.class.courseCode}
                </>
              ) : "Select a session"}
            </CardTitle>
            {selectedSlot && (
              <CardDescription>
                {selectedSlot.dayOfWeek} · {selectedSlot.startTime}–{selectedSlot.endTime} · {selectedSlot.room}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedSlot ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3" />
                Select a session from the left
              </div>
            ) : selectedSlot.attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3" />
                No attendance records for this session yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSlot.attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.student.user.name}</div>
                        <div className="text-xs text-muted-foreground">{record.student.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(record.status)}
                          <Badge
                            variant={
                              record.status === "PRESENT" ? "default" :
                              record.status === "LATE" ? "secondary" : "destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(record.markedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
