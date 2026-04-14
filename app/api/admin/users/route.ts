import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        department: u.teacherProfile?.department || null,
        interests: u.studentProfile?.interests || null,
        careerGoals: u.studentProfile?.careerGoals || null,
        profileId: u.studentProfile?.id || u.teacherProfile?.id || null,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, role, department, interests, careerGoals } =
      await req.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "name, email, password, and role are required" },
        { status: 400 },
      );
    }

    if (!["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { message: "role must be one of STUDENT, TEACHER, or ADMIN" },
        { status: 400 },
      );
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email is already taken" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        studentProfile:
          role === "STUDENT"
            ? {
                create: {
                  interests: interests || "",
                  careerGoals: careerGoals || "",
                },
              }
            : undefined,
        teacherProfile:
          role === "TEACHER"
            ? {
                create: {
                  department: department || "",
                },
              }
            : undefined,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        department: user.teacherProfile?.department || null,
        interests: user.studentProfile?.interests || null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id, name, email, department, interests, careerGoals } =
      await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    // Fetch the target user to know their role
    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // If updating email, ensure it isn't already taken by another user
    if (email && email !== targetUser.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email } });
      if (emailConflict) {
        return NextResponse.json(
          { message: "Email is already taken" },
          { status: 400 },
        );
      }
    }

    // Build the user-level update payload
    const userUpdateData: Record<string, string> = {};
    if (name) userUpdateData.name = name;
    if (email) userUpdateData.email = email;

    // Run all updates in a transaction so they are atomic
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update core user fields (name / email) if anything changed
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({ where: { id }, data: userUpdateData });
      }

      // Update teacherProfile.department for TEACHER users
      if (targetUser.role === "TEACHER" && department !== undefined) {
        if (targetUser.teacherProfile) {
          await tx.teacherProfile.update({
            where: { userId: id },
            data: { department },
          });
        } else {
          // Profile missing — create it defensively
          await tx.teacherProfile.create({
            data: { userId: id, department: department || "" },
          });
        }
      }

      // Update studentProfile.interests / careerGoals for STUDENT users
      if (
        targetUser.role === "STUDENT" &&
        (interests !== undefined || careerGoals !== undefined)
      ) {
        const studentData: Record<string, string> = {};
        if (interests !== undefined) studentData.interests = interests;
        if (careerGoals !== undefined) studentData.careerGoals = careerGoals;

        if (targetUser.studentProfile) {
          await tx.studentProfile.update({
            where: { userId: id },
            data: studentData,
          });
        } else {
          await tx.studentProfile.create({
            data: {
              userId: id,
              interests: interests || "",
              careerGoals: careerGoals || "",
            },
          });
        }
      }

      // Return the fully refreshed user
      return tx.user.findUnique({
        where: { id },
        include: {
          studentProfile: true,
          teacherProfile: true,
        },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found after update" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      department: updatedUser.teacherProfile?.department || null,
      interests: updatedUser.studentProfile?.interests || null,
      careerGoals: updatedUser.studentProfile?.careerGoals || null,
    });
  } catch (error) {
    console.error("Admin edit user error:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 },
      );
    }
    if (id === authUser.userId) {
      return NextResponse.json(
        { message: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 },
    );
  }
}
