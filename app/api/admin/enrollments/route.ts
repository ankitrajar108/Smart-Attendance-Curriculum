import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// POST /api/admin/enrollments — enroll a student in a class
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { studentId, classId } = await req.json();

    if (!studentId || !classId) {
      return NextResponse.json(
        { message: "studentId and classId are required" },
        { status: 400 },
      );
    }

    // Verify the student profile exists
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!studentProfile) {
      return NextResponse.json(
        { message: "Student profile not found" },
        { status: 404 },
      );
    }

    // Verify the class exists
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    // Check whether the enrollment already exists (@@unique([studentId, classId]))
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });
    if (existingEnrollment) {
      return NextResponse.json(
        { message: "Student is already enrolled in this class" },
        { status: 400 },
      );
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId,
        classId,
      },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
        class: {
          select: { id: true, courseName: true, courseCode: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Student enrolled successfully",
        enrollment: {
          id: enrollment.id,
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          studentName: enrollment.student.user.name,
          studentEmail: enrollment.student.user.email,
          courseName: enrollment.class.courseName,
          courseCode: enrollment.class.courseCode,
          createdAt: enrollment.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin enroll student error:", error);
    return NextResponse.json(
      { message: "Failed to enroll student" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/enrollments — remove a student from a class
export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { studentId, classId } = await req.json();

    if (!studentId || !classId) {
      return NextResponse.json(
        { message: "studentId and classId are required" },
        { status: 400 },
      );
    }

    // Verify the enrollment exists before attempting deletion
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });
    if (!existingEnrollment) {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 },
      );
    }

    await prisma.classEnrollment.delete({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    return NextResponse.json({ message: "Student removed from class" });
  } catch (error) {
    console.error("Admin remove enrollment error:", error);
    return NextResponse.json(
      { message: "Failed to remove student from class" },
      { status: 500 },
    );
  }
}
