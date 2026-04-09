"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleThemeToggle } from "@/components/ui/theme-toggle"
import { QrCode, Users, Calendar, BarChart3, BookOpen, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // hydration error
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const features = [
    {
      icon: QrCode,
      title: "QR Code Attendance",
      description: "Automated attendance marking with QR code scanning",
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Role-based Dashboards",
      description: "Specialized interfaces for students, teachers, and admins",
      color: "bg-green-500",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Personalized timetables and activity suggestions",
      color: "bg-purple-500",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Live attendance tracking and comprehensive reports",
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Smart Attendance</h1>
                <p className="text-sm text-muted-foreground">Curriculum & Activity Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <SimpleThemeToggle />
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Smart Curriculum
            <span className="text-primary block">Activity & Attendance</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Automate attendance tracking, provide real-time classroom displays, and offer personalized activity
            suggestions to students during their free periods.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Key Features</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools for modern educational institutions
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="text-center">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Attendance Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt; 2s</div>
              <div className="text-muted-foreground">Average Check-in Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Real-time Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of educational institutions using Smart Attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Smart Attendance</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2024 Smart Attendance. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
