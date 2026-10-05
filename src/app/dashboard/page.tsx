
import { auth } from "@/auth"
import { db } from "@/db"
import { emailLogs } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { SentMailView } from "@/components/sent-mail-view"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/api/auth/signin")
    }

    const logs = await db.query.emailLogs.findMany({
        where: session.user.role === "admin" ? undefined : eq(emailLogs.userId, session.user.id),
        orderBy: [desc(emailLogs.sentAt)],
        with: {
            senderIdentity: true,
            user: true,
        },
    })

    const messages = logs.map((log) => ({
        id: log.id,
        subject: log.subject,
        recipients: Array.isArray(log.recipients) ? log.recipients as string[] : [],
        htmlContent: log.htmlContent,
        sentAt: log.sentAt.toISOString(),
        deliveryStatus: log.deliveryStatus,
        errorMessage: log.errorMessage,
        senderName: log.senderIdentity.displayName,
        senderEmail: log.senderIdentity.emailAddress,
        sentBy: log.user.name || log.user.email,
        isAdminView: session.user.role === "admin",
    }))

    return (
        <SentMailView messages={messages} />
    )
}
