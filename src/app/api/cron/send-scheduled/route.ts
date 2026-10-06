import { auth } from "@/auth"
import { db } from "@/db"
import { campaignActivities, campaignRows, campaigns, scheduledEmails } from "@/db/schema"
import { emailService } from "@/lib/email"
import { campaignRecipient, renderCampaignTemplate, validateCampaign } from "@/lib/campaign"
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

    const scheduledCampaigns = await db.query.campaigns.findMany({
        where: userId
            ? and(eq(campaigns.status, "scheduled"), eq(campaigns.ownerId, userId), lte(campaigns.scheduledAt, new Date()))
            : and(eq(campaigns.status, "scheduled"), lte(campaigns.scheduledAt, new Date())),
        with: { owner: true, columns: { orderBy: (table, { asc }) => [asc(table.position)] }, rows: true, senderIdentity: true },
        limit: 10,
    })
    let campaignsSent = 0
    let campaignsFailed = 0
    for (const campaign of scheduledCampaigns) {
        const [claimed] = await db.update(campaigns)
            .set({ status: "sending", updatedAt: new Date() })
            .where(and(eq(campaigns.id, campaign.id), eq(campaigns.status, "scheduled")))
            .returning({ id: campaigns.id })
        if (!claimed || !campaign.senderIdentityId || !campaign.senderIdentity) continue
        const validation = validateCampaign({
            rows: campaign.rows,
            columns: campaign.columns,
            subject: campaign.subjectTemplate,
            html: campaign.htmlTemplate,
        })
        if (!validation.valid) {
            await db.update(campaigns).set({ status: "failed", updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
            campaignsFailed++
            continue
        }
        let rowFailures = 0
        for (const row of campaign.rows) {
            try {
                const result = await emailService.sendEmail({
                    userId: campaign.ownerId,
                    senderIdentityId: campaign.senderIdentityId,
                    recipients: [campaignRecipient(row.data, campaign.columns)],
                    subject: renderCampaignTemplate(campaign.subjectTemplate, row.data),
                    html: renderCampaignTemplate(campaign.htmlTemplate, row.data),
                    isAdmin: campaign.owner.role === "admin",
                })
                if (!result.success) throw new Error(result.error || "Delivery failed")
                await db.update(campaignRows).set({ status: "sent", sentAt: new Date(), messageId: result.messageId }).where(eq(campaignRows.id, row.id))
                await db.insert(campaignActivities).values({ campaignId: campaign.id, campaignRowId: row.id, userId: campaign.ownerId, recipient: campaignRecipient(row.data, campaign.columns), sender: campaign.senderIdentity.emailAddress, status: "sent", providerMessageId: result.messageId })
            } catch (error) {
                rowFailures++
                const message = error instanceof Error ? error.message : "Delivery failed"
                await db.update(campaignRows).set({ status: "failed", error: message }).where(eq(campaignRows.id, row.id))
                await db.insert(campaignActivities).values({ campaignId: campaign.id, campaignRowId: row.id, userId: campaign.ownerId, recipient: campaignRecipient(row.data, campaign.columns), sender: campaign.senderIdentity.emailAddress, status: "failed", error: message })
            }
        }
        await db.update(campaigns).set({ status: rowFailures ? (rowFailures === campaign.rows.length ? "failed" : "partially_failed") : "completed", updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
        if (rowFailures) campaignsFailed++
        else campaignsSent++
    }

    return { processed: dueMessages.length, sent, failed, campaignsProcessed: scheduledCampaigns.length, campaignsSent, campaignsFailed }
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