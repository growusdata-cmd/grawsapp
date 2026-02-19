"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    Folder,
    ClipboardCheck,
    Users,
    ArrowRight,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Loader2,
    ClipboardList
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats")
                const data = await res.json()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch admin stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        )
    }

    if (!stats || stats.error) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <XCircle className="h-10 w-10 text-destructive" />
                    <h3 className="text-xl font-bold tracking-tight">
                        Failed to load dashboard data
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {stats?.error || "An unexpected error occurred while fetching system statistics."}
                    </p>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const kpiCards = [
        {
            title: "Total Companies",
            value: stats.totalCompanies ?? 0,
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50",
            link: "/companies"
        },
        {
            title: "Total Projects",
            value: stats.totalProjects ?? 0,
            icon: Folder,
            color: "text-purple-600",
            bg: "bg-purple-50",
            link: "/projects"
        },
        {
            title: "Pending Approvals",
            value: stats.pendingApprovals ?? 0,
            icon: ClipboardCheck,
            color: "text-amber-600",
            bg: "bg-amber-50",
            link: "/approvals",
            badge: (stats.pendingApprovals ?? 0) > 0
        },
        {
            title: "Total Users",
            value: stats.totalUsers ?? 0,
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            link: "/admin/users"
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                <p className="text-muted-foreground font-medium">System performance and management dashboard</p>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {kpiCards.map((card) => (
                    <Link key={card.title} href={card.link}>
                        <Card className="hover:shadow-lg transition-all border-none shadow-sm group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`${card.bg} ${card.color} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                    {card.badge && (
                                        <div className="flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Inspections */}
                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                        <CardTitle className="text-lg font-bold">Recent Submissions</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/approvals" className="text-primary font-semibold flex items-center gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-muted/30 text-muted-foreground font-medium uppercase text-[10px] tracking-wider border-b">
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Inspector</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(stats.recentInspections || []).map((i: any) => (
                                        <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-semibold">{i.projectName}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{i.inspectorName}</td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {i.submittedAt ? format(new Date(i.submittedAt), "MMM d, HH:mm") : "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={cn(
                                                    "capitalize border-none font-medium text-[10px]",
                                                    i.status === "pending" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                        i.status === "approved" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                            "bg-red-100 text-red-700 hover:bg-red-100"
                                                )}>
                                                    {i.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                                                    <Link href={`/approvals/${i.id}`}>
                                                        <Search className="h-4 w-4 text-primary" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats.recentInspections || stats.recentInspections.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                                No recent submissions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <Button className="w-full justify-start gap-3 h-12 shadow-sm" asChild>
                            <Link href="/companies/create">
                                <Plus className="h-4 w-4" /> Add New Company
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                            <Link href="/projects/create">
                                <Folder className="h-4 w-4" /> Create Project
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                            <Link href="/assignments">
                                <ClipboardList className="h-4 w-4" /> Manage Assignments
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-3 h-12" asChild>
                            <Link href="/admin/users">
                                <Users className="h-4 w-4" /> System Users
                            </Link>
                        </Button>
                        <Button variant="secondary" className="w-full justify-start gap-3 h-12" asChild>
                            <Link href="/approvals">
                                <ClipboardCheck className="h-4 w-4" /> View All Reports
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Third Row - Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white md:col-span-1">
                    <CardContent className="p-6 text-center space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Approval Rate</p>
                        <p className="text-4xl font-extrabold text-primary">{stats.thisMonth?.approvalRate ?? 0}%</p>
                        <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 w-fit mx-auto px-2 py-0.5 rounded-full">
                            <TrendingUp className="h-3 w-3" /> Monthly Target
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white md:col-span-3">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-3 divide-x">
                            <div className="px-6 text-center">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Inspected</p>
                                <p className="text-2xl font-bold">{stats.thisMonth?.totalInspections ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">This Month</p>
                            </div>
                            <div className="px-6 text-center">
                                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Approved</p>
                                <p className="text-2xl font-bold text-emerald-700">{stats.thisMonth?.approved ?? 0}</p>
                                <Badge variant="outline" className="mt-1 text-[9px] border-emerald-100 text-emerald-600">Success</Badge>
                            </div>
                            <div className="px-6 text-center">
                                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Rejected</p>
                                <p className="text-2xl font-bold text-red-700">{stats.thisMonth?.rejected ?? 0}</p>
                                <Badge variant="outline" className="mt-1 text-[9px] border-red-100 text-red-600">Action Required</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
