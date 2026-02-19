"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Building2,
    Calendar,
    User as UserIcon,
    History,
    FileEdit,
    Clock,
    LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function InspectionDashboard() {
    const { data: session } = useSession()
    const [assignments, setAssignments] = useState<any[]>([])
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [asgnRes, subRes] = await Promise.all([
                    fetch("/api/assignments"),
                    fetch("/api/inspections?recent=5")
                ])
                const asgnData = await asgnRes.json()
                const subData = await subRes.json()
                setAssignments(Array.isArray(asgnData) ? asgnData : [])
                setRecentSubmissions(Array.isArray(subData) ? subData : [])
            } catch (error) {
                console.error("Failed to fetch inspection data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const activeCount = assignments.filter(a => a.status === "active").length
    const draftCount = recentSubmissions.filter(s => s.status === "draft").length
    const completedCount = assignments.filter(a => a.status === "completed").length

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Inspector Workspace</h1>
                <p className="text-muted-foreground font-medium text-sm">Track assignments and submit inspection reports</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Active</p>
                            <p className="text-2xl font-bold">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                            <FileEdit className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Drafts</p>
                            <p className="text-2xl font-bold">{draftCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Completed</p>
                            <p className="text-2xl font-bold">{completedCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Assignments */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Active Assignments
                        </h2>
                    </div>

                    {assignments.filter(a => a.status === "active").length === 0 ? (
                        <Card className="border-dashed h-[300px] flex flex-col items-center justify-center text-center p-8 bg-muted/5">
                            <div className="p-3 rounded-full bg-muted mb-4">
                                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-bold">No active assignments</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2 font-medium">
                                When a manager assigns you to a project, it will appear here.
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assignments.filter(a => a.status === "active").map((a) => (
                                <Card key={a.id} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                                    <div className="h-2 bg-primary" />
                                    <div className="p-5 flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                <Building2 className="h-3 w-3" />
                                                {a.project.company.name}
                                            </p>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors leading-tight">{a.project.name}</h3>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <UserIcon className="h-3.5 w-3.5" />
                                                Assigned by: {a.assigner.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Assigned {format(new Date(a.createdAt), "MMM d, yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/30 border-t">
                                        <Button className="w-full font-bold shadow-sm" asChild>
                                            <Link href={`/inspection/${a.id}/form`}>
                                                Start Inspection
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recently Submitted / History */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-emerald-500" />
                        Activity feed
                    </h2>
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {recentSubmissions.map((s) => (
                                    <div key={s.id} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="text-sm font-bold truncate max-w-[150px]">{s.assignment.project.name}</h4>
                                            <Badge className={cn(
                                                "capitalize border-none text-[9px] h-4 px-1.5 font-bold",
                                                s.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {s.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" />
                                                {formatDistanceToNow(new Date(s.submittedAt || s.updatedAt))} ago
                                            </p>
                                            <Link href={`/inspection/${s.assignmentId}/form`} className="text-[10px] font-bold text-primary hover:underline">
                                                {s.status === "draft" ? "Resume →" : "View →"}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {recentSubmissions.length === 0 && (
                                    <div className="p-12 text-center text-muted-foreground italic text-xs">
                                        No recent submissions.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

