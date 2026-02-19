
"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html>
            <body>
                <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", fontFamily: "system-ui, sans-serif" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Something went wrong!</h2>
                        <p style={{ color: "#666", fontSize: "0.875rem" }}>{error.message}</p>
                    </div>
                    <button
                        onClick={() => reset()}
                        style={{ padding: "8px 16px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
