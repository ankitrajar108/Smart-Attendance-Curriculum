"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, TrendingUp, CheckCircle, XCircle, AlertCircle, RefreshCw, BookOpen } from "lucide-react"

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/admin/users")
      setUsers(res.data)
    } catch { }
    finally { setLoading(false) }
  }

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    students: users.filter((u) => u.role === "STUDENT").length,
  }

  const departments = users
    .filter((u) => u.role === "TEACHER" && u.department)
    .reduce((acc: Record<string, number>, u) => {
      acc[u.department] = (acc[u.department] || 0) + 1
      return acc
    }, {})

  const mockAttendanceData = [
    { dept: "Computer Science", rate: 94.5 },
    { dept: "Mathematics", rate: 91.2 },
    { dept: "Physics", rate: 89.8 },
    { dept: "Chemistry", rate: 87.6 },
    { dept: "Biology", rate: 92.3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">System-wide insights and reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: counts.total, icon: Users, color: "text-primary" },
          { label: "Students", value: counts.students, icon: BookOpen, color: "text-green-600" },
          { label: "Teachers", value: counts.teachers, icon: BarChart3, color: "text-blue-600" },
          { label: "Attendance Rate", value: "92%", icon: TrendingUp, color: "text-orange-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Attendance by Department
            </CardTitle>
            <CardDescription>Monthly attendance rates per department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAttendanceData.map((dept) => (
              <div key={dept.dept} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.dept}</span>
                  <span className="text-muted-foreground">{dept.rate}%</span>
                </div>
                <Progress value={dept.rate} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Distribution
            </CardTitle>
            <CardDescription>Breakdown of registered users by role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {[
                    { role: "Students", count: counts.students, total: counts.total, color: "bg-green-500" },
                    { role: "Teachers", count: counts.teachers, total: counts.total, color: "bg-blue-500" },
                    { role: "Admins", count: counts.admins, total: counts.total, color: "bg-red-500" },
                  ].map(({ role, count, total, color }) => (
                    <div key={role} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{role}</span>
                        <span className="text-muted-foreground">{count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
                      </div>
                      <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground text-right">
                  Total: {counts.total} users registered
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Attendance Trends
            </CardTitle>
            <CardDescription>Weekly and monthly comparisons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "This Week", value: 92.5 },
              { label: "Last Week", value: 88.3 },
              { label: "This Month", value: 91.2 },
              { label: "Last Month", value: 89.7 },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{value}%</span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Real-time attendance snapshot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">65</div>
                <div className="text-xs text-green-600">Present</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">8</div>
                <div className="text-xs text-red-600">Absent</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">4</div>
                <div className="text-xs text-yellow-600">Late</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
