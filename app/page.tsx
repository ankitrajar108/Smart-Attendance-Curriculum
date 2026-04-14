"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleThemeToggle } from "@/components/ui/theme-toggle";
import {
  QrCode,
  Users,
  Calendar,
  BarChart3,
  BookOpen,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  Target,
  GraduationCap,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: QrCode,
      title: "QR Code Attendance",
      description:
        "Teachers generate a live QR code. Students scan it with their phone and attendance is marked instantly — no paper, no manual entry.",
      color: "bg-blue-500",
      light: "bg-blue-50 dark:bg-blue-950",
    },
    {
      icon: Users,
      title: "Role-Based Dashboards",
      description:
        "Three dedicated dashboards — Students track their attendance, Teachers manage classes, Admins oversee the entire institution.",
      color: "bg-green-500",
      light: "bg-green-50 dark:bg-green-950",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description:
        "Auto-generated weekly timetables for every user. Students see their next class, free periods, and get activity suggestions.",
      color: "bg-purple-500",
      light: "bg-purple-50 dark:bg-purple-950",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Admins can view attendance trends, department-wise rates, and user statistics — all updated live from the database.",
      color: "bg-orange-500",
      light: "bg-orange-50 dark:bg-orange-950",
    },
    {
      icon: Target,
      title: "Personal Goals",
      description:
        "Students set academic and personal goals, track progress with a visual progress bar, and mark them as complete.",
      color: "bg-pink-500",
      light: "bg-pink-50 dark:bg-pink-950",
    },
    {
      icon: Zap,
      title: "Activity Suggestions",
      description:
        "During free periods, students receive smart activity suggestions tailored to their enrolled courses and interests.",
      color: "bg-yellow-500",
      light: "bg-yellow-50 dark:bg-yellow-950",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Create Your Account",
      description:
        "Register as a Student, Teacher, or Admin. Your role determines exactly what you can see and do in the system.",
      icon: GraduationCap,
    },
    {
      step: "02",
      title: "Join Your Classes",
      description:
        "Students get enrolled in classes by the admin. Teachers are assigned courses with a full weekly timetable.",
      icon: BookOpen,
    },
    {
      step: "03",
      title: "Mark Attendance Instantly",
      description:
        "Teacher starts a QR session. Students scan with their phone. Attendance recorded in under 2 seconds.",
      icon: QrCode,
    },
  ];

  const roles = [
    {
      role: "Student",
      icon: GraduationCap,
      color: "border-green-500/50 bg-green-50/50 dark:bg-green-950/30",
      badgeColor: "bg-green-500",
      features: [
        "View weekly class schedule",
        "Mark attendance via QR scan",
        "Track personal attendance rate",
        "Set & manage personal goals",
        "Browse activity suggestions",
        "View attendance history",
      ],
    },
    {
      role: "Teacher",
      icon: BookOpen,
      color: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30",
      badgeColor: "bg-blue-500",
      features: [
        "View all assigned classes",
        "Generate live QR sessions",
        "Monitor real-time scan count",
        "View class attendance records",
        "See enrolled student list",
        "Track attendance statistics",
      ],
    },
    {
      role: "Admin",
      icon: Shield,
      color: "border-red-500/50 bg-red-50/50 dark:bg-red-950/30",
      badgeColor: "bg-red-500",
      features: [
        "Manage all system users",
        "View analytics & reports",
        "Monitor attendance trends",
        "Search & filter users by role",
        "Delete accounts if needed",
        "Access system information",
      ],
    },
  ];

  const stats = [
    { value: "99.9%", label: "Attendance Accuracy", icon: Star },
    { value: "< 2s", label: "Average Check-in Time", icon: Zap },
    { value: "3", label: "Role-Based Dashboards", icon: Users },
    { value: "24/7", label: "Real-Time Monitoring", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">
                  Smart Attendance
                </h1>
                <p className="text-xs text-muted-foreground">
                  Curriculum & Activity Management
                </p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <SimpleThemeToggle />
              <Badge
                variant="outline"
                className="hidden sm:flex items-center gap-1 font-mono text-xs"
              >
                <Clock className="w-3 h-3" />
                {currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
              </Badge>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-sm font-medium"
          >
            🎓 Built for Educational Institutions
          </Badge>

          <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Attendance Tracking{" "}
            <span className="text-primary">Made Simple</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automate attendance with QR codes, give students smart activity
            suggestions during free periods, and let admins track everything in
            real time — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="text-base px-10 h-12">
              <Link href="/login">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-10 h-12 bg-transparent"
            >
              <Link href="/register">Create Account</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            {[
              { icon: CheckCircle, text: "No hardware needed" },
              { icon: CheckCircle, text: "Works on any smartphone" },
              { icon: CheckCircle, text: "Instant setup" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Icon className="w-4 h-4 text-green-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y bg-card/40">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            How It Works
          </Badge>
          <h3 className="text-3xl font-bold text-foreground mb-3">
            Up and running in minutes
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to fully automated attendance management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-border" />
              )}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h3 className="text-3xl font-bold text-foreground mb-3">
              Everything you need
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit for modern attendance and curriculum management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4">
            User Roles
          </Badge>
          <h3 className="text-3xl font-bold text-foreground mb-3">
            One platform, three roles
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each role gets a custom dashboard with exactly the tools they need
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => (
            <Card
              key={role.role}
              className={`border ${role.color} hover:shadow-md transition-all duration-200`}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 ${role.badgeColor} rounded-xl flex items-center justify-center`}
                  >
                    <role.icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge className={`${role.badgeColor} text-white`}>
                    {role.role}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{role.role} Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Ready to get started?
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Create your account and start managing attendance in minutes.
                <br />
                No credit card. No setup fee. Just sign up and go.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="px-10 h-12 text-base">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="px-10 h-12 text-base bg-transparent"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Demo credentials: student@demo.com / teacher@demo.com /
                admin@demo.com — password: password123
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  Smart Attendance
                </span>
                <p className="text-xs text-muted-foreground">
                  Curriculum & Activity Management
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/login"
                className="hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hover:text-foreground transition-colors"
              >
                Register
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Smart Attendance. All rights
              reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
