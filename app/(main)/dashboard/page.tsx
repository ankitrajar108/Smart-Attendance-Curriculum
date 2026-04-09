"use client"

import { useAuth } from "@/hooks/use-auth"
import { useSchedule } from "@/hooks/use-schedule"
import { useSuggestions } from "@/hooks/use-suggestions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Target, Users, BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const { schedule, isLoading: scheduleLoading } = useSchedule()
  const { suggestions, isLoading: suggestionsLoading } = useSuggestions()

  const getCurrentTimeSlot = () => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

    return schedule.find(
      (item) => item.dayOfWeek === currentDay && item.startTime <= currentTime && item.endTime >= currentTime,
    )
  }

  const getUpcomingClasses = () => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

    return schedule.filter((item) => item.dayOfWeek === currentDay && item.startTime > currentTime).slice(0, 3)
  }

  const currentClass = getCurrentTimeSlot()
  const upcomingClasses = getUpcomingClasses()

  if (user?.role === "STUDENT") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Here's your personalized dashboard</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Class */}
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Current Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentClass ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{currentClass.courseName}</h3>
                      <p className="text-muted-foreground">{currentClass.courseCode}</p>
                    </div>
                    <Badge className="bg-green-500 text-white">In Progress</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>
                      {currentClass.startTime} - {currentClass.endTime}
                    </span>
                    {currentClass.teacher && <span>with {currentClass.teacher.name}</span>}
                  </div>
                  <Button className="w-full">Mark Attendance</Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Free Period</h3>
                  <p className="text-muted-foreground">No classes scheduled right now</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Classes Today</span>
                <span className="font-semibold">{schedule.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <span className="font-semibold text-green-600">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Free Periods</span>
                <span className="font-semibold">2</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Classes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            ) : upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.courseName}</h4>
                      <p className="text-sm text-muted-foreground">{item.courseCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {item.startTime} - {item.endTime}
                      </p>
                      {item.teacher && <p className="text-xs text-muted-foreground">{item.teacher.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No more classes today</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Suggestions */}
        {!currentClass && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Suggested Activities</span>
              </CardTitle>
              <CardDescription>Make the most of your free time with these personalized suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestionsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {suggestions.slice(0, 4).map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{suggestion.category}</Badge>
                        <span className="text-xs text-muted-foreground">{suggestion.estimatedTime} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Teacher Dashboard
  if (user?.role === "TEACHER") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and track attendance</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schedule.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.courseName}</h4>
                    <p className="text-sm text-muted-foreground">{item.courseCode}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      {item.startTime} - {item.endTime}
                    </span>
                    <Button size="sm">View Attendance</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
