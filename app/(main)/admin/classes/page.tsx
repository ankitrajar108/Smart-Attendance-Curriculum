"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
  Calendar,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface EnrolledStudent {
  studentProfileId: string;
  name: string;
  email: string;
}

interface ClassItem {
  id: string;
  courseName: string;
  courseCode: string;
  teacherId: string;
  teacher: {
    name: string;
    email: string;
    department: string;
  };
  studentCount: number;
  timetableSlots: TimetableSlot[];
  enrolledStudents: EnrolledStudent[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  profileId: string | null;
  department?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "MON",
  TUESDAY: "TUE",
  WEDNESDAY: "WED",
  THURSDAY: "THU",
  FRIDAY: "FRI",
  SATURDAY: "SAT",
  SUNDAY: "SUN",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminClassesPage() {
  const { toast } = useToast();

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog / form state
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [manageClass, setManageClass] = useState<ClassItem | null>(null);
  const [addSlotClass, setAddSlotClass] = useState<ClassItem | null>(null);

  // Class form
  const [classForm, setClassForm] = useState({
    courseName: "",
    courseCode: "",
    teacherUserId: "",
  });

  // Slot form
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: "MONDAY",
    startTime: "",
    endTime: "",
    room: "",
  });

  // Loading flags
  const [submittingClass, setSubmittingClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  // Derived lists
  const teachers = users.filter((u) => u.role === "TEACHER");
  const students = users.filter((u) => u.role === "STUDENT");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, userRes] = await Promise.all([
        apiClient.get("/api/admin/classes"),
        apiClient.get("/api/admin/users"),
      ]);
      setClasses(classRes.data);
      setUsers(userRes.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep manageClass in sync when classes update (e.g. after enrollment change)
  useEffect(() => {
    if (manageClass) {
      const updated = classes.find((c) => c.id === manageClass.id);
      if (updated) setManageClass(updated);
    }
    // We intentionally omit manageClass from deps to avoid a refresh loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    totalClasses: classes.length,
    totalEnrolled: classes.reduce((acc, c) => acc + c.studentCount, 0),
    totalSessions: classes.reduce(
      (acc, c) => acc + c.timetableSlots.length,
      0,
    ),
  };

  // ── Create Class ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setClassForm({ courseName: "", courseCode: "", teacherUserId: "" });
    setCreateOpen(true);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.teacherUserId) {
      toast({
        title: "Validation error",
        description: "Please select a teacher.",
        variant: "destructive",
      });
      return;
    }
    setSubmittingClass(true);
    try {
      await apiClient.post("/api/admin/classes", {
        courseName: classForm.courseName.trim(),
        courseCode: classForm.courseCode.trim().toUpperCase(),
        teacherUserId: classForm.teacherUserId,
      });
      toast({ title: "Class created!" });
      setCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to create class.",
        variant: "destructive",
      });
    } finally {
      setSubmittingClass(false);
    }
  };

  // ── Edit Class ─────────────────────────────────────────────────────────────

  const openEdit = (cls: ClassItem) => {
    // Find the teacher's User.id by matching teacherProfile.id (stored in cls.teacherId) against profileId
    const teacherUser = teachers.find((t) => t.profileId === cls.teacherId);
    setClassForm({
      courseName: cls.courseName,
      courseCode: cls.courseCode,
      teacherUserId: teacherUser?.id || "",
    });
    setEditClass(cls);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClass) return;
    setSubmittingClass(true);
    try {
      await apiClient.patch("/api/admin/classes", {
        id: editClass.id,
        courseName: classForm.courseName.trim(),
        courseCode: classForm.courseCode.trim().toUpperCase(),
        teacherUserId: classForm.teacherUserId || undefined,
      });
      toast({ title: "Class updated!" });
      setEditClass(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to update class.",
        variant: "destructive",
      });
    } finally {
      setSubmittingClass(false);
    }
  };

  // ── Delete Class ───────────────────────────────────────────────────────────

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;
    setDeletingClass(true);
    try {
      await apiClient.delete("/api/admin/classes", {
        data: { id: deleteTarget.id },
      });
      toast({ title: "Class deleted!" });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to delete class.",
        variant: "destructive",
      });
    } finally {
      setDeletingClass(false);
    }
  };

  // ── Enrollments ────────────────────────────────────────────────────────────

  const handleEnroll = async (studentProfileId: string, classId: string) => {
    setEnrollingId(studentProfileId);
    try {
      await apiClient.post("/api/admin/enrollments", {
        studentId: studentProfileId,
        classId,
      });
      toast({ title: "Student enrolled!" });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to enroll student.",
        variant: "destructive",
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (studentProfileId: string, classId: string) => {
    setUnenrollingId(studentProfileId);
    try {
      await apiClient.delete("/api/admin/enrollments", {
        data: { studentId: studentProfileId, classId },
      });
      toast({ title: "Student removed from class." });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to remove student.",
        variant: "destructive",
      });
    } finally {
      setUnenrollingId(null);
    }
  };

  // ── Timetable Slots ────────────────────────────────────────────────────────

  const openAddSlot = (cls: ClassItem) => {
    setSlotForm({ dayOfWeek: "MONDAY", startTime: "", endTime: "", room: "" });
    setAddSlotClass(cls);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSlotClass) return;
    setAddingSlot(true);
    try {
      await apiClient.post("/api/admin/timetable", {
        classId: addSlotClass.id,
        dayOfWeek: slotForm.dayOfWeek,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        room: slotForm.room.trim(),
      });
      toast({ title: "Timetable slot added!" });
      setAddSlotClass(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to add timetable slot.",
        variant: "destructive",
      });
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingSlot(slotId);
    try {
      await apiClient.delete("/api/admin/timetable", { data: { id: slotId } });
      toast({ title: "Slot deleted." });
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to delete slot.",
        variant: "destructive",
      });
    } finally {
      setDeletingSlot(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Class Management
          </h1>
          <p className="text-muted-foreground">
            Manage classes, enrollments, and timetable slots
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Classes",
            value: stats.totalClasses,
            color: "text-blue-600",
          },
          {
            label: "Total Students Enrolled",
            value: stats.totalEnrolled,
            color: "text-green-600",
          },
          {
            label: "Total Weekly Sessions",
            value: stats.totalSessions,
            color: "text-purple-600",
          },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">No classes yet</p>
            <p className="text-sm text-muted-foreground">
              Click &ldquo;Add Class&rdquo; to create your first class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expandedId === cls.id;
            return (
              <Card key={cls.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-4">
                  {/* Class header row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {cls.courseName}
                        </h3>
                        <Badge variant="secondary">{cls.courseCode}</Badge>
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300"
                        >
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {cls.studentCount}{" "}
                          {cls.studentCount === 1 ? "student" : "students"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-purple-600 border-purple-300"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          {cls.timetableSlots.length}{" "}
                          {cls.timetableSlots.length === 1
                            ? "session"
                            : "sessions"}
                          /week
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Teacher:{" "}
                        <span className="font-medium text-foreground">
                          {cls.teacher.name}
                        </span>
                        {cls.teacher.department && (
                          <span> &middot; {cls.teacher.department}</span>
                        )}
                        <span className="ml-1 text-xs">
                          ({cls.teacher.email})
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cls)}
                        title="Edit class"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManageClass(cls)}
                        title="Manage students"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(cls)}
                        title="Delete class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : cls.id)
                        }
                        title={
                          isExpanded ? "Collapse timetable" : "Expand timetable"
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Timetable section (expanded) */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Timetable Slots
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddSlot(cls)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Slot
                        </Button>
                      </div>

                      {cls.timetableSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No timetable slots yet. Click &ldquo;Add Slot&rdquo;
                          to add one.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {cls.timetableSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-sm"
                            >
                              <span className="font-semibold text-xs">
                                {DAY_SHORT[slot.dayOfWeek] || slot.dayOfWeek}
                              </span>
                              <span>
                                {slot.startTime}–{slot.endTime}
                              </span>
                              {slot.room && (
                                <span className="text-muted-foreground">
                                  | {slot.room}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingSlot === slot.id}
                                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                title="Delete slot"
                              >
                                {deletingSlot === slot.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Class Dialog ──────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Create a new class and assign a teacher.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-course-name">Course Name *</Label>
              <Input
                id="create-course-name"
                required
                value={classForm.courseName}
                onChange={(e) =>
                  setClassForm((p) => ({ ...p, courseName: e.target.value }))
                }
                placeholder="e.g. Introduction to Computer Science"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-course-code">Course Code *</Label>
              <Input
                id="create-course-code"
                required
                value={classForm.courseCode}
                onChange={(e) =>
                  setClassForm((p) => ({
                    ...p,
                    courseCode: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. CS101"
              />
            </div>

            <div className="space-y-2">
              <Label>Assign Teacher *</Label>
              {teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No teachers available. Create a teacher user first.
                </p>
              ) : (
                <Select
                  value={classForm.teacherUserId}
                  onValueChange={(v) =>
                    setClassForm((p) => ({ ...p, teacherUserId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher…" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.department ? ` (${t.department})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingClass || teachers.length === 0}
              >
                {submittingClass && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Class Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={!!editClass}
        onOpenChange={(v) => {
          if (!v) setEditClass(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update details for{" "}
              <span className="font-medium">{editClass?.courseName}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClass} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-name">Course Name</Label>
              <Input
                id="edit-course-name"
                value={classForm.courseName}
                onChange={(e) =>
                  setClassForm((p) => ({ ...p, courseName: e.target.value }))
                }
                placeholder="Course name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course-code">Course Code</Label>
              <Input
                id="edit-course-code"
                value={classForm.courseCode}
                onChange={(e) =>
                  setClassForm((p) => ({
                    ...p,
                    courseCode: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. CS101"
              />
            </div>

            <div className="space-y-2">
              <Label>Assign Teacher</Label>
              <Select
                value={classForm.teacherUserId}
                onValueChange={(v) =>
                  setClassForm((p) => ({ ...p, teacherUserId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher…" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.department ? ` (${t.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditClass(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingClass}>
                {submittingClass && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Class AlertDialog ─────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.courseName}</strong> (
              {deleteTarget?.courseCode})? This will permanently remove all
              enrollments, timetable slots, and attendance records for this
              class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteClass}
              disabled={deletingClass}
            >
              {deletingClass && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Manage Students Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={!!manageClass}
        onOpenChange={(v) => {
          if (!v) setManageClass(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Manage Students &mdash; {manageClass?.courseName}
            </DialogTitle>
            <DialogDescription>
              Add or remove students from{" "}
              <span className="font-medium">{manageClass?.courseCode}</span>.
              Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          {manageClass && (
            <div className="grid grid-cols-2 gap-6 overflow-hidden flex-1">
              {/* Enrolled Students */}
              <div className="flex flex-col min-h-0">
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 shrink-0">
                  Enrolled ({manageClass.enrolledStudents.length})
                </h4>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {manageClass.enrolledStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No students enrolled yet.</p>
                    </div>
                  ) : (
                    manageClass.enrolledStudents.map((es) => (
                      <div
                        key={es.studentProfileId}
                        className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {es.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {es.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                          onClick={() =>
                            handleUnenroll(
                              es.studentProfileId,
                              manageClass.id,
                            )
                          }
                          disabled={unenrollingId === es.studentProfileId}
                          title="Remove student"
                        >
                          {unenrollingId === es.studentProfileId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available Students */}
              <div className="flex flex-col min-h-0">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 shrink-0">
                  Available to Enroll
                </h4>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {(() => {
                    const enrolledIds = new Set(
                      manageClass.enrolledStudents.map(
                        (e) => e.studentProfileId,
                      ),
                    );
                    const available = students.filter(
                      (s) => s.profileId && !enrolledIds.has(s.profileId),
                    );

                    if (available.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">All students are enrolled.</p>
                        </div>
                      );
                    }

                    return available.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 shrink-0 ml-2"
                          onClick={() =>
                            s.profileId &&
                            handleEnroll(s.profileId, manageClass.id)
                          }
                          disabled={enrollingId === s.profileId}
                          title="Enroll student"
                        >
                          {enrollingId === s.profileId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setManageClass(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Timetable Slot Dialog ────────────────────────────────────────── */}
      <Dialog
        open={!!addSlotClass}
        onOpenChange={(v) => {
          if (!v) setAddSlotClass(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Timetable Slot</DialogTitle>
            <DialogDescription>
              Add a recurring weekly slot for{" "}
              <span className="font-medium">{addSlotClass?.courseName}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSlot} className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <Select
                value={slotForm.dayOfWeek}
                onValueChange={(v) =>
                  setSlotForm((p) => ({ ...p, dayOfWeek: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d.charAt(0) + d.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="slot-start">Start Time *</Label>
                <Input
                  id="slot-start"
                  required
                  type="time"
                  value={slotForm.startTime}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">End Time *</Label>
                <Input
                  id="slot-end"
                  required
                  type="time"
                  value={slotForm.endTime}
                  onChange={(e) =>
                    setSlotForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-room">Room</Label>
              <Input
                id="slot-room"
                value={slotForm.room}
                onChange={(e) =>
                  setSlotForm((p) => ({ ...p, room: e.target.value }))
                }
                placeholder="e.g. CS-101"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddSlotClass(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingSlot}>
                {addingSlot && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Add Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
