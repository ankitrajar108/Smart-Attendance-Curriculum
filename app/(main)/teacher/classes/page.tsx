"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Users, ChevronDown, ChevronRight, RefreshCw, Calendar } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
}

interface TimetableSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
}

interface TeacherClass {
  id: string
  courseName: string
  courseCode: string
  studentCount: number
  students: Student[]
  timetableSlots: TimetableSlot[]
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => { fetchClasses() }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/teacher/classes")
      setClasses(res.data)
    } catch { }
    finally { setLoading(false) }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground">Manage your assigned courses and students</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchClasses}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{classes.length}</div>
            <div className="text-sm text-muted-foreground">Total Classes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalStudents}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {classes.reduce((sum, c) => sum + c.timetableSlots.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Weekly Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No classes assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expanded.has(cls.id)
            return (
              <Card key={cls.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(cls.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{cls.courseName}</CardTitle>
                        <CardDescription>{cls.courseCode}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {cls.studentCount} students
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cls.timetableSlots.length} sessions/week
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="grid md:grid-cols-2 gap-6 pt-0">
                    {/* Schedule */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Weekly Schedule
                      </h4>
                      <div className="space-y-2">
                        {cls.timetableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No slots scheduled</p>
                        ) : (
                          cls.timetableSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                              <span className="font-medium">{slot.dayOfWeek.slice(0, 3)}</span>
                              <span className="text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                              <Badge variant="outline" className="text-xs">{slot.room}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Students */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Enrolled Students
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cls.students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{student.email}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
