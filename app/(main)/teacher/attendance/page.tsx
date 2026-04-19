"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  QrCode,
  Loader2,
  X,
  Wifi,
  UserCheck,
  Download,
  Edit2,
  ChevronDown,
  UserX,
} from "lucide-react";
import QRCode from "qrcode";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  status: string;
  markedAt: string;
  student: { id: string; user: { name: string; email: string } };
}

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  class: { courseName: string; courseCode: string };
  attendanceRecords: AttendanceRecord[];
}

interface RosterStudent {
  studentId: string;
  name: string;
  email: string;
  todayRecord: {
    id: string;
    status: string;
    note: string;
    markedAt: string;
  } | null;
}

interface HistoryRecord {
  id: string;
  status: string;
  note: string;
  markedAt: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

interface SlotDetail {
  slot: {
    id: string;
    courseName: string;
    courseCode: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
  };
  students: RosterStudent[];
  allRecords: HistoryRecord[];
}

interface ActiveSession {
  token: string;
  qrDataUrl: string;
  qrData: string;
  slotId: string;
  durationMinutes: number;
  slotInfo: {
    courseName: string;
    courseCode: string;
    startTime: string;
    endTime: string;
    room: string;
  };
  expiresAt: number;
}

interface SessionStatus {
  scannedCount: number;
  enrolledTotal: number;
  expiresAt: number;
  isExpired: boolean;
  secondsLeft: number;
  scannedStudents: { id: string; name: string; email: string }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeacherAttendancePage() {
  const { toast } = useToast();

  // Core data
  const [slotsData, setSlotsData] = useState<{
    slots: TimetableSlot[];
    stats: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);

  // Slot detail (roster + history)
  const [slotDetail, setSlotDetail] = useState<SlotDetail | null>(null);
  const [slotDetailLoading, setSlotDetailLoading] = useState(false);

  // QR session
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  );
  const [startingSlotId, setStartingSlotId] = useState<string | null>(null);
  const [qrDuration, setQrDuration] = useState(5);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Marking
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);

  // Edit record dialog
  const [editRecord, setEditRecord] = useState<HistoryRecord | null>(null);
  const [editForm, setEditForm] = useState({ status: "", note: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("roster");

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSlot) {
      fetchSlotDetail(selectedSlot.id);
      setActiveTab("roster");
    } else {
      setSlotDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot?.id]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/attendance/records");
      setSlotsData(res.data);
      // Auto-select first slot only on first load
      if (res.data.slots?.length > 0 && !selectedSlot) {
        setSelectedSlot(res.data.slots[0]);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotDetail = async (slotId: string) => {
    setSlotDetailLoading(true);
    setSlotDetail(null);
    try {
      const res = await apiClient.get(
        `/api/teacher/attendance?slotId=${slotId}`,
      );
      setSlotDetail(res.data);
    } catch {
      // silently fail
    } finally {
      setSlotDetailLoading(false);
    }
  };

  // ─── Manual marking ────────────────────────────────────────────────────────

  const markStudent = async (studentProfileId: string, status: string) => {
    if (!selectedSlot) return;
    setMarkingStudentId(studentProfileId);
    try {
      await apiClient.post("/api/teacher/attendance", {
        timetableSlotId: selectedSlot.id,
        studentProfileId,
        status,
      });
      toast({
        title: "✅ Marked!",
        description: `Student marked as ${status}`,
      });
      fetchSlotDetail(selectedSlot.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to mark student",
        variant: "destructive",
      });
    } finally {
      setMarkingStudentId(null);
    }
  };

  const markAllAbsent = async () => {
    if (!slotDetail || !selectedSlot) return;
    const unmarked = slotDetail.students.filter((s) => !s.todayRecord);
    if (unmarked.length === 0) {
      toast({
        title: "Nothing to do",
        description: "All students are already marked for today.",
      });
      return;
    }
    for (const s of unmarked) {
      await markStudent(s.studentId, "ABSENT");
    }
  };

  // ─── Edit record ───────────────────────────────────────────────────────────

  const openEditDialog = (record: HistoryRecord) => {
    setEditRecord(record);
    setEditForm({ status: record.status, note: record.note || "" });
  };

  const saveEdit = async () => {
    if (!editRecord) return;
    setSavingEdit(true);
    try {
      await apiClient.patch("/api/teacher/attendance", {
        recordId: editRecord.id,
        status: editForm.status,
        note: editForm.note,
      });
      toast({
        title: "✅ Updated!",
        description: "Attendance record updated successfully.",
      });
      setEditRecord(null);
      if (selectedSlot) fetchSlotDetail(selectedSlot.id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── CSV Export ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    if (!slotDetail) return;
    const headers = ["Student Name", "Email", "Status", "Date & Time", "Note"];
    const rows = slotDetail.allRecords.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentEmail}"`,
      r.status,
      `"${new Date(r.markedAt).toLocaleString()}"`,
      `"${r.note || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${slotDetail.slot.courseCode}-${slotDetail.slot.dayOfWeek}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── QR Session ────────────────────────────────────────────────────────────

  const pollSessionStatus = useCallback(async (token: string) => {
    try {
      const res = await apiClient.get(
        `/api/attendance/session/status/${token}`,
      );
      setSessionStatus(res.data);
      if (res.data.isExpired) stopPolling();
    } catch {
      stopPolling();
    }
  }, []);

  const startPolling = useCallback(
    (token: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollSessionStatus(token);
      pollRef.current = setInterval(() => pollSessionStatus(token), 3000);
    },
    [pollSessionStatus],
  );

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startQRSession = async (slotId: string) => {
    setStartingSlotId(slotId);
    try {
      const res = await apiClient.post("/api/attendance/session/start", {
        timetableSlotId: slotId,
        durationMinutes: qrDuration,
      });
      const { token, qrData, expiresAt, slotInfo, durationMinutes } = res.data;
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setActiveSession({
        token,
        qrDataUrl,
        qrData,
        slotId,
        slotInfo,
        expiresAt,
        durationMinutes,
      });
      setQrModalOpen(true);
      startPolling(token);
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to start QR session",
        variant: "destructive",
      });
    } finally {
      setStartingSlotId(null);
    }
  };

  const closeSession = async () => {
    if (!activeSession) return;
    stopPolling();
    try {
      await apiClient.delete(
        `/api/attendance/session/status/${activeSession.token}`,
      );
    } catch {
      // silently fail
    }
    setActiveSession(null);
    setSessionStatus(null);
    setQrModalOpen(false);
    fetchData();
    if (selectedSlot) fetchSlotDetail(selectedSlot.id);
  };

  // ─── Derived values ────────────────────────────────────────────────────────

  const attendanceRate =
    slotsData && slotsData.stats?.total > 0
      ? Math.round((slotsData.stats.present / slotsData.stats.total) * 100)
      : 0;

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  const secondsLeft = sessionStatus?.secondsLeft ?? 0;
  const timerPercent = activeSession
    ? Math.max(0, (secondsLeft / (activeSession.durationMinutes * 60)) * 100)
    : 0;
  const timerColor =
    secondsLeft > 120
      ? "bg-green-500"
      : secondsLeft > 60
        ? "bg-yellow-500"
        : "bg-red-500";

  const sortedHistory = slotDetail
    ? [...slotDetail.allRecords].sort(
        (a, b) =>
          new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime(),
      )
    : [];

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge className="bg-green-500 hover:bg-green-500 text-white">
            PRESENT
          </Badge>
        );
      case "LATE":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">
            LATE
          </Badge>
        );
      case "ABSENT":
        return <Badge variant="destructive">ABSENT</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Marked
          </Badge>
        );
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Class Attendance
          </h1>
          <p className="text-muted-foreground">
            Monitor student attendance — manual marks or QR session
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

      {/* ── Active Session Banner ── */}
      {activeSession && (
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span>
              <strong>QR Session Active</strong> —{" "}
              {activeSession.slotInfo.courseName}
              {sessionStatus && (
                <span className="ml-3 text-muted-foreground text-sm">
                  {sessionStatus.scannedCount}/{sessionStatus.enrolledTotal}{" "}
                  scanned · {sessionStatus.secondsLeft}s left
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrModalOpen(true)}
              >
                <QrCode className="w-4 h-4 mr-1" />
                Show QR
              </Button>
              <Button size="sm" variant="destructive" onClick={closeSession}>
                <X className="w-4 h-4 mr-1" />
                Close Session
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Overall Rate
              </span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {attendanceRate}%
            </div>
            <Progress value={attendanceRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {slotsData?.stats?.present ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Absent</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {slotsData?.stats?.absent ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Late</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {slotsData?.stats?.late ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT: Slot List ── */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sessions</CardTitle>
            <CardDescription>
              Select a session to manage attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : !slotsData?.slots.length ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <QrCode className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No sessions found
              </div>
            ) : (
              <div className="divide-y">
                {slotsData.slots.map((slot) => {
                  const isToday = slot.dayOfWeek === today;
                  const isActiveSlot = activeSession?.slotId === slot.id;
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={
                        isSelected
                          ? "bg-primary/5 border-l-2 border-primary"
                          : "border-l-2 border-transparent"
                      }
                    >
                      {/* Slot info button */}
                      <button
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="font-medium text-sm leading-tight">
                          {slot.class.courseName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {slot.class.courseCode} · {slot.dayOfWeek.slice(0, 3)}{" "}
                          · {slot.startTime}–{slot.endTime}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-xs h-4 px-1.5"
                          >
                            {slot.attendanceRecords.length} records
                          </Badge>
                          {isToday && (
                            <Badge className="text-xs h-4 px-1.5 bg-blue-500 hover:bg-blue-500 text-white">
                              Today
                            </Badge>
                          )}
                          {isActiveSlot && (
                            <Badge className="text-xs h-4 px-1.5 bg-green-500 hover:bg-green-500 text-white animate-pulse">
                              QR Active
                            </Badge>
                          )}
                        </div>
                      </button>

                      {/* QR Duration picker + Start button */}
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <Select
                            value={String(qrDuration)}
                            onValueChange={(v) => setQrDuration(Number(v))}
                            disabled={!!activeSession}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="10">10 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          variant={isActiveSlot ? "secondary" : "outline"}
                          disabled={
                            startingSlotId === slot.id ||
                            (!!activeSession && !isActiveSlot)
                          }
                          onClick={() =>
                            isActiveSlot
                              ? setQrModalOpen(true)
                              : startQRSession(slot.id)
                          }
                        >
                          {startingSlotId === slot.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                          ) : (
                            <QrCode className="w-3 h-3 mr-1.5" />
                          )}
                          {isActiveSlot ? "Show QR" : "Start QR Session"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT: Slot Detail Panel ── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>
              {selectedSlot
                ? `${selectedSlot.class.courseName} — ${selectedSlot.class.courseCode}`
                : "Select a session"}
            </CardTitle>
            {selectedSlot && (
              <CardDescription>
                {selectedSlot.dayOfWeek} · {selectedSlot.startTime}–
                {selectedSlot.endTime} · Room {selectedSlot.room}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {!selectedSlot ? (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a session from the left to view attendance</p>
              </div>
            ) : slotDetailLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 w-full sm:w-auto">
                  <TabsTrigger
                    value="roster"
                    className="flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Roster
                    {slotDetail && (
                      <Badge
                        variant="secondary"
                        className="ml-0.5 text-xs h-4 px-1"
                      >
                        {slotDetail.students.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    History
                    {slotDetail && (
                      <Badge
                        variant="secondary"
                        className="ml-0.5 text-xs h-4 px-1"
                      >
                        {slotDetail.allRecords.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── ROSTER TAB ── */}
                <TabsContent value="roster">
                  {!slotDetail || slotDetail.students.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No students enrolled in this slot</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Mark All Absent */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {
                            slotDetail.students.filter((s) => s.todayRecord)
                              .length
                          }{" "}
                          of {slotDetail.students.length} marked today
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 dark:border-red-800"
                          onClick={markAllAbsent}
                          disabled={!!markingStudentId}
                        >
                          <UserX className="w-3 h-3 mr-1.5" />
                          Mark All Absent
                        </Button>
                      </div>

                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Student</TableHead>
                              <TableHead>Today&apos;s Status</TableHead>
                              <TableHead className="text-right">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slotDetail.students.map((student) => (
                              <TableRow key={student.studentId}>
                                <TableCell>
                                  <div className="font-medium leading-tight">
                                    {student.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {student.email}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {statusBadge(
                                    student.todayRecord?.status ?? "",
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                          markingStudentId === student.studentId
                                        }
                                        className="h-7 px-2 text-xs"
                                      >
                                        {markingStudentId ===
                                        student.studentId ? (
                                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                        ) : (
                                          <ChevronDown className="w-3 h-3 mr-1" />
                                        )}
                                        Mark
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          markStudent(
                                            student.studentId,
                                            "PRESENT",
                                          )
                                        }
                                        className="text-green-600 focus:text-green-600 cursor-pointer"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 mr-2" />
                                        Mark Present
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          markStudent(student.studentId, "LATE")
                                        }
                                        className="text-yellow-600 focus:text-yellow-600 cursor-pointer"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 mr-2" />
                                        Mark Late
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          markStudent(
                                            student.studentId,
                                            "ABSENT",
                                          )
                                        }
                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                      >
                                        <XCircle className="w-3.5 h-3.5 mr-2" />
                                        Mark Absent
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* ── HISTORY TAB ── */}
                <TabsContent value="history">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {sortedHistory.length} total record
                      {sortedHistory.length !== 1 ? "s" : ""}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportCSV}
                      disabled={!slotDetail?.allRecords.length}
                    >
                      <Download className="w-3 h-3 mr-1.5" />
                      Export CSV
                    </Button>
                  </div>

                  {sortedHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No attendance history yet</p>
                      <p className="text-sm mt-1">
                        Start a QR session or mark students manually
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead className="text-right">Edit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedHistory.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <div className="font-medium leading-tight">
                                  {record.studentName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {record.studentEmail}
                                </div>
                              </TableCell>
                              <TableCell>
                                {statusBadge(record.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(record.markedAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[8rem] truncate">
                                {record.note || (
                                  <span className="opacity-40">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── QR Session Modal ── */}
      <Dialog
        open={qrModalOpen}
        onOpenChange={(open) => {
          // Prevent closing while session is still active via backdrop/esc
          if (!open && activeSession && !sessionStatus?.isExpired) return;
          setQrModalOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Attendance Session
            </DialogTitle>
          </DialogHeader>

          {activeSession && (
            <div className="space-y-4">
              {/* Course info */}
              <div className="text-center">
                <h3 className="font-bold text-lg leading-tight">
                  {activeSession.slotInfo.courseName}
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {activeSession.slotInfo.courseCode} ·{" "}
                  {activeSession.slotInfo.startTime}–
                  {activeSession.slotInfo.endTime} · Room{" "}
                  {activeSession.slotInfo.room}
                </p>
              </div>

              {/* Timer bar */}
              {sessionStatus && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Session expires in &nbsp;
                      <span className="text-xs text-muted-foreground">
                        ({activeSession.durationMinutes} min total)
                      </span>
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        sessionStatus.secondsLeft < 60
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {Math.floor(sessionStatus.secondsLeft / 60)}:
                      {String(sessionStatus.secondsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${timerColor}`}
                      style={{ width: `${timerPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* QR Code image */}
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-white p-4 rounded-xl shadow-lg border">
                    <img
                      src={activeSession.qrDataUrl}
                      alt="QR Code for attendance"
                      className="w-52 h-52 block"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Students scan to mark attendance
                  </p>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded break-all text-center max-w-full">
                    {activeSession.qrData}
                  </p>
                </div>

                {/* Live status */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/40 rounded-lg border border-green-100 dark:border-green-900">
                      <div className="text-2xl font-bold text-green-600">
                        {sessionStatus?.scannedCount ?? 0}
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Scanned
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {sessionStatus?.enrolledTotal ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Enrolled
                      </div>
                    </div>
                  </div>

                  {/* Live checked-in student list */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-medium flex items-center gap-2 border-b">
                      <UserCheck className="w-3.5 h-3.5" />
                      Students Checked In
                      <Badge className="ml-auto text-xs h-4 px-1.5">
                        {sessionStatus?.scannedStudents.length ?? 0}
                      </Badge>
                    </div>
                    <div className="max-h-44 overflow-y-auto divide-y">
                      {!sessionStatus?.scannedStudents.length ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          Waiting for students to scan…
                        </div>
                      ) : (
                        sessionStatus.scannedStudents.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {s.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {s.email}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={closeSession}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Session
                  </Button>
                </div>
              </div>

              {/* Expired notice */}
              {sessionStatus?.isExpired && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    This session has expired. Close the dialog to review
                    attendance records.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Record Dialog ── */}
      <Dialog
        open={!!editRecord}
        onOpenChange={(open) => {
          if (!open) setEditRecord(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>

          {editRecord && (
            <div className="space-y-4 py-1">
              {/* Record info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{editRecord.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {editRecord.studentEmail}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Originally marked:{" "}
                  {new Date(editRecord.markedAt).toLocaleString()}
                </p>
              </div>

              {/* Status select */}
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({ ...prev, status: v }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        PRESENT
                      </span>
                    </SelectItem>
                    <SelectItem value="LATE">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                        LATE
                      </span>
                    </SelectItem>
                    <SelectItem value="ABSENT">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        ABSENT
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Note textarea */}
              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Textarea
                  id="edit-note"
                  placeholder="Optional note (e.g. arrived with medical certificate)…"
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRecord(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
