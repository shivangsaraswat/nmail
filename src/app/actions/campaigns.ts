"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { campaignActivities, campaignColumns, campaignRows, campaigns, senderIdentities, userSenderPermissions } from "@/db/schema"
import { emailService } from "@/lib/email"
import { campaignRecipient, renderCampaignTemplate, validateCampaign as validateCampaignData, variableKey, CAMPAIGN_LIMIT } from "@/lib/campaign"
import { and, asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const idSchema = z.string().uuid()

async function sessionOrThrow() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    return session
}

async function canUseSender(userId: string, senderId: string, admin: boolean) {
    if (admin) {
        return Boolean(await db.query.senderIdentities.findFirst({
            where: and(eq(senderIdentities.id, senderId), eq(senderIdentities.isActive, true)),
        }))
    }
    const permission = await db.query.userSenderPermissions.findFirst({
        where: and(eq(userSenderPermissions.userId, userId), eq(userSenderPermissions.senderIdentityId, senderId)),
        with: { senderIdentity: true },
    })
    return Boolean(permission?.senderIdentity?.isActive)
}

async function getOwnedCampaign(id: string, userId: string) {
    const campaign = await db.query.campaigns.findFirst({
        where: and(eq(campaigns.id, id), eq(campaigns.ownerId, userId)),
        with: {
            columns: { orderBy: [asc(campaignColumns.position)] },
            rows: true,
            senderIdentity: true,
        },
    })
    if (!campaign) throw new Error("Campaign not found")
    return campaign
}

export async function listCampaigns() {
    const session = await sessionOrThrow()
    return db.query.campaigns.findMany({
        where: eq(campaigns.ownerId, session.user.id),
        with: { rows: true },
        orderBy: (table, { desc }) => [desc(table.updatedAt)],
    })
}

export async function createCampaign(name: string, description?: string) {
    const session = await sessionOrThrow()
    const parsed = z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(500).optional() }).parse({ name, description })
    const [campaign] = await db.insert(campaigns).values({
        ownerId: session.user.id,
        name: parsed.name,
        description: parsed.description || null,
    }).returning({ id: campaigns.id })
    await db.insert(campaignColumns).values([
        { campaignId: campaign.id, displayName: "Email", variableKey: "email", position: 0, required: true },
        { campaignId: campaign.id, displayName: "First Name", variableKey: "first_name", position: 1 },
    ])
    revalidatePath("/dashboard/campaigns")
    return campaign
}

export async function getCampaign(id: string) {
    const session = await sessionOrThrow()
    return getOwnedCampaign(idSchema.parse(id), session.user.id)
}

export async function updateCampaign(id: string, input: {
    name?: string
    description?: string
    senderIdentityId?: string | null
    subjectTemplate?: string
    htmlTemplate?: string
    scheduledAt?: Date | null
    status?: string
}) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    if (input.senderIdentityId && !await canUseSender(session.user.id, input.senderIdentityId, session.user.role === "admin")) {
        throw new Error("You do not have permission to use this sender identity")
    }
    await db.update(campaigns).set({
        ...input,
        updatedAt: new Date(),
    }).where(eq(campaigns.id, campaign.id))
    revalidatePath(`/dashboard/campaigns/${campaign.id}`)
    revalidatePath("/dashboard/campaigns")
    return { success: true }
}

export async function replaceCampaignData(id: string, input: {
    columns: { displayName: string; variableKey: string; position: number; required?: boolean }[]
    rows: { id?: string; data: Record<string, string> }[]
}) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    if (input.rows.length > CAMPAIGN_LIMIT) throw new Error(`A campaign can contain a maximum of ${CAMPAIGN_LIMIT} recipients.`)
    const used = new Set<string>()
    const columns = input.columns.map((column, position) => {
        const key = variableKey(column.displayName, used)
        used.add(key)
        return { campaignId: campaign.id, displayName: column.displayName.trim() || `Column ${position + 1}`, variableKey: key, position, required: Boolean(column.required) }
    })
    const normalizedRows = input.rows.map(row => ({
        campaignId: campaign.id,
        data: Object.fromEntries(columns.map(column => [column.variableKey, String(row.data[column.variableKey] ?? row.data[column.displayName] ?? "")])),
    }))
    // Neon HTTP does not support interactive transactions. Keep the statements
    // ordered so foreign-key cleanup happens before replacing the campaign data.
    await db.delete(campaignColumns).where(eq(campaignColumns.campaignId, campaign.id))
    await db.delete(campaignRows).where(eq(campaignRows.campaignId, campaign.id))
    if (columns.length) await db.insert(campaignColumns).values(columns)
    if (normalizedRows.length) await db.insert(campaignRows).values(normalizedRows)
    await db.update(campaigns).set({ updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
    revalidatePath(`/dashboard/campaigns/${campaign.id}`)
    return { success: true }
}

export async function sendTestCampaign(id: string, rowId: string) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    if (!campaign.senderIdentityId || !campaign.senderIdentity) throw new Error("Choose a sender identity first.")
    const row = campaign.rows.find(item => item.id === idSchema.parse(rowId))
    if (!row) throw new Error("Recipient not found")
    const result = await emailService.sendEmail({
        userId: session.user.id,
        senderIdentityId: campaign.senderIdentityId,
        recipients: [session.user.email || ""],
        subject: renderCampaignTemplate(campaign.subjectTemplate, row.data),
        html: renderCampaignTemplate(campaign.htmlTemplate, row.data),
        isAdmin: session.user.role === "admin",
    })
    if (!result.success) throw new Error(result.error || "Test email failed")
    return { success: true }
}

export async function validateCampaign(id: string) {
    const campaign = await (async () => {
        const session = await sessionOrThrow()
        return getOwnedCampaign(idSchema.parse(id), session.user.id)
    })()
    return validateCampaignData({
        rows: campaign.rows,
        columns: campaign.columns,
        subject: campaign.subjectTemplate,
        html: campaign.htmlTemplate,
    })
}

export async function sendCampaign(id: string) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    if (!campaign.senderIdentityId || !campaign.senderIdentity) throw new Error("Choose a sender identity first.")
    const validation = validateCampaignData({
        rows: campaign.rows,
        columns: campaign.columns,
        subject: campaign.subjectTemplate,
        html: campaign.htmlTemplate,
    })
    if (!validation.valid) throw new Error(validation.errors.join(" "))
    await db.update(campaigns).set({ status: "sending", updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
    let failed = 0
    for (const row of campaign.rows) {
        const recipient = campaignRecipient(row.data, campaign.columns)
        await db.update(campaignRows).set({ status: "sending", error: null }).where(eq(campaignRows.id, row.id))
        try {
            const result = await emailService.sendEmail({
                userId: session.user.id,
                senderIdentityId: campaign.senderIdentityId,
                recipients: [recipient],
                subject: renderCampaignTemplate(campaign.subjectTemplate, row.data),
                html: renderCampaignTemplate(campaign.htmlTemplate, row.data),
                isAdmin: session.user.role === "admin",
            })
            if (!result.success) throw new Error(result.error || "Delivery failed")
            await db.update(campaignRows).set({ status: "sent", sentAt: new Date(), messageId: result.messageId }).where(eq(campaignRows.id, row.id))
            await db.insert(campaignActivities).values({ campaignId: campaign.id, campaignRowId: row.id, userId: session.user.id, recipient, sender: campaign.senderIdentity.emailAddress, status: "sent", providerMessageId: result.messageId })
        } catch (error) {
            failed++
            const message = error instanceof Error ? error.message : "Delivery failed"
            await db.update(campaignRows).set({ status: "failed", error: message }).where(eq(campaignRows.id, row.id))
            await db.insert(campaignActivities).values({ campaignId: campaign.id, campaignRowId: row.id, userId: session.user.id, recipient, sender: campaign.senderIdentity.emailAddress, status: "failed", error: message })
        }
    }
    await db.update(campaigns).set({ status: failed ? (failed === campaign.rows.length ? "failed" : "partially_failed") : "completed", updatedAt: new Date() }).where(eq(campaigns.id, campaign.id))
    revalidatePath(`/dashboard/campaigns/${campaign.id}`)
    revalidatePath("/dashboard/campaigns")
    return { success: true, failed }
}

export async function deleteCampaign(id: string) {
    const session = await sessionOrThrow()
    await db.delete(campaigns).where(and(eq(campaigns.id, idSchema.parse(id)), eq(campaigns.ownerId, session.user.id)))
    revalidatePath("/dashboard/campaigns")
    return { success: true }
}

export async function cancelScheduledCampaign(id: string) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    if (campaign.status !== "scheduled") throw new Error("Campaign is no longer scheduled")
    await db.update(campaigns)
        .set({ status: "draft", scheduledAt: null, updatedAt: new Date() })
        .where(and(eq(campaigns.id, campaign.id), eq(campaigns.status, "scheduled")))
    revalidatePath("/dashboard/scheduled")
    revalidatePath(`/dashboard/campaigns/${campaign.id}`)
    revalidatePath("/dashboard/campaigns")
    return { success: true }
}

export async function scheduleCampaign(id: string, scheduledAt: string) {
    const session = await sessionOrThrow()
    const campaign = await getOwnedCampaign(idSchema.parse(id), session.user.id)
    const scheduledDate = new Date(scheduledAt)
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        throw new Error("Choose a future date and time.")
    }
    const validation = validateCampaignData({
        rows: campaign.rows,
        columns: campaign.columns,
        subject: campaign.subjectTemplate,
        html: campaign.htmlTemplate,
    })
    if (!validation.valid) throw new Error(validation.errors.join(" "))
    if (!campaign.senderIdentityId) throw new Error("Choose an authorized sender before scheduling.")

    await db.update(campaigns)
        .set({ status: "scheduled", scheduledAt: scheduledDate, updatedAt: new Date() })
        .where(and(eq(campaigns.id, campaign.id), eq(campaigns.ownerId, session.user.id)))
    revalidatePath("/dashboard/scheduled")
    revalidatePath(`/dashboard/campaigns/${campaign.id}`)
    revalidatePath("/dashboard/campaigns")
    return { success: true, scheduledAt: scheduledDate.toISOString() }
}
