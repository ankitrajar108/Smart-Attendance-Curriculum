import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// GET all personal goals for the logged-in student
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })

    if (!student) return NextResponse.json([])

    const goals = await prisma.personalGoal.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(goals)
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch goals" }, { status: 500 })
  }
}

// POST create a new goal
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { title, description, deadline } = await req.json()
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 })
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })

    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 })

    const goal = await prisma.personalGoal.create({
      data: {
        studentId: student.id,
        title,
        description: description || "",
        deadline: deadline ? new Date(deadline) : null,
        progress: 0,
      },
    })

    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ message: "Failed to create goal" }, { status: 500 })
  }
}

// PATCH update goal progress
export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id, progress, isCompleted, title, description } = await req.json()
    if (!id) {
      return NextResponse.json({ message: "Goal ID is required" }, { status: 400 })
    }

    const goal = await prisma.personalGoal.update({
      where: { id },
      data: {
        ...(progress !== undefined && { progress: Math.min(100, Math.max(0, progress)) }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(goal)
  } catch (error) {
    return NextResponse.json({ message: "Failed to update goal" }, { status: 500 })
  }
}

// DELETE a goal
export async function DELETE(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser || authUser.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    await prisma.personalGoal.delete({ where: { id } })

    return NextResponse.json({ message: "Goal deleted" })
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete goal" }, { status: 500 })
  }
}
