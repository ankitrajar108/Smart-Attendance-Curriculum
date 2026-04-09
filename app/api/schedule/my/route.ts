import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

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
                    where: { dayOfWeek: today },
                    orderBy: { startTime: "asc" },
                  },
                },
              },
            },
          },
        },
      })

      if (!student) {
        return NextResponse.json({ message: "Student not found" }, { status: 404 })
      }

      const schedule = student.enrollments.flatMap((enrollment) =>
        enrollment.class.timetableSlots.map((slot) => ({
          id: slot.id,
          courseName: enrollment.class.courseName,
          courseCode: enrollment.class.courseCode,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dayOfWeek: slot.dayOfWeek,
          room: slot.room,
          teacher: {
            name: enrollment.class.teacher.user.name,
          },
        }))
      ).sort((a, b) => a.startTime.localeCompare(b.startTime))

      return NextResponse.json(schedule)
    }

    if (authUser.role === "TEACHER") {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: authUser.userId },
        include: {
          classes: {
            include: {
              timetableSlots: {
                where: { dayOfWeek: today },
                orderBy: { startTime: "asc" },
              },
            },
          },
        },
      })

      if (!teacher) {
        return NextResponse.json({ message: "Teacher not found" }, { status: 404 })
      }

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
      ).sort((a, b) => a.startTime.localeCompare(b.startTime))

      return NextResponse.json(schedule)
    }

    // Admin - return all today's slots
    const slots = await prisma.timetableSlot.findMany({
      where: { dayOfWeek: today },
      include: {
        class: {
          include: {
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    const schedule = slots.map((slot) => ({
      id: slot.id,
      courseName: slot.class.courseName,
      courseCode: slot.class.courseCode,
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayOfWeek: slot.dayOfWeek,
      room: slot.room,
      teacher: { name: slot.class.teacher.user.name },
    }))

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Schedule fetch error:", error)
    return NextResponse.json({ message: "Failed to fetch schedule" }, { status: 500 })
  }
}
