
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ClipboardCheck,
    Calendar,
    User,
    ArrowRight,
    FileText,
    Loader2,
    Inbox
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function ClientDashboard() {
    const { data: session } = useSession()
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch("/api/client/reports")
                const data = await res.json()
                setReports(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error("Failed to fetch client reports", error)
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    const latestReport = reports.length > 0 ? reports[0] : null
    const companyName = reports.length > 0 ? reports[0].assignment.project.company.name : "Your Company"

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (reports && (reports as any).error) {
        const errorData = reports as any;
        return (
            <div className="container py-8 max-w-6xl">
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed shadow-sm bg-white">
                    <div className="flex flex-col items-center gap-2 text-center p-6">
                        <div className="h-12 w-12 text-destructive bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">
                            Failed to load reports
                        </h3>
                        <p className="text-sm text-muted-foreground flex flex-col gap-1 max-w-sm">
                            <span>{errorData.error || "An unexpected error occurred while fetching your reports."}</span>
                            {errorData.details && (
                                <span className="text-[10px] bg-muted p-2 rounded border mt-2 overflow-auto font-mono text-left">
                                    {errorData.details}
                                </span>
                            )}
                        </p>
                        <Button onClick={() => window.location.reload()} className="mt-6">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8 space-y-8 max-w-6xl">
            {/* Header Section */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome, {session?.user?.name}</h1>
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase">
                        {companyName}
                    </Badge>
                </div>
                <p className="text-muted-foreground">View and download your company's approved inspection reports.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-none bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary">{reports.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Approved inspections</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-none bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Latest Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {latestReport ? format(new Date(latestReport.approvedAt), "MMMM d, yyyy") : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Most recent approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Available Reports
                </h2>

                {reports.length === 0 ? (
                    <Card className="border-dashed py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                            <div className="bg-muted p-4 rounded-full">
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-lg">No approved reports yet</p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Reports will appear here once your inspections are approved by the management team.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {reports.map((report) => (
                            <Card key={report.id} className="group hover:border-primary/50 transition-colors shadow-sm overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className="flex-1 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                                    {report.assignment.project.company.name}
                                                </p>
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                                    {report.assignment.project.name}
                                                </h3>
                                            </div>
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold">
                                                <ClipboardCheck className="h-3 w-3 mr-1" />
                                                Approved
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="h-4 w-4" />
                                                <span><span className="font-medium text-foreground">Inspector:</span> {report.submitter.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span><span className="font-medium text-foreground">Submitted:</span> {format(new Date(report.submittedAt), "MMM d, yyyy")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <ClipboardCheck className="h-4 w-4" />
                                                <span><span className="font-medium text-foreground">Approved:</span> {format(new Date(report.approvedAt), "MMM d, yyyy")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-muted/30 md:w-48 flex items-center justify-center p-6 border-t md:border-t-0 md:border-l">
                                        <Button asChild className="w-full">
                                            <Link href={`/client/reports/${report.id}`}>
                                                View Report
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
