
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== Role.CLIENT) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        })

        if (!user?.companyId) {
            return NextResponse.json([])
        }

        const reports = await prisma.inspection.findMany({
            where: {
                status: "approved",
                assignment: {
                    project: {
                        companyId: user.companyId
                    }
                }
            },
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
                approvedAt: "desc"
            }
        })

        return NextResponse.json(reports)
    } catch (error) {
        console.error("GET_CLIENT_REPORTS_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
