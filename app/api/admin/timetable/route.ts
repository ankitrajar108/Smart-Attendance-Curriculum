import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const VALID_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type DayOfWeek = (typeof VALID_DAYS)[number];

function isValidDay(value: unknown): value is DayOfWeek {
  return typeof value === "string" && (VALID_DAYS as readonly string[]).includes(value);
}

// POST /api/admin/timetable — add a timetable slot to a class
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { classId, dayOfWeek, startTime, endTime, room } = await req.json();

    // Validate required fields
    if (!classId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { message: "classId, dayOfWeek, startTime, and endTime are required" },
        { status: 400 },
      );
    }

    // Validate dayOfWeek value
    if (!isValidDay(dayOfWeek)) {
      return NextResponse.json(
        {
          message: `dayOfWeek must be one of: ${VALID_DAYS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Verify the class exists
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        classId,
        dayOfWeek,
        startTime,
        endTime,
        room: room ?? "",
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Admin add timetable slot error:", error);
    return NextResponse.json(
      { message: "Failed to create timetable slot" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/timetable — remove a timetable slot and its attendance records
export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Timetable slot ID is required" },
        { status: 400 },
      );
    }

    // Verify the slot exists before attempting deletion
    const slot = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!slot) {
      return NextResponse.json(
        { message: "Timetable slot not found" },
        { status: 404 },
      );
    }

    // Delete in dependency order:
    // 1. AttendanceRecords that reference this slot
    // 2. The TimetableSlot itself
    await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({
        where: { timetableSlotId: id },
      });

      await tx.timetableSlot.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Timetable slot deleted successfully" });
  } catch (error) {
    console.error("Admin delete timetable slot error:", error);
    return NextResponse.json(
      { message: "Failed to delete timetable slot" },
      { status: 500 },
    );
  }
}
