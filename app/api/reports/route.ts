import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Helper to parse a number value safely
function parseNum(val: string | null | undefined): number {
    if (!val) return 0
    const n = parseFloat(val.replace(/,/g, ""))
    return isNaN(n) ? 0 : n
}

// Normalize a field label for matching
function normalizeLabel(label: string): string {
    return label.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function matchesLabel(label: string, keywords: string[]): boolean {
    const norm = normalizeLabel(label)
    return keywords.some(k => norm.includes(normalizeLabel(k)))
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()))
    const role = session.user.role

    // Determine companyId filter
    let companyId: string | null = null
    if (role === "CLIENT") {
        // Clients always see their own company
        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        companyId = user?.companyId ?? null
    } else if (role === "ADMIN" || role === "MANAGER") {
        companyId = searchParams.get("companyId") || null
    } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Date range for the selected month/year
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    try {
        // Fetch all relevant inspections with full relations
        const inspections = await prisma.inspection.findMany({
            where: {
                status: { in: ["approved", "pending"] },
                submittedAt: {
                    gte: startDate,
                    lte: endDate,
                },
                assignment: {
                    project: companyId
                        ? { companyId }
                        : undefined,
                },
            },
            include: {
                responses: {
                    include: { field: true },
                },
                assignment: {
                    include: {
                        project: {
                            include: { company: true },
                        },
                        inspectionBoy: true,
                    },
                },
                submitter: true,
            },
        })

        // Aggregate data
        const summary = {
            totalInspected: 0,
            totalAccepted: 0,
            totalRework: 0,
            totalRejected: 0,
            acceptanceRate: 0,
            reworkRate: 0,
            rejectionRate: 0,
            reworkPPM: 0,
            rejectionPPM: 0,
            overallPPM: 0,
            period: `${getMonthName(month)} ${year}`,
            companyName: companyId
                ? (await prisma.company.findUnique({ where: { id: companyId } }))?.name ?? "All Companies"
                : "All Companies",
            partModel: "",
        }

        // Part-wise accumulator
        const partMap: Record<string, {
            partName: string;
            totalInspected: number;
            totalAccepted: number;
            totalRework: number;
            totalRejected: number;
        }> = {}

        // Day-wise accumulator
        const dayMap: Record<string, {
            date: string;
            totalInspected: number;
            totalAccepted: number;
            totalRework: number;
            totalRejected: number;
        }> = {}

        // Inspector-wise accumulator
        const inspectorMap: Record<string, {
            inspectorName: string;
            totalInspected: number;
            totalAccepted: number;
            totalRework: number;
            totalRejected: number;
        }> = {}

        // Location-wise accumulator
        const locationMap: Record<string, {
            location: string;
            totalInspected: number;
            totalRework: number;
            totalRejected: number;
        }> = {}

        // Defect accumulator
        const defectMap: Record<string, number> = {}

        const partModels = new Set<string>()

        for (const inspection of inspections) {
            const responses = inspection.responses
            const inspectorName = inspection.assignment.inspectionBoy.name
            const date = inspection.submittedAt
                ? new Date(inspection.submittedAt).toISOString().slice(0, 10)
                : new Date(inspection.createdAt).toISOString().slice(0, 10)

            // Extract field values by label matching
            let partName = "General"
            let inspected = 0
            let accepted = 0
            let rework = 0
            let rejected = 0
            let location = "Main"
            let partModel = ""

            for (const r of responses) {
                const label = r.field.fieldLabel
                const val = r.value || ""

                if (matchesLabel(label, ["part name", "partname", "part"])) {
                    if (val) partName = val
                }
                if (matchesLabel(label, ["part model", "model", "component model"])) {
                    if (val) { partModel = val; partModels.add(val) }
                }
                if (matchesLabel(label, ["total inspected", "inspected", "qty inspected", "quantity inspected"])) {
                    inspected = parseNum(val)
                }
                if (matchesLabel(label, ["total accepted", "accepted", "ok qty", "ok"])) {
                    accepted = parseNum(val)
                }
                if (matchesLabel(label, ["total rework", "rework", "rework qty"])) {
                    rework = parseNum(val)
                }
                if (matchesLabel(label, ["total rejected", "rejected", "rejection qty", "rejection"])) {
                    rejected = parseNum(val)
                }
                if (matchesLabel(label, ["location", "shift location", "plant location"])) {
                    if (val) location = val
                }
                // Defect fields - any field starting with defect
                if (matchesLabel(label, ["defect", "defect type", "defect name", "defect reason"])) {
                    if (val && val.trim()) {
                        defectMap[val.trim()] = (defectMap[val.trim()] || 0) + 1
                    }
                }
            }

            // If inspected is 0 but accepted/rework/rejected are present, compute inspected
            if (inspected === 0 && (accepted + rework + rejected) > 0) {
                inspected = accepted + rework + rejected
            }
            // If accepted is 0 and we have inspected, rework, rejected
            if (accepted === 0 && inspected > 0) {
                accepted = Math.max(0, inspected - rework - rejected)
            }

            // Accumulate summary
            summary.totalInspected += inspected
            summary.totalAccepted += accepted
            summary.totalRework += rework
            summary.totalRejected += rejected

            // Part-wise
            if (!partMap[partName]) {
                partMap[partName] = { partName, totalInspected: 0, totalAccepted: 0, totalRework: 0, totalRejected: 0 }
            }
            partMap[partName].totalInspected += inspected
            partMap[partName].totalAccepted += accepted
            partMap[partName].totalRework += rework
            partMap[partName].totalRejected += rejected

            // Day-wise
            if (!dayMap[date]) {
                dayMap[date] = { date, totalInspected: 0, totalAccepted: 0, totalRework: 0, totalRejected: 0 }
            }
            dayMap[date].totalInspected += inspected
            dayMap[date].totalAccepted += accepted
            dayMap[date].totalRework += rework
            dayMap[date].totalRejected += rejected

            // Inspector-wise
            if (!inspectorMap[inspectorName]) {
                inspectorMap[inspectorName] = { inspectorName, totalInspected: 0, totalAccepted: 0, totalRework: 0, totalRejected: 0 }
            }
            inspectorMap[inspectorName].totalInspected += inspected
            inspectorMap[inspectorName].totalAccepted += accepted
            inspectorMap[inspectorName].totalRework += rework
            inspectorMap[inspectorName].totalRejected += rejected

            // Location-wise
            if (!locationMap[location]) {
                locationMap[location] = { location, totalInspected: 0, totalRework: 0, totalRejected: 0 }
            }
            locationMap[location].totalInspected += inspected
            locationMap[location].totalRework += rework
            locationMap[location].totalRejected += rejected
        }

        // Compute rates
        const total = summary.totalInspected
        if (total > 0) {
            summary.acceptanceRate = parseFloat(((summary.totalAccepted / total) * 100).toFixed(2))
            summary.reworkRate = parseFloat(((summary.totalRework / total) * 100).toFixed(2))
            summary.rejectionRate = parseFloat(((summary.totalRejected / total) * 100).toFixed(2))
            summary.reworkPPM = Math.round((summary.totalRework / total) * 1_000_000)
            summary.rejectionPPM = Math.round((summary.totalRejected / total) * 1_000_000)
            summary.overallPPM = Math.round(((summary.totalRework + summary.totalRejected) / total) * 1_000_000)
        }
        summary.partModel = Array.from(partModels).join(", ") || "N/A"

        // Build partWise array
        const partWise = Object.values(partMap)
            .sort((a, b) => b.totalInspected - a.totalInspected)
            .map(p => ({
                ...p,
                reworkPercent: p.totalInspected > 0
                    ? parseFloat(((p.totalRework / p.totalInspected) * 100).toFixed(2))
                    : 0,
                rejectionPercent: p.totalInspected > 0
                    ? parseFloat(((p.totalRejected / p.totalInspected) * 100).toFixed(2))
                    : 0,
                qualityRate: p.totalInspected > 0
                    ? parseFloat((((p.totalAccepted) / p.totalInspected) * 100).toFixed(2))
                    : 0,
            }))

        // Build dayWise array
        const dayWise = Object.values(dayMap)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(d => ({
                ...d,
                qualityRate: d.totalInspected > 0
                    ? parseFloat(((d.totalAccepted / d.totalInspected) * 100).toFixed(2))
                    : 0,
            }))

        // Build inspectorWise array
        const inspectorWise = Object.values(inspectorMap)
            .sort((a, b) => b.totalInspected - a.totalInspected)
            .map(i => ({
                ...i,
                qualityRate: i.totalInspected > 0
                    ? parseFloat(((i.totalAccepted / i.totalInspected) * 100).toFixed(2))
                    : 0,
            }))

        // Build locationWise array
        const locationWise = Object.values(locationMap)
            .sort((a, b) => b.totalInspected - a.totalInspected)

        // Build topDefects array (sorted descending by count)
        const totalDefects = Object.values(defectMap).reduce((a, b) => a + b, 0)
        const topDefects = Object.entries(defectMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([defectName, count]) => ({
                defectName,
                count,
                percentage: totalDefects > 0 ? parseFloat(((count / totalDefects) * 100).toFixed(2)) : 0,
            }))

        return NextResponse.json({
            summary,
            partWise,
            dayWise,
            inspectorWise,
            locationWise,
            topDefects,
        })
    } catch (error) {
        console.error("[REPORTS_GET]", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}

function getMonthName(month: number): string {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]
    return months[month - 1] || "Unknown"
}
