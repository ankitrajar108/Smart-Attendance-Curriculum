import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import { sessions } from "@/lib/session-store"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { token } = await params
    const session = sessions.get(token)

    if (!session) {
      return NextResponse.json({ message: "Session not found or expired" }, { status: 404 })
    }

    const isExpired = Date.now() > session.expiresAt

    // Get total enrolled students for this slot
    const slot = await prisma.timetableSlot.findUnique({
      where: { id: session.timetableSlotId },
      include: {
        class: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: { user: { select: { name: true, email: true } } },
                },
              },
            },
          },
        },
      },
    })

    if (!slot) {
      return NextResponse.json({ message: "Slot not found" }, { status: 404 })
    }

    const enrolledTotal = slot.class.enrollments.length

    // Build scanned student details
    const scannedDetails = await Promise.all(
      session.scannedStudents.map(async (studentId) => {
        const student = await prisma.studentProfile.findUnique({
          where: { id: studentId },
          include: { user: { select: { name: true, email: true } } },
        })
        return student
          ? { id: studentId, name: student.user.name, email: student.user.email }
          : null
      })
    )

    return NextResponse.json({
      token,
      timetableSlotId: session.timetableSlotId,
      courseName: slot.class.courseName,
      courseCode: slot.class.courseCode,
      scannedCount: session.scannedStudents.length,
      enrolledTotal,
      expiresAt: session.expiresAt,
      isExpired,
      secondsLeft: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
      scannedStudents: scannedDetails.filter(Boolean),
    })
  } catch (error) {
    console.error("Session status error:", error)
    return NextResponse.json({ message: "Failed to get session status" }, { status: 500 })
  }
}

// DELETE to close a session early
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { token } = await params
    sessions.delete(token)
    return NextResponse.json({ message: "Session closed" })
  } catch (error) {
    return NextResponse.json({ message: "Failed to close session" }, { status: 500 })
  }
}
