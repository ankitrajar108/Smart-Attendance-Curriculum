import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// POST /api/attendance/mark
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { timetableSlotId, status = "PRESENT" } = await req.json()

    if (!timetableSlotId) {
      return NextResponse.json({ message: "timetableSlotId is required" }, { status: 400 })
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })

    if (!student) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 })
    }

    // Check if already marked today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        timetableSlotId,
        markedAt: { gte: today },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Attendance already marked for today", record: existing })
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: student.id,
        timetableSlotId,
        status,
        markedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Attendance marked successfully", record })
  } catch (error) {
    console.error("Attendance mark error:", error)
    return NextResponse.json({ message: "Failed to mark attendance" }, { status: 500 })
  }
}

// GET /api/attendance/mark - get today's marked slots
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })

    if (!student) {
      return NextResponse.json([])
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        markedAt: { gte: today },
      },
      include: {
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Attendance fetch error:", error)
    return NextResponse.json({ message: "Failed to fetch attendance" }, { status: 500 })
  }
}
