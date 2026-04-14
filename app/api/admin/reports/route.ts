import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/reports?threshold=75
// Returns per-student attendance stats and school-wide summary
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const threshold = parseInt(searchParams.get("threshold") ?? "75", 10);

    // Fetch every student profile together with their user info and all attendance records
    const students = await prisma.studentProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        attendanceRecords: {
          select: { status: true },
        },
      },
      orderBy: {
        user: { name: "asc" },
      },
    });

    // ── Per-student calculations ──────────────────────────────────────────────
    let schoolTotalRecords = 0;
    let schoolTotalPresent = 0;
    let schoolTotalLate = 0;
    let schoolTotalAbsent = 0;

    const studentStats = students.map((student) => {
      const records = student.attendanceRecords;

      const total = records.length;
      const present = records.filter((r) => r.status === "PRESENT").length;
      const late = records.filter((r) => r.status === "LATE").length;
      const absent = records.filter((r) => r.status === "ABSENT").length;

      // Attendance rate counts PRESENT + LATE as "attended"
      const rate =
        total > 0 ? Math.round(((present + late) / total) * 100) : null;

      const isBelowThreshold = rate !== null && rate < threshold;

      // Accumulate school-wide totals
      schoolTotalRecords += total;
      schoolTotalPresent += present;
      schoolTotalLate += late;
      schoolTotalAbsent += absent;

      return {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        total,
        present,
        late,
        absent,
        rate,
        isBelowThreshold,
      };
    });

    // ── School-wide summary ───────────────────────────────────────────────────
    const overallRate =
      schoolTotalRecords > 0
        ? Math.round(
            ((schoolTotalPresent + schoolTotalLate) / schoolTotalRecords) * 100,
          )
        : null;

    const summary = {
      totalStudents: students.length,
      totalRecords: schoolTotalRecords,
      totalPresent: schoolTotalPresent,
      totalLate: schoolTotalLate,
      totalAbsent: schoolTotalAbsent,
      overallRate,
    };

    return NextResponse.json({
      students: studentStats,
      summary,
      threshold,
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { message: "Failed to generate attendance report" },
      { status: 500 },
    );
  }
}
