"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Settings, Shield, Database, Server, Info, CheckCircle, User } from "lucide-react"

export default function AdminSettingsPage() {
  const { user } = useAuth()

  const systemInfo = [
    { label: "Application", value: "Smart Attendance System" },
    { label: "Version", value: "1.0.0" },
    { label: "Framework", value: "Next.js 15" },
    { label: "Database", value: "SQLite (dev) / PostgreSQL (prod)" },
    { label: "Auth Method", value: "JWT (RS256)" },
    { label: "Environment", value: process.env.NODE_ENV || "development" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">System configuration and information</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Admin Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge className="bg-red-500 text-white">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Authentication and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "JWT Authentication", status: "Active" },
              { label: "Password Hashing (bcrypt)", status: "Active" },
              { label: "Rate Limiting", status: "Active" },
              { label: "CORS Policy", status: "Configured" },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">{label}</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemInfo.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
            <CardDescription>Database configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">Database Connected</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">Prisma ORM with SQLite</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="w-4 h-4" />
                Demo Credentials
              </div>
              <div className="space-y-2 text-xs rounded-lg bg-muted p-3 font-mono">
                <div>admin@demo.com / password123</div>
                <div>teacher@demo.com / password123</div>
                <div>student@demo.com / password123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
