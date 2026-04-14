"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentStat {
  id: string;
  name: string;
  email: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  rate: number | null;
  isBelowThreshold: boolean;
}

interface ReportSummary {
  totalStudents: number;
  totalRecords: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  overallRate: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusInfo(
  rate: number | null,
  threshold: number,
): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  if (rate === null) {
    return {
      label: "No Data",
      className:
        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      icon: null,
    };
  }
  if (rate >= threshold) {
    return {
      label: "Good",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
    };
  }
  if (rate >= threshold - 10) {
    return {
      label: "At Risk",
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: <TrendingDown className="w-3 h-3 mr-1" />,
    };
  }
  return {
    label: "Below Threshold",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: <AlertTriangle className="w-3 h-3 mr-1" />,
  };
}

function getRateBarColor(rate: number | null, threshold: number): string {
  if (rate === null) return "bg-gray-300";
  if (rate >= threshold) return "bg-green-500";
  if (rate >= threshold - 10) return "bg-yellow-500";
  return "bg-red-500";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { toast } = useToast();

  // Server data
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Threshold — applied = what we last fetched with; pending = what's in the input
  const [appliedThreshold, setAppliedThreshold] = useState(75);
  const [pendingThreshold, setPendingThreshold] = useState(75);

  // Search / filter
  const [search, setSearch] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReport = useCallback(
    async (threshold: number) => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/api/admin/reports?threshold=${threshold}`,
        );
        setStudents(res.data.students ?? []);
        setSummary(res.data.summary ?? null);
        setAppliedThreshold(threshold);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load attendance report.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchReport(75);
  }, [fetchReport]);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Recompute isBelowThreshold locally with the applied threshold so the UI
  // always stays in sync (the API's value uses the threshold at fetch time).
  const enriched = students.map((s) => ({
    ...s,
    isBelowThreshold: s.rate !== null && s.rate < appliedThreshold,
  }));

  const belowThresholdCount = enriched.filter((s) => s.isBelowThreshold).length;

  // Filter by search
  const searched =
    search.trim() === ""
      ? enriched
      : enriched.filter(
          (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()),
        );

  // Sort: below-threshold first, then by rate ascending (worst attendance first)
  const sorted = [...searched].sort((a, b) => {
    if (a.isBelowThreshold && !b.isBelowThreshold) return -1;
    if (!a.isBelowThreshold && b.isBelowThreshold) return 1;
    if (a.rate === null && b.rate === null) return 0;
    if (a.rate === null) return 1;
    if (b.rate === null) return -1;
    return a.rate - b.rate;
  });

  // ── Apply threshold ────────────────────────────────────────────────────────

  const handleApply = () => {
    if (pendingThreshold < 50 || pendingThreshold > 100) {
      toast({
        title: "Invalid threshold",
        description: "Threshold must be between 50 and 100.",
        variant: "destructive",
      });
      return;
    }
    fetchReport(pendingThreshold);
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Total Classes",
      "Present",
      "Late",
      "Absent",
      "Rate",
      "Status",
    ];
    const rows = enriched.map((s) => {
      const status = getStatusInfo(s.rate, appliedThreshold);
      return [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.email}"`,
        s.total,
        s.present,
        s.late,
        s.absent,
        s.rate !== null ? `${s.rate}%` : "No data",
        `"${status.label}"`,
      ];
    });

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground">
            School-wide attendance analytics and student performance overview
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport(appliedThreshold)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={loading || students.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Attendance
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">
                  {summary?.overallRate !== null && summary?.overallRate !== undefined
                    ? `${summary.overallRate}%`
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {summary?.totalStudents ?? 0} students
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Present
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">
                  {summary?.totalPresent ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  + {summary?.totalLate ?? 0} late
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Absent
            </CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-3xl font-bold text-red-600">
                  {summary?.totalAbsent ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {summary?.totalRecords ?? 0} total records
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Below Threshold
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-600">
                  {belowThresholdCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Below {appliedThreshold}% attendance
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Threshold control */}
        <div className="flex items-center gap-2 bg-muted/50 border rounded-lg px-3 py-1.5">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Flag students below:
          </span>
          <Input
            type="number"
            min={50}
            max={100}
            value={pendingThreshold}
            onChange={(e) => setPendingThreshold(Number(e.target.value))}
            className="w-20 h-7 text-sm text-center border-0 bg-transparent p-0 focus-visible:ring-0"
          />
          <span className="text-sm text-muted-foreground">%</span>
          <Button
            size="sm"
            variant="default"
            onClick={handleApply}
            disabled={loading}
            className="h-7 text-xs"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Student Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Student Attendance ({sorted.length} students)
            {search && (
              <span className="text-sm font-normal text-muted-foreground">
                — filtered by &ldquo;{search}&rdquo;
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {search ? "No students match your search." : "No student data available."}
              </p>
              {!search && (
                <p className="text-sm mt-1">
                  Students will appear here once they have attendance records.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="min-w-[160px]">Rate</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((student) => {
                    const status = getStatusInfo(
                      student.rate,
                      appliedThreshold,
                    );
                    const barColor = getRateBarColor(
                      student.rate,
                      appliedThreshold,
                    );
                    const rateValue = student.rate ?? 0;

                    return (
                      <TableRow
                        key={student.id}
                        className={
                          student.isBelowThreshold
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : undefined
                        }
                      >
                        {/* Name */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[120px]">
                              {student.name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-muted-foreground text-sm">
                          {student.email}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="text-center text-sm font-medium">
                          {student.total}
                        </TableCell>

                        {/* Present */}
                        <TableCell className="text-center text-sm text-green-600 font-medium">
                          {student.present}
                        </TableCell>

                        {/* Late */}
                        <TableCell className="text-center text-sm text-yellow-600 font-medium">
                          {student.late}
                        </TableCell>

                        {/* Absent */}
                        <TableCell className="text-center text-sm text-red-600 font-medium">
                          {student.absent}
                        </TableCell>

                        {/* Rate with progress bar */}
                        <TableCell>
                          {student.total === 0 ? (
                            <span className="text-sm text-muted-foreground italic">
                              No records
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Custom progress bar with dynamic color */}
                              <div className="relative w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                                <div
                                  className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
                                  style={{ width: `${rateValue}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold tabular-nums">
                                {student.rate}%
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Status badge */}
                        <TableCell>
                          <Badge className={`${status.className} font-medium flex w-fit items-center`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {!loading && students.length > 0 && (
        <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Good (≥ {appliedThreshold}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
            At Risk ({appliedThreshold - 10}% – {appliedThreshold - 1}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            Below Threshold (&lt; {appliedThreshold - 10}%)
          </span>
          <span className="ml-auto">
            Sorted: worst attendance first &bull; threshold {appliedThreshold}%
          </span>
        </div>
      )}
    </div>
  );
}
