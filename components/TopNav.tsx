"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Menu, X, Building2, Folder, ClipboardCheck, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface SearchResults {
    companies: any[]
    projects: any[]
    inspections: any[]
}

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
    const { data: session } = useSession()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    const isAdminOrManager = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER"

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                    const data = await res.json()
                    setResults(data)
                    setIsOpen(true)
                } catch (error) {
                    console.error("Search fetch failed", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setResults(null)
                setIsOpen(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        setIsOpen(false)
        setQuery("")
    }, [pathname])

    if (!isAdminOrManager) {
        return (
            <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
                <button onClick={onMenuClick} className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <Menu className="h-6 w-6" />
                </button>
                <div className="font-bold text-xl tracking-tight text-primary">CIMS</div>
            </div>
        )
    }

    return (
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <button onClick={onMenuClick} className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden">
                <Menu className="h-6 w-6" />
            </button>

            <div className="relative flex-1 max-w-md" ref={dropdownRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search companies, projects, inspections..."
                        className="pl-10 h-10 border-none bg-muted/50 focus-visible:bg-background transition-colors"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>

                {isOpen && (results?.companies.length || results?.projects.length || results?.inspections.length) ? (
                    <div className="absolute top-full left-0 mt-1 w-full max-h-[400px] overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-xl z-50 p-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        {results.companies.length > 0 && (
                            <section>
                                <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Companies</h3>
                                {results.companies.map(c => (
                                    <Link key={c.id} href={`/companies/${c.id}`} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                                        <Building2 className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">{c.name}</span>
                                    </Link>
                                ))}
                            </section>
                        )}

                        {results.projects.length > 0 && (
                            <section>
                                <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Projects</h3>
                                {results.projects.map(p => (
                                    <Link key={p.id} href={`/companies/${p.companyId}`} className="flex flex-col gap-0.5 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Folder className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm font-medium">{p.name}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground ml-7">{p.companyName}</span>
                                    </Link>
                                ))}
                            </section>
                        )}

                        {results.inspections.length > 0 && (
                            <section>
                                <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Inspections</h3>
                                {results.inspections.map(i => (
                                    <Link key={i.id} href={`/approvals/${i.id}`} className="flex flex-col gap-0.5 px-3 py-2 rounded-md hover:bg-accent transition-colors">
                                        <div className="flex items-center gap-3">
                                            <ClipboardCheck className="h-4 w-4 text-green-500" />
                                            <span className="text-sm font-medium">{i.projectName}</span>
                                            <Badge variant="outline" className="ml-auto text-[10px] py-0">{i.status}</Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground ml-7">Inspector: {i.inspectorName}</span>
                                    </Link>
                                ))}
                            </section>
                        )}
                    </div>
                ) : isOpen && query.length >= 2 && !loading ? (
                    <div className="absolute top-full left-0 mt-1 w-full rounded-lg border bg-popover p-4 text-center shadow-lg z-50">
                        <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
                    </div>
                ) : null}
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* Space for future notifications or user profile if needed */}
            </div>
        </div>
    )
}
