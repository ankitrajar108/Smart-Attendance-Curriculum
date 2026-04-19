"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  CheckCircle,
  Clock,
  BarChart3,
  BookOpen,
  Calendar,
  RefreshCw,
  Download,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  room: string;
  teacher?: { name: string };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}

interface AttendanceRecord {
  id: string;
  status: string;
  markedAt: string;
  courseName: string;
  courseCode: string;
  teacher: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

interface SubjectStat {
  courseCode: string;
  courseName: string;
  teacher: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  rate: number | null;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [markedSlots, setMarkedSlots] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [perSubject, setPerSubject] = useState<SubjectStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingSlot, setMarkingSlot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, recordsRes, todayRes] = await Promise.all([
        apiClient.get("/api/schedule/my"),
        apiClient.get("/api/attendance/records"),
        apiClient.get("/api/attendance/mark"),
      ]);
      setSchedule(schedRes.data);
      setStats(
        recordsRes.data.stats || { total: 0, present: 0, absent: 0, late: 0 },
      );
      setRecords(recordsRes.data.records || []);
      setPerSubject(recordsRes.data.perSubject || []);
      const todayMarked = new Set<string>(
        todayRes.data.map((r: any) => r.timetableSlotId),
      );
      setMarkedSlots(todayMarked);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (slotId: string) => {
    setMarkingSlot(slotId);
    try {
      await apiClient.post("/api/attendance/mark", { timetableSlotId: slotId });
      setMarkedSlots((prev) => new Set([...prev, slotId]));
      toast({
        title: "✅ Attendance Marked!",
        description: "Your attendance has been recorded successfully.",
      });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Already Marked",
        description: err.response?.data?.message || "Attendance marking failed",
        variant: "destructive",
      });
    } finally {
      setMarkingSlot(null);
    }
  };

  const getCurrentSlot = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return schedule.find(
      (s) => s.startTime <= currentTime && s.endTime >= currentTime,
    );
  };

  const getFilteredRecords = () => {
    let result = records;
    if (historyFilter !== "all") {
      result = result.filter((r) => r.status === historyFilter);
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.courseName.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q),
      );
    }
    return result;
  };

  const exportCSV = () => {
    const filtered = getFilteredRecords();
    const headers = [
      "Date",
      "Day",
      "Course",
      "Code",
      "Teacher",
      "Time",
      "Status",
    ];
    const rows = filtered.map((r) => [
      new Date(r.markedAt).toLocaleDateString(),
      r.dayOfWeek,
      `"${r.courseName}"`,
      r.courseCode,
      `"${r.teacher}"`,
      `${r.startTime}-${r.endTime}`,
      r.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-attendance-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSlot = getCurrentSlot();
  const attendanceRate =
    stats.total > 0
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0;
  const belowThreshold = perSubject.filter(
    (s) => s.rate !== null && s.rate < 75,
  );
  const filteredRecords = getFilteredRecords();

  const rateColor = (rate: number | null) => {
    if (rate === null) return "text-muted-foreground";
    if (rate >= 75) return "text-green-600 dark:text-green-400";
    if (rate >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const progressBarColor = (rate: number | null) => {
    if (rate === null) return "";
    if (rate >= 75) return "[&>div]:bg-green-500";
    if (rate >= 50) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  };

  const statusBadgeClass = (status: string) => {
    if (status === "PRESENT")
      return "bg-green-500 text-white hover:bg-green-600";
    if (status === "LATE")
      return "bg-yellow-500 text-white hover:bg-yellow-600";
    return "bg-red-500 text-white hover:bg-red-600";
  };

  const overallRateColor =
    attendanceRate >= 75
      ? "text-green-600 dark:text-green-400"
      : attendanceRate >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage your class attendance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Global 75% Warning Banner */}
      {!loading && belowThreshold.length > 0 && (
        <Alert className="border-red-500/50 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <AlertDescription>
            <div className="font-semibold text-red-700 dark:text-red-400 mb-1">
              ⚠ Attendance Warning: {belowThreshold.length} subject(s) below 75%
              threshold
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              {belowThreshold
                .map(
                  (s) =>
                    `${s.courseCode} (${s.rate !== null ? Math.round(s.rate) : 0}%)`,
                )
                .join(" · ")}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Yellow caution: no subject below 75% but overall < 80% */}
      {!loading &&
        belowThreshold.length === 0 &&
        attendanceRate < 80 &&
        stats.total > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/5">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              ⚠ Your overall attendance is {attendanceRate}%. Try to maintain at
              least 80% to stay on track.
            </AlertDescription>
          </Alert>
        )}

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${overallRateColor}`}>
              {attendanceRate}%
            </div>
            <div className="text-sm text-muted-foreground">Attendance Rate</div>
            <Progress value={attendanceRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.present}
            </div>
            <div className="text-sm text-muted-foreground">Present</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.absent}
            </div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.late}
            </div>
            <div className="text-sm text-muted-foreground">Late</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="today" className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="perSubject" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Per Subject
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ─── TODAY TAB ─── */}
        <TabsContent value="today" className="space-y-4 mt-4">
          {/* Live current-class alert */}
          {currentSlot && (
            <Alert className="border-blue-500/50 bg-blue-500/5">
              <Clock className="w-4 h-4 text-blue-500" />
              <AlertDescription>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold">
                      {currentSlot.courseName}
                    </span>{" "}
                    is in progress!
                    <span className="text-muted-foreground ml-2 text-sm">
                      {currentSlot.startTime} – {currentSlot.endTime}
                    </span>
                  </div>
                  {markedSlots.has(currentSlot.id) ? (
                    <Badge className="bg-green-500 text-white shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Marked ✓
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => markAttendance(currentSlot.id)}
                      disabled={!!markingSlot}
                      className="shrink-0"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Mark Now
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Today's Classes card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Classes
              </CardTitle>
              <CardDescription>
                Mark your attendance for each class
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-muted animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No classes scheduled for today
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedule.map((slot) => {
                    const isMarked = markedSlots.has(slot.id);
                    const isMarking = markingSlot === slot.id;
                    const now = new Date().toTimeString().slice(0, 5);
                    const isPast = now > slot.endTime;
                    const isCurrent =
                      now >= slot.startTime && now <= slot.endTime;

                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isCurrent
                            ? "border-blue-500/50 bg-blue-500/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {slot.courseName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {slot.startTime} – {slot.endTime}
                            {slot.room && ` · ${slot.room}`}
                            {slot.teacher?.name && ` · ${slot.teacher.name}`}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground/70">
                            {slot.courseCode}
                          </div>
                        </div>
                        <div className="ml-3 shrink-0">
                          {isMarked ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Done
                            </Badge>
                          ) : isPast ? (
                            <Badge variant="destructive">Missed</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={isCurrent ? "default" : "outline"}
                              onClick={() => markAttendance(slot.id)}
                              disabled={!!markingSlot}
                            >
                              {isMarking ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <QrCode className="w-3 h-3 mr-1" />
                                  Mark
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PER SUBJECT TAB ─── */}
        <TabsContent value="perSubject" className="space-y-4 mt-4">
          {/* At-risk subjects alert */}
          {!loading && belowThreshold.length > 0 && (
            <Alert className="border-red-500/50 bg-red-500/5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription>
                <div className="font-semibold text-red-700 dark:text-red-400 mb-2">
                  At-Risk Subjects ({belowThreshold.length})
                </div>
                <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-0.5">
                  {belowThreshold.map((s) => (
                    <li key={s.courseCode}>
                      {s.courseCode} – {s.courseName}:{" "}
                      <strong>
                        {s.rate !== null ? Math.round(s.rate) : 0}%
                      </strong>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : perSubject.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No subject data available yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {perSubject.map((subject) => {
                const isBelow = subject.rate !== null && subject.rate < 75;
                const displayRate =
                  subject.rate !== null ? Math.round(subject.rate) : null;

                return (
                  <Card
                    key={subject.courseCode}
                    className={`transition-colors ${isBelow ? "border-red-500/40" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight">
                            {subject.courseName}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs mt-0.5">
                            {subject.courseCode}
                          </CardDescription>
                          <CardDescription className="text-xs">
                            {subject.teacher}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-2xl font-bold tabular-nums ${rateColor(subject.rate)}`}
                          >
                            {displayRate !== null ? `${displayRate}%` : "N/A"}
                          </span>
                          {isBelow && (
                            <Badge
                              variant="destructive"
                              className="text-xs whitespace-nowrap"
                            >
                              ⚠ Below 75%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress
                        value={displayRate ?? 0}
                        className={`h-2 ${progressBarColor(subject.rate)}`}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Present{" "}
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {subject.present}
                          </span>
                        </span>
                        <span>
                          Late{" "}
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                            {subject.late}
                          </span>
                        </span>
                        <span>
                          Absent{" "}
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {subject.absent}
                          </span>
                        </span>
                        <span>
                          Total{" "}
                          <span className="font-semibold text-foreground">
                            {subject.total}
                          </span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── HISTORY TAB ─── */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {/* Top bar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name or code…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger className="w-44">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={exportCSV}
              disabled={filteredRecords.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Record count */}
          <div className="text-sm text-muted-foreground">
            {filteredRecords.length} record
            {filteredRecords.length !== 1 ? "s" : ""}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No records match your search
                </p>
                {(historySearch || historyFilter !== "all") && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(record.markedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {record.dayOfWeek}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {record.courseName}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {record.courseCode}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.teacher}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {record.startTime}–{record.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(record.status)}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
