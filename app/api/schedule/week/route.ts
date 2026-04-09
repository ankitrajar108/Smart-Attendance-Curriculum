import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (authUser.role === "STUDENT") {
      const student = await prisma.studentProfile.findUnique({
        where: { userId: authUser.userId },
        include: {
          enrollments: {
            include: {
              class: {
                include: {
                  teacher: {
                    include: { user: { select: { name: true } } },
                  },
                  timetableSlots: {
                    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
                  },
                },
              },
            },
          },
        },
      })

      if (!student) return NextResponse.json([])

      const schedule = student.enrollments.flatMap((enrollment) =>
        enrollment.class.timetableSlots.map((slot) => ({
          id: slot.id,
          courseName: enrollment.class.courseName,
          courseCode: enrollment.class.courseCode,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dayOfWeek: slot.dayOfWeek,
          room: slot.room,
          teacher: { name: enrollment.class.teacher.user.name },
        }))
      )

      return NextResponse.json(schedule)
    }

    if (authUser.role === "TEACHER") {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: authUser.userId },
        include: {
          classes: {
            include: {
              timetableSlots: {
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      })

      if (!teacher) return NextResponse.json([])

      const schedule = teacher.classes.flatMap((cls) =>
        cls.timetableSlots.map((slot) => ({
          id: slot.id,
          courseName: cls.courseName,
          courseCode: cls.courseCode,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dayOfWeek: slot.dayOfWeek,
          room: slot.room,
        }))
      )

      return NextResponse.json(schedule)
    }

    // Admin
    const slots = await prisma.timetableSlot.findMany({
      include: {
        class: {
          include: {
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })

    return NextResponse.json(
      slots.map((slot) => ({
        id: slot.id,
        courseName: slot.class.courseName,
        courseCode: slot.class.courseCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeek: slot.dayOfWeek,
        room: slot.room,
        teacher: { name: slot.class.teacher.user.name },
      }))
    )
  } catch (error) {
    console.error("Week schedule error:", error)
    return NextResponse.json({ message: "Failed to fetch week schedule" }, { status: 500 })
  }
}
