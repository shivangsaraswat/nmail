"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ScheduledEmailRunner({ hasActiveScheduledEmails }: { hasActiveScheduledEmails: boolean }) {
    const router = useRouter()

    useEffect(() => {
        if (!hasActiveScheduledEmails) return

        const processDueEmails = async () => {
            const response = await fetch("/api/cron/send-scheduled", { method: "POST" })
            if (!response.ok) return

            const result = await response.json() as { processed?: number }
            if (result.processed && result.processed > 0) router.refresh()
        }

        processDueEmails()
        const interval = window.setInterval(processDueEmails, 30_000)
        return () => window.clearInterval(interval)
    }, [hasActiveScheduledEmails, router])

    return null
}