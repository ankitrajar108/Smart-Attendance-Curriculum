import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const db = prisma as any;

// GET /api/student/activities
// Returns all active suggestions with this student's interaction status
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!student) return NextResponse.json([]);

    const [suggestions, interactions] = await Promise.all([
      prisma.activitySuggestion.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      db.studentActivityInteraction.findMany({
        where: { studentId: student.id },
      }),
    ]);

    const interactionMap = new Map<string, string>(
      interactions.map((i: { suggestionId: string; status: string }) => [
        i.suggestionId,
        i.status,
      ]),
    );

    return NextResponse.json(
      suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        estimatedTime: s.estimatedTime,
        relevantCourses: s.relevantCourses
          ? s.relevantCourses.split(",").filter(Boolean)
          : [],
        interaction: interactionMap.get(s.id) ?? null,
      })),
    );
  } catch (error) {
    console.error("Student activities GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}

// POST /api/student/activities
// Body: { suggestionId, status: "COMPLETED" | "NOT_INTERESTED" }
// Upserts the interaction record
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { suggestionId, status } = await req.json();

    if (!suggestionId || !status) {
      return NextResponse.json(
        { message: "suggestionId and status are required" },
        { status: 400 },
      );
    }

    if (!["COMPLETED", "NOT_INTERESTED"].includes(status)) {
      return NextResponse.json(
        { message: "status must be COMPLETED or NOT_INTERESTED" },
        { status: 400 },
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student profile not found" },
        { status: 404 },
      );
    }

    const interaction = await db.studentActivityInteraction.upsert({
      where: {
        studentId_suggestionId: {
          studentId: student.id,
          suggestionId,
        },
      },
      update: { status },
      create: {
        studentId: student.id,
        suggestionId,
        status,
      },
    });

    return NextResponse.json({ interaction });
  } catch (error) {
    console.error("Student activities POST error:", error);
    return NextResponse.json(
      { message: "Failed to update activity" },
      { status: 500 },
    );
  }
}

// DELETE /api/student/activities
// Body: { suggestionId }
// Removes the interaction (undo completed/not-interested)
export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { suggestionId } = await req.json();

    if (!suggestionId) {
      return NextResponse.json(
        { message: "suggestionId is required" },
        { status: 400 },
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student profile not found" },
        { status: 404 },
      );
    }

    await db.studentActivityInteraction.deleteMany({
      where: {
        studentId: student.id,
        suggestionId,
      },
    });

    return NextResponse.json({ message: "Interaction removed" });
  } catch (error) {
    console.error("Student activities DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to remove interaction" },
      { status: 500 },
    );
  }
}
