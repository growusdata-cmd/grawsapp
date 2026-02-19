
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== Role.CLIENT) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const inspectionId = params.id

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        })

        if (!user?.companyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const inspection = await prisma.inspection.findUnique({
            where: { id: inspectionId },
            include: {
                submitter: {
                    select: { name: true, email: true }
                },
                assignment: {
                    include: {
                        project: {
                            include: {
                                company: true
                            }
                        }
                    }
                },
                responses: {
                    include: {
                        field: true
                    }
                }
            }
        })

        if (!inspection) {
            return NextResponse.json({ error: "Inspection not found" }, { status: 404 })
        }

        // Authorization check: Does this inspection belong to the client's company?
        if (inspection.assignment.project.companyId !== user.companyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Only show approved reports to clients
        if (inspection.status !== "approved") {
            return NextResponse.json({ error: "Report not available" }, { status: 404 })
        }

        return NextResponse.json(inspection)
    } catch (error) {
        console.error("GET_CLIENT_REPORT_DETAIL_ERROR", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
