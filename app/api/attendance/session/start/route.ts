import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { sessions } from "@/lib/session-store"

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden – teachers only" }, { status: 403 })
    }

    const { timetableSlotId } = await req.json()
    if (!timetableSlotId) {
      return NextResponse.json({ message: "timetableSlotId is required" }, { status: 400 })
    }

    // Verify teacher owns this slot
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authUser.userId },
    })
    if (!teacher) {
      return NextResponse.json({ message: "Teacher profile not found" }, { status: 404 })
    }

    const slot = await prisma.timetableSlot.findUnique({
      where: { id: timetableSlotId },
      include: { class: true },
    })
    if (!slot || slot.class.teacherId !== teacher.id) {
      return NextResponse.json({ message: "Slot not found or not yours" }, { status: 403 })
    }

    // Clean up any old sessions for this slot
    for (const [tok, sess] of sessions.entries()) {
      if (sess.timetableSlotId === timetableSlotId) {
        sessions.delete(tok)
      }
    }

    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    sessions.set(token, {
      timetableSlotId,
      teacherId: teacher.id,
      expiresAt,
      scannedStudents: [],
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const qrData = `${appUrl}/scan?token=${token}`

    return NextResponse.json({ token, qrData, expiresAt, slotInfo: {
      courseName: slot.class.courseName,
      courseCode: slot.class.courseCode,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
    }})
  } catch (error) {
    console.error("Session start error:", error)
    return NextResponse.json({ message: "Failed to start session" }, { status: 500 })
  }
}
