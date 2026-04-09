"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { 
  QrCode, 
  Users, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  MapPin,
  Bell,
  Eye,
  Activity,
  GraduationCap,
  ChevronRight,
  Zap
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [attendanceProgress, setAttendanceProgress] = useState(0)
  const [liveMode, setLiveMode] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setAttendanceProgress((prev) => {
        if (prev >= 100) return 0
        return prev + Math.random() * 15
      })
    }, 2000)
    return () => clearInterval(progressTimer)
  }, [])

  const mockStudents = [
    { id: 1, name: "Alice Johnson", status: "present", time: "09:15 AM", room: "CS-101" },
    { id: 2, name: "Bob Smith", status: "present", time: "09:12 AM", room: "CS-101" },
    { id: 3, name: "Carol Davis", status: "absent", time: "-", room: "CS-101" },
    { id: 4, name: "David Wilson", status: "late", time: "09:25 AM", room: "CS-101" },
    { id: 5, name: "Eve Brown", status: "present", time: "09:10 AM", room: "CS-101" },
  ]

  const mockSchedule = [
    { time: "09:00 - 10:30", subject: "Data Structures", room: "CS-101", instructor: "Dr. Smith" },
    { time: "10:45 - 12:15", subject: "Web Development", room: "CS-102", instructor: "Prof. Johnson" },
    { time: "01:15 - 02:45", subject: "Database Systems", room: "CS-103", instructor: "Dr. Wilson" },
    { time: "03:00 - 04:30", subject: "Software Engineering", room: "CS-104", instructor: "Prof. Davis" },
  ]

  const mockActivities = [
    { title: "Programming Contest", location: "Computer Lab", time: "Free Period 1" },
    { title: "Study Group - Algorithms", location: "Library Room 201", time: "Free Period 2" },
    { title: "Career Counseling", location: "Counselor Office", time: "Free Period 3" },
    { title: "Sports Club Meeting", location: "Gymnasium", time: "After Classes" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "late":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      present: "default",
      absent: "destructive",
      late: "secondary"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Smart Attendance Demo</h1>
                <p className="text-sm text-muted-foreground">Live Interactive Preview</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="live-mode" checked={liveMode} onCheckedChange={setLiveMode} />
                <Label htmlFor="live-mode" className="text-sm">Live Mode</Label>
              </div>
              <SimpleThemeToggle />
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}</span>
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href="/">← Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Live Demo Banner */}
        <Alert className="mb-8 border-primary/50 bg-primary/5">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>This is a live interactive demo showcasing Smart Attendance features</span>
            {liveMode && (
              <Badge variant="secondary" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live Updates
              </Badge>
            )}
          </AlertDescription>
        </Alert>

        {/* Main Demo Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+12% from last semester</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89.2%</div>
                  <Progress value={89.2} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">Across 6 departments</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Alice Johnson marked present</p>
                    <p className="text-xs text-muted-foreground">CS-101 • 2 minutes ago</p>
                  </div>
                  <Badge variant="outline">QR Scan</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>BS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Bob Smith joined study group</p>
                    <p className="text-xs text-muted-foreground">Library • 5 minutes ago</p>
                  </div>
                  <Badge variant="secondary">Activity</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Carol Davis requested makeup class</p>
                    <p className="text-xs text-muted-foreground">CS-103 • 10 minutes ago</p>
                  </div>
                  <Badge variant="outline">Request</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code Scanner Simulation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code Scanner
                  </CardTitle>
                  <CardDescription>Students scan to mark attendance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">CS-101 Data Structures</p>
                    <p className="text-xs text-muted-foreground">Room: Computer Lab 1</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Scanning Progress</p>
                    <Progress value={attendanceProgress} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(attendanceProgress)}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Live Attendance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Live Attendance Status
                  </CardTitle>
                  <CardDescription>Real-time attendance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="flex items-center gap-2">
                            {getStatusIcon(student.status)}
                            {student.name}
                          </TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{student.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">65</div>
                    <div className="text-sm text-green-600">Present</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">8</div>
                    <div className="text-sm text-red-600">Absent</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">4</div>
                    <div className="text-sm text-yellow-600">Late</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-sm text-blue-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>Monday, October 2, 2025</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockSchedule.map((class_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <p className="font-medium">{class_.subject}</p>
                        <p className="text-sm text-muted-foreground">{class_.instructor}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{class_.time}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {class_.room}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suggested Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Suggested Activities
                  </CardTitle>
                  <CardDescription>Personalized recommendations for free periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {activity.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{activity.time}</Badge>
                        <Button size="sm" variant="ghost" className="ml-2">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Weekly Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className={`p-4 rounded-lg ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="font-medium">{day}</div>
                      <div className="text-sm mt-1">{index + 2}</div>
                      <div className="text-xs mt-2">
                        {index < 5 ? '6 classes' : 'Free day'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Attendance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Attendance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This Week</span>
                      <span className="font-medium">92.5%</span>
                    </div>
                    <Progress value={92.5} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last Week</span>
                      <span className="font-medium">88.3%</span>
                    </div>
                    <Progress value={88.3} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Month Average</span>
                      <span className="font-medium">89.7%</span>
                    </div>
                    <Progress value={89.7} />
                  </div>
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Attendance improved by 4.2% this week! Keep it up! 📈
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">1.2s</div>
                      <div className="text-xs text-green-600">Avg Check-in Time</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">99.9%</div>
                      <div className="text-xs text-blue-600">System Uptime</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">2.4k</div>
                      <div className="text-xs text-purple-600">Daily Scans</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">99.8%</div>
                      <div className="text-xs text-orange-600">Accuracy Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Department Comparison</CardTitle>
                <CardDescription>Attendance rates by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { dept: "Computer Science", rate: 94.5, color: "bg-blue-500" },
                    { dept: "Mathematics", rate: 91.2, color: "bg-green-500" },
                    { dept: "Physics", rate: 89.8, color: "bg-purple-500" },
                    { dept: "Chemistry", rate: 87.6, color: "bg-yellow-500" },
                    { dept: "Biology", rate: 92.3, color: "bg-red-500" },
                  ].map((dept, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium">{dept.dept}</div>
                      <div className="flex-1">
                        <Progress value={dept.rate} className="h-2" />
                      </div>
                      <div className="w-12 text-sm font-medium">{dept.rate}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Implement?</CardTitle>
            <CardDescription className="text-lg">
              Transform your institution with Smart Attendance System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/login">Get Started Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}