import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { sessions } from "@/lib/session-store"

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden – students only" }, { status: 403 })
    }

    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 })
    }

    const session = sessions.get(token)

    if (!session) {
      return NextResponse.json({ message: "Invalid or expired QR code" }, { status: 404 })
    }

    if (Date.now() > session.expiresAt) {
      sessions.delete(token)
      return NextResponse.json({ message: "QR code has expired. Ask your teacher to generate a new one." }, { status: 410 })
    }

    // Get student profile
    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })
    if (!student) {
      return NextResponse.json({ message: "Student profile not found" }, { status: 404 })
    }

    // Check if already scanned this session
    if (session.scannedStudents.includes(student.id)) {
      return NextResponse.json({ message: "You have already marked attendance for this session ✓" }, { status: 200 })
    }

    // Check if student is enrolled in this class
    const slot = await prisma.timetableSlot.findUnique({
      where: { id: session.timetableSlotId },
      include: { class: true },
    })
    if (!slot) {
      return NextResponse.json({ message: "Session slot not found" }, { status: 404 })
    }

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { studentId_classId: { studentId: student.id, classId: slot.class.id } },
    })
    if (!enrollment) {
      return NextResponse.json({ message: "You are not enrolled in this class" }, { status: 403 })
    }

    // Check if already marked today via manual method too
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: student.id,
        timetableSlotId: session.timetableSlotId,
        markedAt: { gte: today },
      },
    })

    if (!existing) {
      // Create attendance record
      await prisma.attendanceRecord.create({
        data: {
          studentId: student.id,
          timetableSlotId: session.timetableSlotId,
          status: "PRESENT",
          markedAt: new Date(),
        },
      })
    }

    // Add to session's scanned list
    session.scannedStudents.push(student.id)

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${slot.class.courseName}!`,
      courseName: slot.class.courseName,
      courseCode: slot.class.courseCode,
    })
  } catch (error) {
    console.error("Session scan error:", error)
    return NextResponse.json({ message: "Failed to mark attendance" }, { status: 500 })
  }
}
