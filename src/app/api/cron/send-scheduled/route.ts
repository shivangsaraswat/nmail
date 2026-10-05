import { auth } from "@/auth"
import { db } from "@/db"
import { scheduledEmails } from "@/db/schema"
import { emailService } from "@/lib/email"
import { and, eq, lte } from "drizzle-orm"

async function processScheduledEmails(userId?: string) {
    const filters = [
        eq(scheduledEmails.status, "scheduled"),
        lte(scheduledEmails.scheduledFor, new Date()),
    ]
    if (userId) filters.push(eq(scheduledEmails.userId, userId))

    const dueMessages = await db.query.scheduledEmails.findMany({
        where: and(...filters),
        limit: 50,
    })

    let sent = 0
    let failed = 0

    for (const message of dueMessages) {
        const [claimedMessage] = await db.update(scheduledEmails)
            .set({ status: "processing" })
            .where(and(
                eq(scheduledEmails.id, message.id),
                eq(scheduledEmails.status, "scheduled"),
            ))
            .returning({ id: scheduledEmails.id })

        if (!claimedMessage) continue

        try {
            const result = await emailService.sendEmail({
                userId: message.userId,
                senderIdentityId: message.senderIdentityId,
                recipients: message.recipients as string[],
                cc: message.ccRecipients as string[],
                bcc: message.bccRecipients as string[],
                subject: message.subject,
                html: message.htmlContent,
                isAdmin: true,
            })

            if (!result.success) throw new Error(result.error || "Scheduled email failed")

            await db.update(scheduledEmails)
                .set({ status: "sent" })
                .where(eq(scheduledEmails.id, message.id))
            sent += 1
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Scheduled email failed"
            await db.update(scheduledEmails)
                .set({ status: "failed", errorMessage })
                .where(eq(scheduledEmails.id, message.id))
            failed += 1
        }
    }

    return { processed: dueMessages.length, sent, failed }
}

async function isAuthorized(request: Request) {
    const cronSecret = process.env.CRON_SECRET
    const authorization = request.headers.get("authorization")
    const session = await auth()
    const hasCronAccess = Boolean(cronSecret && authorization === `Bearer ${cronSecret}`)

    if (!hasCronAccess && !session?.user?.id) {
        return { authorized: false, userId: undefined }
    }

    return {
        authorized: true,
        userId: hasCronAccess || session?.user?.role === "admin" ? undefined : session?.user?.id,
    }
}

export async function POST(request: Request) {
    const access = await isAuthorized(request)
    if (!access.authorized) return Response.json({ error: "Unauthorized" }, { status: 401 })

    return Response.json(await processScheduledEmails(access.userId))
}

export async function GET(request: Request) {
    return POST(request)
}