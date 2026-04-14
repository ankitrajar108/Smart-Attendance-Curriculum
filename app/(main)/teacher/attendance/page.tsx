"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart3, Users, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Clock, QrCode, Loader2, X, Wifi, UserCheck
} from "lucide-react"
import QRCode from "qrcode"

interface AttendanceRecord {
  id: string
  status: string
  markedAt: string
  student: { id: string; user: { name: string; email: string } }
}

interface TimetableSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  class: { courseName: string; courseCode: string }
  attendanceRecords: AttendanceRecord[]
}

interface SessionStatus {
  token: string
  courseName: string
  courseCode: string
  scannedCount: number
  enrolledTotal: number
  expiresAt: number
  isExpired: boolean
  secondsLeft: number
  scannedStudents: { id: string; name: string; email: string }[]
}

interface ActiveSession {
  token: string
  qrDataUrl: string
  qrData: string
  slotId: string
  slotInfo: { courseName: string; courseCode: string; startTime: string; endTime: string; room: string }
  expiresAt: number
}

export default function TeacherAttendancePage() {
  const [data, setData] = useState<{ slots: TimetableSlot[]; stats: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [startingSlotId, setStartingSlotId] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/attendance/records")
      setData(res.data)
      if (res.data.slots?.length > 0 && !selectedSlot) {
        setSelectedSlot(res.data.slots[0])
      }
    } catch { }
    finally { setLoading(false) }
  }

  const pollSessionStatus = useCallback(async (token: string) => {
    try {
      const res = await apiClient.get(`/api/attendance/session/status/${token}`)
      setSessionStatus(res.data)
      if (res.data.isExpired) {
        stopPolling()
      }
    } catch {
      stopPolling()
    }
  }, [])

  const startPolling = useCallback((token: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollSessionStatus(token)
    pollRef.current = setInterval(() => pollSessionStatus(token), 3000)
  }, [pollSessionStatus])

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  const startQRSession = async (slotId: string) => {
    setStartingSlotId(slotId)
    try {
      const res = await apiClient.post("/api/attendance/session/start", { timetableSlotId: slotId })
      const { token, qrData, expiresAt, slotInfo } = res.data

      // Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })

      setActiveSession({ token, qrDataUrl, qrData, slotId, slotInfo, expiresAt })
      setQrModalOpen(true)
      startPolling(token)
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start QR session")
    } finally {
      setStartingSlotId(null)
    }
  }

  const closeSession = async () => {
    if (!activeSession) return
    stopPolling()
    try {
      await apiClient.delete(`/api/attendance/session/status/${activeSession.token}`)
    } catch { }
    setActiveSession(null)
    setSessionStatus(null)
    setQrModalOpen(false)
    fetchData()
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "PRESENT": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "ABSENT": return <XCircle className="w-4 h-4 text-red-500" />
      case "LATE": return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const attendanceRate = data?.stats?.total > 0
    ? Math.round((data.stats.present / data.stats.total) * 100) : 0

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

  const secondsLeft = sessionStatus?.secondsLeft ?? 0
  const timerPercent = Math.max(0, (secondsLeft / 300) * 100)
  const timerColor = secondsLeft > 120 ? "bg-green-500" : secondsLeft > 60 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Attendance</h1>
          <p className="text-muted-foreground">Monitor student attendance — manual or QR session</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Session Banner */}
      {activeSession && (
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>QR Session Active</strong> — {activeSession.slotInfo.courseName}
              {sessionStatus && (
                <span className="ml-3 text-muted-foreground">
                  {sessionStatus.scannedCount}/{sessionStatus.enrolledTotal} scanned · {sessionStatus.secondsLeft}s left
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setQrModalOpen(true)}>
                <QrCode className="w-4 h-4 mr-1" /> Show QR
              </Button>
              <Button size="sm" variant="destructive" onClick={closeSession}>
                <X className="w-4 h-4 mr-1" /> Close Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
            <CardDescription>Select session · Start QR</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : !data?.slots.length ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No sessions found</div>
            ) : (
              <div className="divide-y">
                {data.slots.map((slot) => {
                  const isToday = slot.dayOfWeek === today
                  const isActiveSlot = activeSession?.slotId === slot.id
                  return (
                    <div key={slot.id} className={`${selectedSlot?.id === slot.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                      <button
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="font-medium text-sm">{slot.class.courseName}</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.dayOfWeek.slice(0, 3)} · {slot.startTime}–{slot.endTime}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{slot.attendanceRecords.length} records</Badge>
                          {isToday && <Badge className="text-xs bg-blue-500 text-white">Today</Badge>}
                          {isActiveSlot && <Badge className="text-xs bg-green-500 text-white animate-pulse">QR Active</Badge>}
                        </div>
                      </button>
                      {/* QR Start Button */}
                      <div className="px-3 pb-3">
                        <Button
                          size="sm"
                          className="w-full"
                          variant={isActiveSlot ? "secondary" : "outline"}
                          disabled={startingSlotId === slot.id || (!!activeSession && !isActiveSlot)}
                          onClick={() => isActiveSlot ? setQrModalOpen(true) : startQRSession(slot.id)}
                        >
                          {startingSlotId === slot.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <QrCode className="w-3 h-3 mr-1" />
                          )}
                          {isActiveSlot ? "Show QR" : "Start QR Session"}
                        </Button>
                      </div>
                    </div>
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
              {selectedSlot ? `${selectedSlot.class.courseName} — ${selectedSlot.class.courseCode}` : "Select a session"}
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
                <BarChart3 className="w-12 h-12 mx-auto mb-3" />Select a session from the left
              </div>
            ) : selectedSlot.attendanceRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3" />
                No attendance records yet
                <p className="text-sm mt-2">Start a QR session to collect attendance</p>
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
                          <Badge variant={record.status === "PRESENT" ? "default" : record.status === "LATE" ? "secondary" : "destructive"}>
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

      {/* QR Session Modal */}
      <Dialog open={qrModalOpen} onOpenChange={(o) => { if (!o && activeSession) return; setQrModalOpen(o) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Attendance Session
            </DialogTitle>
          </DialogHeader>
          {activeSession && (
            <div className="space-y-4">
              {/* Slot Info */}
              <div className="text-center">
                <h3 className="font-bold text-lg">{activeSession.slotInfo.courseName}</h3>
                <p className="text-muted-foreground text-sm">
                  {activeSession.slotInfo.courseCode} · {activeSession.slotInfo.startTime}–{activeSession.slotInfo.endTime} · {activeSession.slotInfo.room}
                </p>
              </div>

              {/* Timer */}
              {sessionStatus && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Session expires in</span>
                    <span className={`font-bold ${sessionStatus.secondsLeft < 60 ? "text-red-500" : "text-green-600"}`}>
                      {Math.floor(sessionStatus.secondsLeft / 60)}:{String(sessionStatus.secondsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPercent}%` }} />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <img src={activeSession.qrDataUrl} alt="QR Code" className="w-52 h-52" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Students scan to mark attendance
                  </p>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1 break-all text-center">
                    {activeSession.qrData}
                  </p>
                </div>

                {/* Live Status */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{sessionStatus?.scannedCount ?? 0}</div>
                      <div className="text-xs text-green-600">Scanned</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{sessionStatus?.enrolledTotal ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">Enrolled</div>
                    </div>
                  </div>

                  {/* Live Student List */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-medium flex items-center gap-2">
                      <UserCheck className="w-3 h-3" />
                      Students Checked In
                      <Badge className="ml-auto text-xs">{sessionStatus?.scannedStudents.length ?? 0}</Badge>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y">
                      {!sessionStatus?.scannedStudents.length ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Waiting for students to scan...
                        </div>
                      ) : (
                        sessionStatus.scannedStudents.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium">{s.name}</div>
                              <div className="text-xs text-muted-foreground">{s.email}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button variant="destructive" className="w-full" onClick={closeSession}>
                    <X className="w-4 h-4 mr-2" />
                    Close Session
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
