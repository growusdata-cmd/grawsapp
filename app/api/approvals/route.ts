
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
        const countOnly = searchParams.get("count") === "true"

        if (countOnly) {
            const count = await prisma.inspection.count({
                where: { status: "pending" }
            })
            return NextResponse.json({ count })
        }

        const pendingInspections = await prisma.inspection.findMany({
            where: { status: "pending" },
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
                submittedAt: "desc"
            }
        })

        return NextResponse.json(pendingInspections)
    } catch (error) {
        console.error("GET_APPROVALS_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
