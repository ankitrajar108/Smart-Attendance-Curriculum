"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Star,
  Zap,
  Target,
  GraduationCap,
  Dumbbell,
  Briefcase,
  CheckCircle,
  EyeOff,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number;
  relevantCourses: string[];
  interaction: "COMPLETED" | "NOT_INTERESTED" | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  Academic: GraduationCap,
  Assignment: BookOpen,
  Career: Briefcase,
  Competition: Star,
  Research: Target,
  Sport: Dumbbell,
  Personal: Zap,
};

const categoryColors: Record<string, string> = {
  Academic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Assignment:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Career:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Competition:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Research: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Sport: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Personal: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const formatTime = (mins: number): string => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const TABS = ["active", "completed", "hidden", "all"] as const;
type TabValue = (typeof TABS)[number];

const emptyMessages: Record<TabValue, string> = {
  active: "No active activities right now.",
  completed: "No completed activities yet — get started!",
  hidden: "No hidden activities.",
  all: "No activities match your search.",
};

export default function ActivitiesPage() {
  const { toast } = useToast();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filtered, setFiltered] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tabFilter, setTabFilter] = useState<TabValue>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ── initial fetch ────────────────────────────────────────────── */
  useEffect(() => {
    fetchSuggestions();
  }, []);

  /* ── filter whenever deps change ──────────────────────────────── */
  useEffect(() => {
    let result = suggestions;

    // Tab filter
    if (tabFilter === "active")
      result = result.filter((s) => s.interaction === null);
    else if (tabFilter === "completed")
      result = result.filter((s) => s.interaction === "COMPLETED");
    else if (tabFilter === "hidden")
      result = result.filter((s) => s.interaction === "NOT_INTERESTED");

    // Category filter
    if (categoryFilter !== "all")
      result = result.filter((s) => s.category === categoryFilter);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
  }, [suggestions, search, categoryFilter, tabFilter]);

  /* ── data fetching ────────────────────────────────────────────── */
  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/student/activities");
      setSuggestions(res.data);
    } catch {
      /* silently fail — user can retry */
    } finally {
      setLoading(false);
    }
  };

  /* ── action handlers ──────────────────────────────────────────── */
  const markInteraction = async (
    id: string,
    status: "COMPLETED" | "NOT_INTERESTED",
  ) => {
    setActionLoading(id);
    try {
      await apiClient.post("/api/student/activities", {
        suggestionId: id,
        status,
      });
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, interaction: status } : s)),
      );
      toast({
        title: status === "COMPLETED" ? "✅ Marked as Complete!" : "👋 Hidden",
        description:
          status === "COMPLETED"
            ? "Great work!"
            : "Activity hidden from your list.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update activity.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const undoInteraction = async (id: string) => {
    setActionLoading(id);
    try {
      await apiClient.delete("/api/student/activities", {
        data: { suggestionId: id },
      });
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, interaction: null } : s)),
      );
      toast({
        title: "↩ Restored",
        description: "Activity restored to your list.",
      });
    } catch {
      /* silently fail */
    } finally {
      setActionLoading(null);
    }
  };

  /* ── derived counts ───────────────────────────────────────────── */
  const activeCount = suggestions.filter((s) => s.interaction === null).length;
  const completedCount = suggestions.filter(
    (s) => s.interaction === "COMPLETED",
  ).length;
  const hiddenCount = suggestions.filter(
    (s) => s.interaction === "NOT_INTERESTED",
  ).length;

  const categories = [...new Set(suggestions.map((s) => s.category))].sort();

  /* ── stat card helper ─────────────────────────────────────────── */
  const StatCard = ({
    label,
    count,
    color,
    tab,
  }: {
    label: string;
    count: number;
    color: string;
    tab: TabValue;
  }) => (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => setTabFilter(tab)}
    >
      <CardContent className="pt-4">
        <div className={`text-2xl font-bold ${color}`}>{count}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );

  /* ── card for one suggestion ──────────────────────────────────── */
  const ActivityCard = ({ suggestion }: { suggestion: Suggestion }) => {
    const Icon = categoryIcons[suggestion.category] ?? BookOpen;
    const isLoading = actionLoading === suggestion.id;
    const isCompleted = suggestion.interaction === "COMPLETED";
    const isHidden = suggestion.interaction === "NOT_INTERESTED";

    return (
      <Card
        className={`transition-all hover:shadow-md ${
          isCompleted
            ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20"
            : isHidden
              ? "opacity-60"
              : "hover:border-primary/50"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            {/* Icon + title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base leading-tight line-clamp-2">
                {suggestion.title}
              </CardTitle>
            </div>

            {/* Badges */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge
                className={
                  categoryColors[suggestion.category] ??
                  "bg-muted text-muted-foreground"
                }
              >
                {suggestion.category}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-500 text-white text-xs">
                  ✅ Completed
                </Badge>
              )}
              {isHidden && (
                <Badge variant="secondary" className="text-xs">
                  Hidden
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <CardDescription className="line-clamp-3">
            {suggestion.description}
          </CardDescription>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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

          {/* Action row */}
          <div className="flex items-center justify-between pt-1">
            {suggestion.interaction === null ? (
              /* Active — show Complete + Hide */
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                  onClick={() => markInteraction(suggestion.id, "COMPLETED")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    markInteraction(suggestion.id, "NOT_INTERESTED")
                  }
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hide
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Completed or Hidden — show Undo/Restore */
              <Button
                size="sm"
                variant="link"
                className="text-muted-foreground p-0 h-auto hover:text-foreground"
                onClick={() => undoInteraction(suggestion.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <RotateCcw className="w-3 h-3 mr-1" />
                )}
                {isCompleted ? "Undo" : "Restore"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ── shared grid content for a tab ───────────────────────────── */
  const TabGrid = ({ tab }: { tab: TabValue }) => {
    if (loading) {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{emptyMessages[tab]}</p>
            {(search || categoryFilter !== "all") && (
              <Button
                variant="link"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <ActivityCard key={s.id} suggestion={s} />
        ))}
      </div>
    );
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground">
            Personalized suggestions for your free periods
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          count={suggestions.length}
          color="text-foreground"
          tab="all"
        />
        <StatCard
          label="Active"
          count={activeCount}
          color="text-blue-600 dark:text-blue-400"
          tab="active"
        />
        <StatCard
          label="Completed"
          count={completedCount}
          color="text-green-600 dark:text-green-400"
          tab="completed"
        />
        <StatCard
          label="Hidden"
          count={hiddenCount}
          color="text-muted-foreground"
          tab="hidden"
        />
      </div>

      {/* Tabs + filters */}
      <Tabs
        value={tabFilter}
        onValueChange={(v) => setTabFilter(v as TabValue)}
      >
        {/* Tab list */}
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="active" className="gap-1.5">
              Active
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 py-0">
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              Completed
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 py-0">
                {completedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="hidden" className="gap-1.5">
              Hidden
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 py-0">
                {hiddenCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5">
              All
              <Badge variant="secondary" className="text-xs ml-0.5 px-1.5 py-0">
                {suggestions.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search + category filter — shared across tabs */}
        <div className="flex gap-3 flex-wrap mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities…"
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
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab panels — all render the same filtered grid */}
        {TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <TabGrid tab={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
