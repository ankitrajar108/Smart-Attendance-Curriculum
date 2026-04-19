import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role === "STUDENT") {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: authUser.userId },
      });

      if (!student)
        return NextResponse.json({
          records: [],
          stats: { total: 0, present: 0, absent: 0, late: 0 },
          perSubject: [],
        });

      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: {
          timetableSlot: {
            include: {
              class: {
                include: {
                  teacher: { include: { user: { select: { name: true } } } },
                },
              },
            },
          },
        },
        orderBy: { markedAt: "desc" },
        take: 500,
      });

      const stats = {
        total: records.length,
        present: records.filter((r) => r.status === "PRESENT").length,
        absent: records.filter((r) => r.status === "ABSENT").length,
        late: records.filter((r) => r.status === "LATE").length,
      };

      // Per-subject breakdown
      const subjectMap = new Map<
        string,
        {
          courseCode: string;
          courseName: string;
          teacher: string;
          total: number;
          present: number;
          late: number;
          absent: number;
        }
      >();

      for (const r of records) {
        const key = r.timetableSlot.class.courseCode;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            courseCode: key,
            courseName: r.timetableSlot.class.courseName,
            teacher: r.timetableSlot.class.teacher.user.name,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
          });
        }
        const entry = subjectMap.get(key)!;
        entry.total++;
        if (r.status === "PRESENT") entry.present++;
        else if (r.status === "LATE") entry.late++;
        else if (r.status === "ABSENT") entry.absent++;
      }

      const perSubject = Array.from(subjectMap.values())
        .map((s) => ({
          ...s,
          rate:
            s.total > 0
              ? Math.round(((s.present + s.late) / s.total) * 100)
              : null,
        }))
        .sort((a, b) => a.courseName.localeCompare(b.courseName));

      return NextResponse.json({
        records: records.map((r) => ({
          id: r.id,
          status: r.status,
          markedAt: r.markedAt,
          courseName: r.timetableSlot.class.courseName,
          courseCode: r.timetableSlot.class.courseCode,
          teacher: r.timetableSlot.class.teacher.user.name,
          startTime: r.timetableSlot.startTime,
          endTime: r.timetableSlot.endTime,
          dayOfWeek: r.timetableSlot.dayOfWeek,
        })),
        stats,
        perSubject,
      });
    }

    if (authUser.role === "TEACHER") {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: authUser.userId },
        include: { classes: true },
      });

      if (!teacher) return NextResponse.json({ records: [], stats: {} });

      const classIds = teacher.classes.map((c) => c.id);
      const slots = await prisma.timetableSlot.findMany({
        where: { classId: { in: classIds } },
        include: {
          class: true,
          attendanceRecords: {
            include: {
              student: {
                include: { user: { select: { name: true, email: true } } },
              },
            },
          },
        },
      });

      const totalRecords = slots.flatMap((s) => s.attendanceRecords);
      const stats = {
        total: totalRecords.length,
        present: totalRecords.filter((r) => r.status === "PRESENT").length,
        absent: totalRecords.filter((r) => r.status === "ABSENT").length,
        late: totalRecords.filter((r) => r.status === "LATE").length,
      };

      return NextResponse.json({ slots, stats });
    }

    return NextResponse.json({ records: [], stats: {} });
  } catch (error) {
    console.error("Records fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch records" },
      { status: 500 },
    );
  }
}
