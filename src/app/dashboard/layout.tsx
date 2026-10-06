
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ScheduledEmailRunner } from "@/components/scheduled-email-runner"
import { db } from "@/db"
import { campaigns, scheduledEmails } from "@/db/schema"
import { and, count, eq } from "drizzle-orm"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/api/auth/signin")
    }

    const scheduledWhere = session.user.role === "admin"
        ? eq(scheduledEmails.status, "scheduled")
        : and(eq(scheduledEmails.status, "scheduled"), eq(scheduledEmails.userId, session.user.id))
    const [scheduledCountRow] = await db
        .select({ count: count() })
        .from(scheduledEmails)
        .where(scheduledWhere)
    const [campaignCountRow] = await db
        .select({ count: count() })
        .from(campaigns)
        .where(session.user.role === "admin"
            ? eq(campaigns.status, "scheduled")
            : and(eq(campaigns.status, "scheduled"), eq(campaigns.ownerId, session.user.id)))
    const scheduledCount = Number(scheduledCountRow?.count || 0) + Number(campaignCountRow?.count || 0)

    return (
        <SidebarProvider>
            <AppSidebar scheduledCount={scheduledCount} />
            <ScheduledEmailRunner hasActiveScheduledEmails={scheduledCount > 0} />
            <main className="w-full">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
