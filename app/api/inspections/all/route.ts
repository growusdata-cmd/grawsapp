
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")

        const where: any = {}
        if (status && status !== "all") {
            where.status = status
        }

        const inspections = await prisma.inspection.findMany({
            where,
            include: {
                submitter: {
                    select: { name: true }
                },
                assignment: {
                    include: {
                        project: {
                            include: {
                                company: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(inspections)
    } catch (error) {
        console.error("GET_ALL_INSPECTIONS_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
