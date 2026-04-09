"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Calendar, QrCode, Users, BarChart3, Settings, BookOpen, Target } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  const getNavigationItems = () => {
    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/schedule", label: "Schedule", icon: Calendar },
    ]

    if (user?.role === "STUDENT") {
      return [
        ...baseItems,
        { href: "/attendance", label: "Mark Attendance", icon: QrCode },
        { href: "/goals", label: "Personal Goals", icon: Target },
        { href: "/activities", label: "Activities", icon: BookOpen },
      ]
    }

    if (user?.role === "TEACHER") {
      return [
        ...baseItems,
        { href: "/teacher/attendance", label: "Class Attendance", icon: Users },
        { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
      ]
    }

    if (user?.role === "ADMIN") {
      return [
        ...baseItems,
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-sidebar-primary text-sidebar-primary-foreground")}
              >
                <Link href={item.href}>
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
