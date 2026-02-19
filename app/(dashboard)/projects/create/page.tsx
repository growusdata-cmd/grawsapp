
"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Loader2 } from "lucide-react"

type Company = {
    id: string
    name: string
}

function CreateProjectForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialCompanyId = searchParams.get("companyId") || ""

    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState<Company[]>([])
    const [loadingCompanies, setLoadingCompanies] = useState(true)
    const [error, setError] = useState("")
    const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId)

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("/api/companies")
                const data = await res.json()
                setCompanies(data)
            } catch {
                setError("Failed to load companies")
            } finally {
                setLoadingCompanies(false)
            }
        }
        fetchCompanies()
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            companyId: selectedCompanyId,
        }

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) throw new Error("Failed to create project")

            router.push(selectedCompanyId ? `/companies/${selectedCompanyId}` : "/companies")
            router.refresh()
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={initialCompanyId ? `/companies/${initialCompanyId}` : "/companies"}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>Enter the information for the new project.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
                            <Input id="name" name="name" required placeholder="Project Alpha" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" name="description" placeholder="Brief description of the project..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyId">Company <span className="text-destructive">*</span></Label>
                            {loadingCompanies ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 px-3 rounded-md border">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading companies...
                                </div>
                            ) : (
                                <select
                                    id="companyId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={selectedCompanyId}
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a company...</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="ghost" asChild type="button">
                            <Link href={initialCompanyId ? `/companies/${initialCompanyId}` : "/companies"}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={loading || !selectedCompanyId}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function CreateProjectPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <CreateProjectForm />
        </Suspense>
    )
}
