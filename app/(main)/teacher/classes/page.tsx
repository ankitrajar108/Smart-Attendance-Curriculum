"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  BookOpen,
  Users,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface TimetableSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface TeacherClass {
  id: string;
  courseName: string;
  courseCode: string;
  studentCount: number;
  students: Student[];
  timetableSlots: TimetableSlot[];
}

interface StudentStat {
  studentId: string;
  name: string;
  email: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  rate: number | null;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Stats modal state
  const [statsClassId, setStatsClassId] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StudentStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsClassName, setStatsClassName] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/teacher/classes");
      setClasses(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fetchClassStats = async (classId: string, courseName: string) => {
    setStatsClassId(classId);
    setStatsClassName(courseName);
    setStatsLoading(true);
    setStatsModalOpen(true);
    setStatsData([]);
    try {
      const res = await apiClient.get(
        `/api/teacher/classes/stats?classId=${classId}`,
      );
      setStatsData(res.data);
    } catch {
    } finally {
      setStatsLoading(false);
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground">
            Manage your assigned courses and students
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchClasses}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{classes.length}</div>
            <div className="text-sm text-muted-foreground">Total Classes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalStudents}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {classes.reduce((sum, c) => sum + c.timetableSlots.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Weekly Sessions</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No classes assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isExpanded = expanded.has(cls.id);
            return (
              <Card key={cls.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(cls.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{cls.courseName}</CardTitle>
                        <CardDescription>{cls.courseCode}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        {cls.studentCount} students
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {cls.timetableSlots.length} sessions/week
                      </Badge>
                      {/* Attendance Stats button — stop propagation so card doesn't toggle */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchClassStats(cls.id, cls.courseName);
                        }}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Attendance Stats
                      </Button>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="grid md:grid-cols-2 gap-6 pt-0">
                    {/* Schedule */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Weekly Schedule
                      </h4>
                      <div className="space-y-2">
                        {cls.timetableSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No slots scheduled
                          </p>
                        ) : (
                          cls.timetableSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                            >
                              <span className="font-medium">
                                {slot.dayOfWeek.slice(0, 3)}
                              </span>
                              <span className="text-muted-foreground">
                                {slot.startTime} – {slot.endTime}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {slot.room}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Students */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Enrolled Students
                      </h4>
                      {cls.students.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No students enrolled
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cls.students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {student.email}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Attendance Stats Dialog */}
      <Dialog open={statsModalOpen} onOpenChange={setStatsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Attendance Stats — {statsClassName}
            </DialogTitle>
          </DialogHeader>

          {statsLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : statsData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No attendance records found for this class.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.map((s) => (
                    <TableRow key={s.studentId}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {s.present}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600 font-medium">
                        {s.late}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {s.absent}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.rate === null ? (
                          <Badge variant="outline">No data</Badge>
                        ) : (
                          <Badge
                            className={
                              s.rate >= 75
                                ? "bg-green-500 hover:bg-green-500 text-white"
                                : s.rate >= 50
                                  ? "bg-yellow-500 hover:bg-yellow-500 text-white"
                                  : "bg-red-500 hover:bg-red-500 text-white"
                            }
                          >
                            {s.rate}%
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
