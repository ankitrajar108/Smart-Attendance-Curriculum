import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authUser.userId },
      include: {
        classes: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: { user: { select: { name: true, email: true } } },
                },
              },
            },
            timetableSlots: true,
          },
        },
      },
    })

    if (!teacher) return NextResponse.json([])

    return NextResponse.json(
      teacher.classes.map((cls) => ({
        id: cls.id,
        courseName: cls.courseName,
        courseCode: cls.courseCode,
        studentCount: cls.enrollments.length,
        students: cls.enrollments.map((e) => ({
          id: e.student.id,
          name: e.student.user.name,
          email: e.student.user.email,
        })),
        timetableSlots: cls.timetableSlots,
      }))
    )
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch classes" }, { status: 500 })
  }
}
