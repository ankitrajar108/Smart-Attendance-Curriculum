"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Search, Filter, RefreshCw, Star, Zap, Target, GraduationCap, Dumbbell, Briefcase } from "lucide-react"

interface Suggestion {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: number
  relevantCourses: string[]
}

const categoryIcons: Record<string, any> = {
  Academic: GraduationCap,
  Assignment: BookOpen,
  Career: Briefcase,
  Competition: Star,
  Research: Target,
  Sport: Dumbbell,
  Personal: Zap,
}

const categoryColors: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Assignment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Career: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Competition: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Research: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Sport: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Personal: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

export default function ActivitiesPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [filtered, setFiltered] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [started, setStarted] = useState<Set<string>>(new Set())

  useEffect(() => { fetchSuggestions() }, [])

  useEffect(() => {
    let result = suggestions
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [suggestions, search, categoryFilter])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/api/suggestions/my")
      setSuggestions(res.data)
    } catch { }
    finally { setLoading(false) }
  }

  const handleStart = (id: string) => {
    setStarted((prev) => new Set([...prev, id]))
  }

  const categories = [...new Set(suggestions.map((s) => s.category))]

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? mins % 60 + "m" : ""}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground">Personalized suggestions for your free periods</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSuggestions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(0, 4).map((cat) => {
          const count = suggestions.filter((s) => s.category === cat).length
          const Icon = categoryIcons[cat] || BookOpen
          return (
            <Card
              key={cat}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{cat}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No activities match your search</p>
            <Button variant="link" onClick={() => { setSearch(""); setCategoryFilter("all") }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((suggestion) => {
            const Icon = categoryIcons[suggestion.category] || BookOpen
            const isStarted = started.has(suggestion.id)
            return (
              <Card
                key={suggestion.id}
                className={`hover:border-primary/50 transition-all hover:shadow-md ${
                  isStarted ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    </div>
                    <Badge className={categoryColors[suggestion.category] || ""}>{suggestion.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription>{suggestion.description}</CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(suggestion.estimatedTime)}
                      </span>
                      {suggestion.relevantCourses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {suggestion.relevantCourses.join(", ")}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isStarted ? "secondary" : "default"}
                      onClick={() => handleStart(suggestion.id)}
                      disabled={isStarted}
                    >
                      {isStarted ? "✓ Started" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
