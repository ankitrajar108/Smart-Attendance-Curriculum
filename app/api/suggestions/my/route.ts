import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (authUser.role !== "STUDENT") {
      return NextResponse.json([])
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: authUser.userId },
    })

    if (!student) {
      return NextResponse.json([])
    }

    // Get all activity suggestions - optionally filter by student's interests later
    const suggestions = await prisma.activitySuggestion.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      suggestions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        estimatedTime: s.estimatedTime,
        relevantCourses: s.relevantCourses ? s.relevantCourses.split(",").filter(Boolean) : [],
      }))
    )
  } catch (error) {
    console.error("Suggestions fetch error:", error)
    return NextResponse.json({ message: "Failed to fetch suggestions" }, { status: 500 })
  }
}
