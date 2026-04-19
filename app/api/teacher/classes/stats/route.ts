import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get("classId")
    if (!classId) return NextResponse.json({ message: "classId is required" }, { status: 400 })

    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: authUser.userId } })
    if (!teacher) return NextResponse.json({ message: "Teacher not found" }, { status: 404 })

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
                attendanceRecords: {
                  where: { timetableSlot: { classId } },
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    })

    if (!cls) return NextResponse.json({ message: "Class not found" }, { status: 404 })
    if (cls.teacherId !== teacher.id) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 })
    }

    const stats = cls.enrollments
      .map((e) => {
        const records = e.student.attendanceRecords
        const total = records.length
        const present = records.filter((r) => r.status === "PRESENT").length
        const late = records.filter((r) => r.status === "LATE").length
        const absent = records.filter((r) => r.status === "ABSENT").length
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : null
        return {
          studentId: e.studentId,
          name: e.student.user.name,
          email: e.student.user.email,
          total,
          present,
          late,
          absent,
          rate,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Teacher class stats error:", error)
    return NextResponse.json({ message: "Failed to fetch class stats" }, { status: 500 })
  }
}
