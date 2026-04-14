import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/admin/classes — list all classes with teacher info, student count, enrolled students, and timetable slots
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
        timetableSlots: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      classes.map((cls) => ({
        id: cls.id,
        courseName: cls.courseName,
        courseCode: cls.courseCode,
        teacherId: cls.teacherId,
        teacher: {
          name: cls.teacher.user.name,
          email: cls.teacher.user.email,
          department: cls.teacher.department,
        },
        studentCount: cls.enrollments.length,
        enrolledStudents: cls.enrollments.map((e) => ({
          studentProfileId: e.studentId,
          name: e.student.user.name,
          email: e.student.user.email,
        })),
        timetableSlots: cls.timetableSlots,
      })),
    );
  } catch (error) {
    console.error("Admin list classes error:", error);
    return NextResponse.json(
      { message: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}

// POST /api/admin/classes — create a new class
// Accepts teacherUserId (User.id) and resolves to TeacherProfile.id internally
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { courseName, courseCode, teacherUserId } = await req.json();

    if (!courseName || !courseCode || !teacherUserId) {
      return NextResponse.json(
        { message: "courseName, courseCode, and teacherUserId are required" },
        { status: 400 },
      );
    }

    // Ensure courseCode is unique
    const existingClass = await prisma.class.findUnique({
      where: { courseCode },
    });
    if (existingClass) {
      return NextResponse.json(
        { message: "A class with this course code already exists" },
        { status: 400 },
      );
    }

    // Resolve User.id → TeacherProfile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!teacherProfile) {
      return NextResponse.json(
        { message: "Teacher profile not found for this user" },
        { status: 404 },
      );
    }

    const newClass = await prisma.class.create({
      data: {
        courseName,
        courseCode,
        teacherId: teacherProfile.id,
      },
      include: {
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        timetableSlots: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: newClass.id,
        courseName: newClass.courseName,
        courseCode: newClass.courseCode,
        teacherId: newClass.teacherId,
        teacher: {
          name: newClass.teacher.user.name,
          email: newClass.teacher.user.email,
          department: newClass.teacher.department,
        },
        studentCount: newClass.enrollments.length,
        enrolledStudents: newClass.enrollments.map((e) => ({
          studentProfileId: e.studentId,
          name: e.student.user.name,
          email: e.student.user.email,
        })),
        timetableSlots: newClass.timetableSlots,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin create class error:", error);
    return NextResponse.json(
      { message: "Failed to create class" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/classes — edit an existing class
// Accepts optional teacherUserId (User.id) and resolves to TeacherProfile.id internally
export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id, courseName, courseCode, teacherUserId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Class ID is required" },
        { status: 400 },
      );
    }

    // Verify the class exists
    const existingClass = await prisma.class.findUnique({ where: { id } });
    if (!existingClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    // If courseCode is being changed, ensure it remains unique
    if (courseCode && courseCode !== existingClass.courseCode) {
      const codeConflict = await prisma.class.findUnique({
        where: { courseCode },
      });
      if (codeConflict) {
        return NextResponse.json(
          { message: "A class with this course code already exists" },
          { status: 400 },
        );
      }
    }

    // Build update payload
    const updateData: Record<string, string> = {};
    if (courseName) updateData.courseName = courseName;
    if (courseCode) updateData.courseCode = courseCode;

    // If teacherUserId provided, resolve to TeacherProfile.id
    if (teacherUserId) {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: teacherUserId },
      });
      if (!teacherProfile) {
        return NextResponse.json(
          { message: "Teacher profile not found for this user" },
          { status: 404 },
        );
      }
      updateData.teacherId = teacherProfile.id;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        timetableSlots: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedClass.id,
      courseName: updatedClass.courseName,
      courseCode: updatedClass.courseCode,
      teacherId: updatedClass.teacherId,
      teacher: {
        name: updatedClass.teacher.user.name,
        email: updatedClass.teacher.user.email,
        department: updatedClass.teacher.department,
      },
      studentCount: updatedClass.enrollments.length,
      enrolledStudents: updatedClass.enrollments.map((e) => ({
        studentProfileId: e.studentId,
        name: e.student.user.name,
        email: e.student.user.email,
      })),
      timetableSlots: updatedClass.timetableSlots,
    });
  } catch (error) {
    console.error("Admin edit class error:", error);
    return NextResponse.json(
      { message: "Failed to update class" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/classes — delete a class and all its related records
export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "Class ID is required" },
        { status: 400 },
      );
    }

    // Verify the class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: { timetableSlots: { select: { id: true } } },
    });
    if (!existingClass) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    const slotIds = existingClass.timetableSlots.map((s) => s.id);

    // Delete in dependency order to respect foreign-key constraints:
    // 1. AttendanceRecords that reference any of this class's timetable slots
    // 2. TimetableSlots belonging to this class
    // 3. ClassEnrollments for this class
    // 4. The Class itself
    await prisma.$transaction(async (tx) => {
      if (slotIds.length > 0) {
        await tx.attendanceRecord.deleteMany({
          where: { timetableSlotId: { in: slotIds } },
        });
      }

      await tx.timetableSlot.deleteMany({ where: { classId: id } });
      await tx.classEnrollment.deleteMany({ where: { classId: id } });
      await tx.class.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Admin delete class error:", error);
    return NextResponse.json(
      { message: "Failed to delete class" },
      { status: 500 },
    );
  }
}
