import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slotId");
    if (!slotId)
      return NextResponse.json(
        { message: "slotId is required" },
        { status: 400 },
      );

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authUser.userId },
    });
    if (!teacher)
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 },
      );

    const slot = await prisma.timetableSlot.findUnique({
      where: { id: slotId },
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
        attendanceRecords: {
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
          orderBy: { markedAt: "desc" },
        },
      },
    });

    if (!slot || slot.class.teacherId !== teacher.id) {
      return NextResponse.json(
        { message: "Slot not found or not yours" },
        { status: 403 },
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const students = slot.class.enrollments.map((e) => {
      const todayRecord = slot.attendanceRecords.find(
        (r) =>
          r.studentId === e.studentId && new Date(r.markedAt) >= todayStart,
      );
      return {
        studentId: e.studentId,
        name: e.student.user.name,
        email: e.student.user.email,
        todayRecord: todayRecord
          ? {
              id: todayRecord.id,
              status: todayRecord.status,
              note: (todayRecord as any).note ?? "",
              markedAt: todayRecord.markedAt,
            }
          : null,
      };
    });

    const allRecords = slot.attendanceRecords.map((r) => ({
      id: r.id,
      status: r.status,
      note: (r as any).note ?? "",
      markedAt: r.markedAt,
      studentId: r.studentId,
      studentName: r.student.user.name,
      studentEmail: r.student.user.email,
    }));

    return NextResponse.json({
      slot: {
        id: slot.id,
        courseName: slot.class.courseName,
        courseCode: slot.class.courseCode,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
      },
      students,
      allRecords,
    });
  } catch (error) {
    console.error("Teacher attendance GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch slot details" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { timetableSlotId, studentProfileId, status } = await req.json();
    if (!timetableSlotId || !studentProfileId || !status) {
      return NextResponse.json(
        {
          message: "timetableSlotId, studentProfileId, and status are required",
        },
        { status: 400 },
      );
    }
    if (!["PRESENT", "ABSENT", "LATE"].includes(status)) {
      return NextResponse.json(
        { message: "status must be PRESENT, ABSENT, or LATE" },
        { status: 400 },
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authUser.userId },
    });
    if (!teacher)
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 },
      );

    const slot = await prisma.timetableSlot.findUnique({
      where: { id: timetableSlotId },
      include: { class: true },
    });
    if (!slot || slot.class.teacherId !== teacher.id) {
      return NextResponse.json(
        { message: "Slot not found or not yours" },
        { status: 403 },
      );
    }

    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: studentProfileId,
          classId: slot.classId,
        },
      },
    });
    if (!enrollment) {
      return NextResponse.json(
        { message: "Student not enrolled in this class" },
        { status: 403 },
      );
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: studentProfileId,
        timetableSlotId,
        markedAt: { gte: todayStart },
      },
    });

    if (existing) {
      const updated = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status, note: "Manually updated by teacher" } as any,
      });
      return NextResponse.json({ record: updated, updated: true });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        studentId: studentProfileId,
        timetableSlotId,
        status,
        note: "Manually marked by teacher",
        markedAt: new Date(),
      } as any,
    });

    return NextResponse.json({ record, updated: false });
  } catch (error) {
    console.error("Teacher manual mark error:", error);
    return NextResponse.json(
      { message: "Failed to mark attendance" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "TEACHER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { recordId, status, note } = await req.json();
    if (!recordId) {
      return NextResponse.json(
        { message: "recordId is required" },
        { status: 400 },
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authUser.userId },
    });
    if (!teacher)
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 },
      );

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { timetableSlot: { include: { class: true } } },
    });

    if (!record)
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 },
      );
    if (record.timetableSlot.class.teacherId !== teacher.id) {
      return NextResponse.json(
        { message: "Not authorized to edit this record" },
        { status: 403 },
      );
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        ...(status &&
          ["PRESENT", "ABSENT", "LATE"].includes(status) && { status }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json({ record: updated });
  } catch (error) {
    console.error("Teacher attendance PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update record" },
      { status: 500 },
    );
  }
}
