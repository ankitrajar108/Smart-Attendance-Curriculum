"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, QrCode, Loader2, AlertCircle, BookOpen, LogIn } from "lucide-react"
import Link from "next/link"

function ScanPageContent() {
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuth()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "already">("idle")
  const [message, setMessage] = useState("")
  const [courseName, setCourseName] = useState("")

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const markAttendance = async () => {
    if (!token) return
    setState("loading")
    try {
      const res = await apiClient.post("/api/attendance/session/scan", { token })
      if (res.data.success) {
        setState("success")
        setMessage(res.data.message)
        setCourseName(res.data.courseName || "")
      } else {
        setState("already")
        setMessage(res.data.message)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to mark attendance"
      if (err.response?.status === 200 || msg.includes("already")) {
        setState("already")
      } else {
        setState("error")
      }
      setMessage(msg)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <QrCode className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Smart Attendance System</p>
        </div>

        {/* No token */}
        {!token && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="font-medium">Invalid QR Code</p>
              <p className="text-sm text-muted-foreground">This link is missing a session token. Please scan your teacher's QR code again.</p>
            </CardContent>
          </Card>
        )}

        {/* Not logged in */}
        {token && !isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-base">Sign in to mark attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You need to be logged in as a student to mark attendance.
              </p>
              <Button asChild className="w-full">
                <Link href={`/login?redirect=/scan?token=${token}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/register?redirect=/scan?token=${token}`}>
                  Create Account
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wrong role */}
        {token && isAuthenticated && user?.role !== "STUDENT" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
              <p className="font-medium">Students Only</p>
              <p className="text-sm text-muted-foreground">Only students can mark attendance via QR. You are logged in as {user?.role}.</p>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ready to mark */}
        {token && isAuthenticated && user?.role === "STUDENT" && state === "idle" && (
          <Card className="shadow-xl border-border/50">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">Hi, {user.name}!</p>
                <p className="text-sm text-muted-foreground">
                  Tap the button below to mark your attendance for this class.
                </p>
              </div>
              <Button className="w-full h-12 text-base" onClick={markAttendance}>
                <QrCode className="w-5 h-5 mr-2" />
                Mark My Attendance
              </Button>
              {token && (
                <p className="text-xs text-muted-foreground text-center font-mono break-all">
                  Token: {token.slice(0, 8)}...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {state === "loading" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="font-medium">Marking attendance...</p>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {state === "success" && (
          <Card className="border-green-500/50 bg-green-50/30 dark:bg-green-950/20 shadow-xl">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">Attendance Marked!</p>
                {courseName && (
                  <Badge className="mt-2 bg-green-500 text-white">{courseName}</Badge>
                )}
                <p className="text-sm text-muted-foreground mt-2">{message}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/attendance">View My Attendance</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already marked */}
        {state === "already" && (
          <Card className="border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20">
            <CardContent className="pt-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-blue-500 mx-auto" />
              <p className="font-medium">Already Recorded</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/attendance">View My Attendance</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {state === "error" && (
          <Card className="border-destructive/50 bg-red-50/30 dark:bg-red-950/20">
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button className="w-full" onClick={() => setState("idle")}>Try Again</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}
