
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user } = session
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: any = {}

    if (user.role === Role.INSPECTION_BOY) {
        where.inspectionBoyId = user.id
    } else if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (status && status !== "all") {
        where.status = status
    }

    try {
        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                project: {
                    include: {
                        company: true
                    }
                },
                inspectionBoy: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                assigner: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(assignments)
    } catch (error) {
        console.error("GET_ASSIGNMENTS_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { projectId, inspectionBoyId } = body

        if (!projectId || !inspectionBoyId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Check for duplicate active assignment
        const existingAssignment = await prisma.assignment.findFirst({
            where: {
                projectId,
                inspectionBoyId,
                status: "active"
            }
        })

        if (existingAssignment) {
            return NextResponse.json({ error: "Active assignment already exists for this inspector on this project" }, { status: 400 })
        }

        const assignment = await prisma.assignment.create({
            data: {
                projectId,
                inspectionBoyId,
                assignedBy: session.user.id,
                status: "active"
            }
        })

        return NextResponse.json(assignment)
    } catch (error: any) {
        console.error("POST_ASSIGNMENT_ERROR_FULL:", error)
        return NextResponse.json({
            error: "Internal Error",
            details: error?.message || "Unknown error"
        }, { status: 500 })
    }

}
