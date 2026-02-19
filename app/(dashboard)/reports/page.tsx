"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { format, parseISO } from "date-fns"
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ComposedChart, Line, LineChart,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts"

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY = "#1e3a5f"
const BLUE = "#2563eb"
const GREEN = "#10b981"
const AMBER = "#f59e0b"
const RED = "#ef4444"
const GRAY_BG = "#f8fafc"
const BORDER = "#e2e8f0"
const TEXT_DARK = "#0f1923"
const TEXT_MUTED = "#64748b"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface Summary {
    totalInspected: number
    totalAccepted: number
    totalRework: number
    totalRejected: number
    acceptanceRate: number
    reworkRate: number
    rejectionRate: number
    reworkPPM: number
    rejectionPPM: number
    overallPPM: number
    period: string
    companyName: string
    partModel: string
}
interface PartWise {
    partName: string
    totalInspected: number
    totalAccepted: number
    totalRework: number
    totalRejected: number
    reworkPercent: number
    rejectionPercent: number
    qualityRate: number
}
interface DayWise {
    date: string
    totalInspected: number
    totalAccepted: number
    totalRework: number
    totalRejected: number
    qualityRate: number
}
interface InspectorWise {
    inspectorName: string
    totalInspected: number
    totalAccepted: number
    totalRework: number
    totalRejected: number
    qualityRate: number
}
interface LocationWise {
    location: string
    totalInspected: number
    totalRework: number
    totalRejected: number
}
interface TopDefect {
    defectName: string
    count: number
    percentage: number
}
interface ReportData {
    summary: Summary
    partWise: PartWise[]
    dayWise: DayWise[]
    inspectorWise: InspectorWise[]
    locationWise: LocationWise[]
    topDefects: TopDefect[]
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
    const [value, setValue] = useState(0)
    const ref = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (target === 0) { setValue(0); return }
        let start = 0
        const step = Math.ceil(target / (duration / 30))
        if (ref.current) clearInterval(ref.current)
        ref.current = setInterval(() => {
            start += step
            if (start >= target) {
                setValue(target)
                if (ref.current) clearInterval(ref.current)
            } else {
                setValue(start)
            }
        }, 30)
        return () => { if (ref.current) clearInterval(ref.current) }
    }, [target, duration])

    return value
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, rate, color, subtitle, delay = 0 }: {
    label: string; value: number; rate: number; color: string; subtitle: string; delay?: number
}) {
    const animated = useCountUp(value)
    return (
        <div
            className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col gap-3 animate-fadeIn"
            style={{ animationDelay: `${delay}ms`, borderColor: BORDER }}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>{label}</p>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <p className="text-4xl font-extrabold tracking-tight" style={{ color: TEXT_DARK }}>
                {animated.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: TEXT_MUTED }}>{subtitle}</p>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
                />
            </div>
            <p className="text-sm font-bold" style={{ color }}>{rate.toFixed(2)}%</p>
        </div>
    )
}

// ─── PPM Box ──────────────────────────────────────────────────────────────────
function PpmBox({ label, value, color }: { label: string; value: number; color: string }) {
    const animated = useCountUp(value)
    return (
        <div className="flex-1 bg-white border rounded-2xl p-6 text-center shadow-sm" style={{ borderColor: BORDER }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: TEXT_MUTED }}>{label}</p>
            <p className="text-5xl font-black tabular-nums" style={{ color }}>{animated.toLocaleString()}</p>
            <p className="text-xs mt-2" style={{ color: TEXT_MUTED }}>parts per million</p>
        </div>
    )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border rounded-xl shadow-xl p-3 text-sm" style={{ borderColor: BORDER, minWidth: 160 }}>
            {label && <p className="font-bold mb-2" style={{ color: TEXT_DARK }}>{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                    <span style={{ color: TEXT_MUTED }}>{p.name}:</span>
                    <span className="font-bold" style={{ color: TEXT_DARK }}>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-2 rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-bold w-12 text-right" style={{ color }}>{value.toFixed(1)}%</span>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const { data: session } = useSession()
    const role = session?.user?.role

    const now = new Date()
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())
    const [selectedCompanyId, setSelectedCompanyId] = useState("all")
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(false)
    const [partTab, setPartTab] = useState<"table" | "visual">("table")
    const [generated, setGenerated] = useState(false)

    // Fetch companies for admin/manager dropdown
    useEffect(() => {
        if (role === "ADMIN" || role === "MANAGER") {
            fetch("/api/companies")
                .then(r => r.json())
                .then(d => setCompanies(Array.isArray(d) ? d : []))
                .catch(() => { })
        }
    }, [role])

    const fetchReport = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                month: String(selectedMonth),
                year: String(selectedYear),
            })
            if (selectedCompanyId !== "all") params.set("companyId", selectedCompanyId)
            const res = await fetch(`/api/reports?${params.toString()}`)
            const d = await res.json()
            setData(d)
            setGenerated(true)
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }, [selectedMonth, selectedYear, selectedCompanyId])

    // Auto-fetch on mount
    useEffect(() => {
        fetchReport()
    }, [])

    const handlePrint = () => window.print()

    const s = data?.summary
    const pieData = s ? [
        { name: "Accepted", value: s.totalAccepted, color: GREEN },
        { name: "Rework", value: s.totalRework, color: AMBER },
        { name: "Rejected", value: s.totalRejected, color: RED },
    ] : []

    // Pareto: cumulative %
    const paretoData = (data?.topDefects || []).map((d, i, arr) => {
        const cumSum = arr.slice(0, i + 1).reduce((a, b) => a + b.count, 0)
        const totalD = arr.reduce((a, b) => a + b.count, 0)
        return { ...d, cumulative: totalD > 0 ? parseFloat(((cumSum / totalD) * 100).toFixed(1)) : 0 }
    })

    // Day-wise: format date label
    const dayWiseData = (data?.dayWise || []).map(d => ({
        ...d,
        label: (() => { try { return format(parseISO(d.date), "dd MMM") } catch { return d.date } })(),
    }))

    return (
        <>
            {/* Print Styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease both; }
                @media print {
                    .no-print { display: none !important; }
                    .print-break { page-break-before: always; }
                    .print-avoid { page-break-inside: avoid; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .recharts-wrapper { page-break-inside: avoid; }
                }
            `}</style>

            <div className="space-y-8 pb-16" style={{ background: GRAY_BG }}>

                {/* ── SECTION 1: FILTER BAR ──────────────────────────────── */}
                <div className="no-print sticky top-0 z-30 bg-white border-b shadow-sm px-0 -mx-4 lg:-mx-8 -mt-4 lg:-mt-8">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex flex-wrap gap-3 items-center">
                            {(role === "ADMIN" || role === "MANAGER") && (
                                <select
                                    className="h-10 rounded-lg border px-3 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    style={{ borderColor: BORDER }}
                                    value={selectedCompanyId}
                                    onChange={e => setSelectedCompanyId(e.target.value)}
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}
                            <select
                                className="h-10 rounded-lg border px-3 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ borderColor: BORDER }}
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(Number(e.target.value))}
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                className="h-10 rounded-lg border px-3 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ borderColor: BORDER }}
                                value={selectedYear}
                                onChange={e => setSelectedYear(Number(e.target.value))}
                            >
                                {[2024, 2025, 2026].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={fetchReport}
                                disabled={loading}
                                className="h-10 px-5 rounded-lg text-sm font-bold text-white shadow transition active:scale-95 disabled:opacity-60"
                                style={{ background: BLUE }}
                            >
                                {loading ? "Loading..." : "Generate Report"}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="h-10 px-4 rounded-lg border text-sm font-semibold transition hover:bg-gray-50 download-btn"
                                style={{ borderColor: BORDER, color: TEXT_DARK }}
                            >
                                🖨 Print / PDF
                            </button>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: BLUE, borderTopColor: "transparent" }} />
                        <p className="text-sm font-medium" style={{ color: TEXT_MUTED }}>Generating report…</p>
                    </div>
                )}

                {!loading && !data && generated && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border" style={{ borderColor: BORDER }}>
                        <div className="text-5xl">⚠️</div>
                        <p className="text-lg font-bold" style={{ color: TEXT_DARK }}>Failed to load report data</p>
                        <p className="text-sm text-center max-w-md px-6" style={{ color: TEXT_MUTED }}>
                            There was an error fetching the report database records. Please verify your connection and try again.
                        </p>
                        <button
                            onClick={fetchReport}
                            className="mt-4 px-6 py-2 rounded-lg text-sm font-bold text-white shadow"
                            style={{ background: BLUE }}
                        >
                            Retry Fetch
                        </button>
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* ── SECTION 2: REPORT HEADER CARD ─────────────────── */}
                        <div className="rounded-2xl overflow-hidden shadow-lg print-avoid" style={{ background: NAVY }}>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8">
                                <div className="space-y-2">
                                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
                                        style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                                        CIMS Quality Report
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{s?.companyName || "Unknown Company"}</h1>
                                    <p className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>Final Inspection Summary Report</p>
                                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                                        Period: {s?.period || "N/A"} &nbsp;·&nbsp; Part Model: {s?.partModel || "N/A"}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                    {[
                                        { label: "Period", value: s?.period || "N/A" },
                                        { label: "Total Inspected", value: (s?.totalInspected || 0).toLocaleString() },
                                        { label: "Locations", value: (data.locationWise?.length || 0).toString() },
                                        { label: "Inspectors", value: (data.inspectorWise?.length || 0).toString() },
                                    ].map(m => (
                                        <div key={m.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{m.label}</p>
                                            <p className="text-xl font-black text-white">{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── SECTION 3: KPI CARDS ──────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print-avoid">
                            <KpiCard label="Total Inspected" value={s?.totalInspected || 0} rate={100} color={BLUE} subtitle="Units across all parts" delay={0} />
                            <KpiCard label="Total Accepted" value={s?.totalAccepted || 0} rate={s?.acceptanceRate || 0} color={GREEN} subtitle="Acceptance rate" delay={100} />
                            <KpiCard label="Total Rework" value={s?.totalRework || 0} rate={s?.reworkRate || 0} color={AMBER} subtitle="Rework rate" delay={200} />
                            <KpiCard label="Total Rejected" value={s?.totalRejected || 0} rate={s?.rejectionRate || 0} color={RED} subtitle="Rejection rate" delay={300} />
                        </div>

                        {/* ── SECTION 4: PPM METRICS ────────────────────────── */}
                        <div className="flex flex-col md:flex-row gap-4 print-avoid">
                            <PpmBox label="Rework PPM" value={s?.reworkPPM || 0} color={AMBER} />
                            <PpmBox label="Rejection PPM" value={s?.rejectionPPM || 0} color={RED} />
                            <PpmBox label="Overall PPM" value={s?.overallPPM || 0} color={TEXT_DARK} />
                        </div>

                        {/* ── SECTION 5: CHARTS ROW 1 ───────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break print-avoid">

                            {/* Pie Chart */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: BORDER }}>
                                <h3 className="text-base font-bold mb-4" style={{ color: TEXT_DARK }}>Overall Quality Split</h3>
                                {(s?.totalInspected || 0) > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={70}
                                                outerRadius={110}
                                                paddingAngle={3}
                                                dataKey="value"
                                                animationBegin={0}
                                                animationDuration={1000}
                                                label={(props: any) => `${((props.percent ?? 0) * 100).toFixed(1)}%`}
                                                labelLine={false}
                                            >
                                                {pieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState />
                                )}
                                <div className="text-center mt-2">
                                    <p className="text-4xl font-black" style={{ color: GREEN }}>{(s?.acceptanceRate || 0).toFixed(1)}%</p>
                                    <p className="text-xs" style={{ color: TEXT_MUTED }}>Overall Acceptance Rate</p>
                                </div>
                            </div>

                            {/* Day-Wise Trend */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: BORDER }}>
                                <h3 className="text-base font-bold mb-4" style={{ color: TEXT_DARK }}>Day-Wise Inspection Trend</h3>
                                {dayWiseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <ComposedChart data={dayWiseData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
                                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                            <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="totalInspected" name="Inspected" fill={BLUE} opacity={0.7} animationBegin={0} animationDuration={1000} />
                                            <Bar yAxisId="left" dataKey="totalRework" name="Rework" fill={AMBER} animationBegin={0} animationDuration={1000} />
                                            <Bar yAxisId="left" dataKey="totalRejected" name="Rejected" fill={RED} animationBegin={0} animationDuration={1000} />
                                            <Line yAxisId="right" type="monotone" dataKey="qualityRate" name="Quality Rate %" stroke={GREEN} strokeWidth={2.5} dot={{ r: 4, fill: GREEN }} animationBegin={0} animationDuration={1200} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        </div>

                        {/* ── SECTION 6: CHARTS ROW 2 ───────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-avoid">

                            {/* Part-Wise Horizontal Bar */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: BORDER }}>
                                <h3 className="text-base font-bold mb-4" style={{ color: TEXT_DARK }}>Part-Wise Inspection Breakdown</h3>
                                {data.partWise.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={Math.max(280, data.partWise.length * 52)}>
                                        <BarChart data={data.partWise} layout="vertical" margin={{ left: 10, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11 }} />
                                            <YAxis dataKey="partName" type="category" width={110} tick={{ fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="totalAccepted" name="Accepted" stackId="a" fill={GREEN} animationBegin={0} animationDuration={1000} />
                                            <Bar dataKey="totalRework" name="Rework" stackId="a" fill={AMBER} animationBegin={0} animationDuration={1000} />
                                            <Bar dataKey="totalRejected" name="Rejected" stackId="a" fill={RED} animationBegin={0} animationDuration={1000} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>

                            {/* Inspector-Wise Bar */}
                            <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: BORDER }}>
                                <h3 className="text-base font-bold mb-4" style={{ color: TEXT_DARK }}>Inspector-Wise Performance</h3>
                                {data.inspectorWise.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={data.inspectorWise} margin={{ top: 5, right: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="inspectorName" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="totalInspected" name="Inspected" fill={BLUE} opacity={0.8} animationBegin={0} animationDuration={1000} />
                                            <Bar dataKey="totalRework" name="Rework" fill={AMBER} animationBegin={0} animationDuration={1000} />
                                            <Bar dataKey="totalRejected" name="Rejected" fill={RED} animationBegin={0} animationDuration={1000} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        </div>

                        {/* ── SECTION 7: PART-WISE TABLE ─────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden print-break print-avoid" style={{ borderColor: BORDER }}>
                            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: TEXT_DARK }}>Part-Wise Analysis</h3>
                                    <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>Detailed breakdown per component</p>
                                </div>
                                <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: BORDER }}>
                                    {(["table", "visual"] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setPartTab(tab)}
                                            className="px-4 py-2 text-sm font-semibold capitalize transition"
                                            style={{
                                                background: partTab === tab ? NAVY : "white",
                                                color: partTab === tab ? "white" : TEXT_MUTED,
                                            }}
                                        >{tab} View</button>
                                    ))}
                                </div>
                            </div>

                            {partTab === "table" ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ background: GRAY_BG }}>
                                                {["#", "Part Name", "Inspected", "Accepted", "Rework", "Rejected", "Rework %", "Rejection %", "Quality Rate"].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.partWise.map((p, i) => (
                                                <tr key={p.partName} className="border-t" style={{ background: i % 2 === 0 ? "white" : GRAY_BG, borderColor: BORDER }}>
                                                    <td className="px-4 py-3 text-xs font-bold" style={{ color: TEXT_MUTED }}>{i + 1}</td>
                                                    <td className="px-4 py-3 font-semibold" style={{ color: TEXT_DARK }}>{p.partName}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: BLUE }}>{p.totalInspected.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{p.totalAccepted.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: AMBER }}>{p.totalRework.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: RED }}>{p.totalRejected.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: AMBER }}>{p.reworkPercent.toFixed(2)}%</td>
                                                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: RED }}>{p.rejectionPercent.toFixed(2)}%</td>
                                                    <td className="px-4 py-3 w-40">
                                                        <ProgressBar value={p.qualityRate} color={p.qualityRate >= 99 ? GREEN : p.qualityRate >= 97 ? AMBER : RED} />
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Grand Total */}
                                            <tr className="border-t-2 font-black" style={{ background: NAVY, borderColor: NAVY }}>
                                                <td className="px-4 py-3 text-white" colSpan={2}>Grand Total</td>
                                                <td className="px-4 py-3 text-white">{(s?.totalInspected || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-green-300">{(s?.totalAccepted || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-amber-300">{(s?.totalRework || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-red-300">{(s?.totalRejected || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-amber-300">{(s?.reworkRate || 0).toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-red-300">{(s?.rejectionRate || 0).toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-green-300">{(s?.acceptanceRate || 0).toFixed(1)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 space-y-4">
                                    {data.partWise.map(p => {
                                        const total = p.totalInspected || 1
                                        return (
                                            <div key={p.partName} className="flex items-center gap-4">
                                                <div className="w-36 text-xs font-semibold truncate" style={{ color: TEXT_DARK }}>{p.partName}</div>
                                                <div className="flex-1 h-7 rounded-lg overflow-hidden flex">
                                                    <div style={{ width: `${(p.totalAccepted / total) * 100}%`, background: GREEN }} title={`Accepted: ${p.totalAccepted}`} />
                                                    <div style={{ width: `${(p.totalRework / total) * 100}%`, background: AMBER }} title={`Rework: ${p.totalRework}`} />
                                                    <div style={{ width: `${(p.totalRejected / total) * 100}%`, background: RED }} title={`Rejected: ${p.totalRejected}`} />
                                                </div>
                                                <div className="w-14 text-right text-xs font-bold" style={{ color: p.qualityRate >= 99 ? GREEN : p.qualityRate >= 97 ? AMBER : RED }}>
                                                    {p.qualityRate.toFixed(1)}%
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── SECTION 8: DAY-WISE TABLE ─────────────────────── */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden print-avoid" style={{ borderColor: BORDER }}>
                            <div className="p-6 border-b" style={{ borderColor: BORDER }}>
                                <h3 className="text-lg font-bold" style={{ color: TEXT_DARK }}>Day-Wise Inspection Log</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ background: GRAY_BG }}>
                                            {["Date", "Inspected", "Accepted", "Rework", "Rejected", "Quality Rate"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.dayWise.map((d, i) => {
                                            const bg = d.totalRejected > 20
                                                ? "#fef2f2"
                                                : d.totalRejected === 0
                                                    ? "#f0fdf4"
                                                    : i % 2 === 0 ? "white" : GRAY_BG
                                            let formattedDate = d.date
                                            try { formattedDate = format(parseISO(d.date), "dd MMM yyyy, EEE") } catch { }
                                            return (
                                                <tr key={d.date} className="border-t" style={{ background: bg, borderColor: BORDER }}>
                                                    <td className="px-4 py-3 font-semibold" style={{ color: TEXT_DARK }}>{formattedDate}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: BLUE }}>{d.totalInspected.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{d.totalAccepted.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: AMBER }}>{d.totalRework.toLocaleString()}</td>
                                                    <td className="px-4 py-3 font-bold" style={{ color: RED }}>{d.totalRejected.toLocaleString()}</td>
                                                    <td className="px-4 py-3 w-36">
                                                        <ProgressBar value={d.qualityRate} color={d.qualityRate >= 99 ? GREEN : d.qualityRate >= 97 ? AMBER : RED} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {/* Grand Total */}
                                        <tr className="border-t-2 font-black" style={{ background: NAVY, borderColor: NAVY }}>
                                            <td className="px-4 py-3 text-white">Grand Total</td>
                                            <td className="px-4 py-3 text-white">{(s?.totalInspected || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-green-300">{(s?.totalAccepted || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-amber-300">{(s?.totalRework || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-red-300">{(s?.totalRejected || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-green-300">{(s?.acceptanceRate || 0).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── SECTION 9: INSPECTOR CARDS ─────────────────────── */}
                        <div className="space-y-4 print-break print-avoid">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold" style={{ color: TEXT_DARK }}>Inspector-Wise Performance</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {data.inspectorWise.map(ins => {
                                    const qColor = ins.qualityRate >= 99 ? GREEN : ins.qualityRate >= 97 ? AMBER : RED
                                    return (
                                        <div key={ins.inspectorName} className="bg-white rounded-2xl border shadow-sm p-6 space-y-4" style={{ borderColor: BORDER }}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-base font-black" style={{ color: TEXT_DARK }}>{ins.inspectorName}</p>
                                                    <p className="text-xs" style={{ color: TEXT_MUTED }}>Inspector</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black" style={{ color: qColor }}>{ins.qualityRate.toFixed(1)}%</p>
                                                    <p className="text-xs" style={{ color: TEXT_MUTED }}>Quality Rate</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { label: "Inspected", value: ins.totalInspected, color: BLUE },
                                                    { label: "Accepted", value: ins.totalAccepted, color: GREEN },
                                                    { label: "Rework", value: ins.totalRework, color: AMBER },
                                                    { label: "Rejected", value: ins.totalRejected, color: RED },
                                                ].map(stat => (
                                                    <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: GRAY_BG }}>
                                                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: stat.color }}>{stat.label}</p>
                                                        <p className="text-xl font-black" style={{ color: TEXT_DARK }}>{stat.value.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <ProgressBar value={ins.qualityRate} color={qColor} />
                                        </div>
                                    )
                                })}
                                {data.inspectorWise.length === 0 && (
                                    <p className="text-sm col-span-3 text-center py-8" style={{ color: TEXT_MUTED }}>No inspector data for this period.</p>
                                )}
                            </div>
                        </div>

                        {/* ── SECTION 10: PARETO CHART ────────────────────────── */}
                        {data.topDefects.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border p-6 print-break print-avoid" style={{ borderColor: BORDER }}>
                                <h3 className="text-base font-bold" style={{ color: TEXT_DARK }}>Top Defect Analysis (Pareto)</h3>
                                <p className="text-sm mb-4" style={{ color: TEXT_MUTED }}>Most frequent quality issues</p>
                                <ResponsiveContainer width="100%" height={340}>
                                    <ComposedChart data={paretoData} margin={{ top: 10, right: 40, left: 0, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="defectName" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="count" name="Count" fill={RED} animationBegin={0} animationDuration={1000} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative %" stroke={AMBER} strokeWidth={2.5} dot={{ r: 4, fill: AMBER }} animationBegin={0} animationDuration={1200} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                                <p className="text-xs text-center mt-2" style={{ color: TEXT_MUTED }}>
                                    Dashed line at 80% threshold indicates the Pareto 80-20 rule
                                </p>
                            </div>
                        )}

                        {/* ── SECTION 11: FOOTER ───────────────────────────────── */}
                        <div className="rounded-2xl overflow-hidden print-avoid" style={{ background: NAVY }}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-6 text-sm">
                                <div>
                                    <p className="font-bold text-white">{s?.companyName}</p>
                                    <p style={{ color: "rgba(255,255,255,0.6)" }}>{s?.period}</p>
                                </div>
                                <p className="font-semibold text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    Confidential — Internal Use Only
                                </p>
                                <div className="text-right">
                                    <p className="font-bold text-white">Generated: {format(new Date(), "dd MMM yyyy, HH:mm")}</p>
                                    <p style={{ color: "rgba(255,255,255,0.6)" }}>CIMS Inspection Management System</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!loading && !data && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border" style={{ borderColor: BORDER }}>
                        <div className="text-5xl">📊</div>
                        <p className="text-lg font-bold" style={{ color: TEXT_DARK }}>Select filters and click &quot;Generate Report&quot;</p>
                        <p className="text-sm" style={{ color: TEXT_MUTED }}>Choose a company, month, and year to view the inspection summary.</p>
                    </div>
                )}
            </div>
        </>
    )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="text-4xl opacity-30">📭</div>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>No data for this period</p>
        </div>
    )
}
