"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, QrCode, BookOpen, Target, TrendingUp, CheckCircle, AlertCircle, Users } from "lucide-react"

export default function StudentDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [attendanceProgress, setAttendanceProgress] = useState(85)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const todaySchedule = [
    { time: "09:00 AM", subject: "Mathematics", room: "Room 101", status: "completed" },
    { time: "10:30 AM", subject: "Physics", room: "Lab 201", status: "current" },
    { time: "12:00 PM", subject: "Free Period", room: "-", status: "upcoming" },
    { time: "02:00 PM", subject: "Chemistry", room: "Lab 301", status: "upcoming" },
    { time: "03:30 PM", subject: "English", room: "Room 205", status: "upcoming" },
  ]

  const activitySuggestions = [
    {
      title: "Math Practice Problems",
      description: "Solve calculus integration problems",
      duration: "30 mins",
      category: "Academic",
      relevance: "High",
    },
    {
      title: "Physics Lab Report",
      description: "Complete pendulum experiment analysis",
      duration: "45 mins",
      category: "Assignment",
      relevance: "Medium",
    },
    {
      title: "Career Exploration",
      description: "Research engineering career paths",
      duration: "20 mins",
      category: "Personal",
      relevance: "High",
    },
  ]

  const personalGoals = [
    { title: "Improve Math Grade", progress: 75, deadline: "2024-02-15" },
    { title: "Complete Science Project", progress: 40, deadline: "2024-02-20" },
    { title: "Join Study Group", progress: 100, deadline: "2024-01-30" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "current":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "upcoming":
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "current":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "upcoming":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, Alex Johnson</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </Badge>
              <Button variant="outline" size="sm">
                <QrCode className="w-4 h-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
                <CardDescription>
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <div className="font-medium text-foreground">{item.subject}</div>
                          <div className="text-sm text-muted-foreground">{item.room}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{item.time}</div>
                        <Badge variant="secondary" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Suggested Activities</span>
                </CardTitle>
                <CardDescription>Personalized recommendations for your free period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {activitySuggestions.map((activity, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{activity.title}</h4>
                        <Badge variant={activity.relevance === "High" ? "default" : "secondary"}>
                          {activity.relevance}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{activity.duration}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{activity.category}</span>
                          </span>
                        </div>
                        <Button size="sm" variant="outline">
                          Start
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Attendance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Attendance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary">{attendanceProgress}%</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
                <Progress value={attendanceProgress} className="mb-4" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-foreground">23</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">4</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Personal Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {personalGoals.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{goal.title}</span>
                        <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <QrCode className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Join Study Group
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
