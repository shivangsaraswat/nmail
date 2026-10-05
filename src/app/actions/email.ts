
"use server"

import { auth } from "@/auth"
import { emailService } from "@/lib/email"
import { db } from "@/db"
import { emailDrafts, emailLogs, scheduledEmails, senderIdentities, userSenderPermissions } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const sendEmailSchema = z.object({
    senderIdentityId: z.string().uuid(),
    to: z.string().min(1),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().min(1),
    html: z.string().min(1),
})

const draftSchema = z.object({
    draftId: z.string().uuid().optional(),
    senderIdentityId: z.string().uuid(),
    to: z.string().optional().default(""),
    cc: z.string().optional().default(""),
    bcc: z.string().optional().default(""),
    subject: z.string().optional().default(""),
    html: z.string().optional().default(""),
})

const scheduleSchema = sendEmailSchema.extend({
    scheduledFor: z.string().min(1),
})

export type EmailState = {
    success: boolean
    message?: string
    error?: string
    draftId?: string
}

const splitEmails = (str?: string) =>
    str?.split(",").map(e => e.trim()).filter(e => e.length > 0) || []

async function hasSenderAccess(userId: string, senderIdentityId: string, isAdmin: boolean) {
    if (isAdmin) {
        const identity = await db.query.senderIdentities.findFirst({
            where: and(eq(senderIdentities.id, senderIdentityId), eq(senderIdentities.isActive, true)),
        })
        return Boolean(identity)
    }

    const permission = await db.query.userSenderPermissions.findFirst({
        where: and(
            eq(userSenderPermissions.userId, userId),
            eq(userSenderPermissions.senderIdentityId, senderIdentityId),
        ),
        with: { senderIdentity: true },
    })

    return Boolean(permission?.senderIdentity?.isActive)
}

export async function sendEmailAction(prevState: EmailState, formData: FormData): Promise<EmailState> {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    const rawData = {
        senderIdentityId: formData.get("senderIdentityId"),
        to: formData.get("to"),
        cc: formData.get("cc") || undefined,
        bcc: formData.get("bcc") || undefined,
        subject: formData.get("subject"),
        html: formData.get("html"),
    }

    const validated = sendEmailSchema.safeParse(rawData)

    if (!validated.success) {
        return { success: false, error: "Invalid form data" }
    }

    const { senderIdentityId, to, cc, bcc, subject, html } = validated.data

    const recipients = splitEmails(to)
    const ccRecipients = splitEmails(cc)
    const bccRecipients = splitEmails(bcc)

    if (recipients.length === 0) {
        return { success: false, error: "At least one recipient is required" }
    }

    // Extract attachments from FormData
    const attachmentFiles = formData.getAll("attachments") as File[]
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []

    for (const file of attachmentFiles) {
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer()
            attachments.push({
                filename: file.name,
                content: Buffer.from(arrayBuffer),
                contentType: file.type || 'application/octet-stream',
            })
        }
    }

    try {
        const result = await emailService.sendEmail({
            userId: session.user.id,
            senderIdentityId,
            recipients,
            cc: ccRecipients.length > 0 ? ccRecipients : undefined,
            bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
            subject,
            html,
            isAdmin: session.user.role === 'admin',
            attachments: attachments.length > 0 ? attachments : undefined,
        })

        if (!result.success) {
            return { success: false, error: result.error || "Failed to send email" }
        }

        return { success: true, message: "Email sent successfully" }

    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Internal server error" }
    }
}

export async function saveDraftAction(formData: FormData): Promise<EmailState> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const validated = draftSchema.safeParse({
        draftId: formData.get("draftId") || undefined,
        senderIdentityId: formData.get("senderIdentityId"),
        to: formData.get("to") || "",
        cc: formData.get("cc") || "",
        bcc: formData.get("bcc") || "",
        subject: formData.get("subject") || "",
        html: formData.get("html") || "",
    })

    if (!validated.success) return { success: false, error: "Choose a sender before saving the draft" }
    if (!await hasSenderAccess(session.user.id, validated.data.senderIdentityId, session.user.role === "admin")) {
        return { success: false, error: "You do not have permission to use this sender identity" }
    }

    const values = {
        userId: session.user.id,
        senderIdentityId: validated.data.senderIdentityId,
        recipients: splitEmails(validated.data.to),
        ccRecipients: splitEmails(validated.data.cc),
        bccRecipients: splitEmails(validated.data.bcc),
        subject: validated.data.subject,
        htmlContent: validated.data.html,
        updatedAt: new Date(),
    }

    let savedDraftId = validated.data.draftId
    if (validated.data.draftId) {
        await db.update(emailDrafts).set(values).where(and(
            eq(emailDrafts.id, validated.data.draftId),
            eq(emailDrafts.userId, session.user.id),
        ))
    } else {
        const [draft] = await db.insert(emailDrafts).values(values).returning({ id: emailDrafts.id })
        savedDraftId = draft.id
    }

    return { success: true, message: "Draft saved", draftId: savedDraftId }
}

export async function scheduleEmailAction(formData: FormData): Promise<EmailState> {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const validated = scheduleSchema.safeParse({
        senderIdentityId: formData.get("senderIdentityId"),
        to: formData.get("to"),
        cc: formData.get("cc") || undefined,
        bcc: formData.get("bcc") || undefined,
        subject: formData.get("subject"),
        html: formData.get("html"),
        scheduledFor: formData.get("scheduledFor"),
    })

    if (!validated.success) return { success: false, error: "Complete the email before scheduling it" }
    const scheduledFor = new Date(validated.data.scheduledFor)
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
        return { success: false, error: "Choose a future time for scheduled delivery" }
    }
    if (!await hasSenderAccess(session.user.id, validated.data.senderIdentityId, session.user.role === "admin")) {
        return { success: false, error: "You do not have permission to use this sender identity" }
    }

    const recipients = splitEmails(validated.data.to)
    if (recipients.length === 0) return { success: false, error: "At least one recipient is required" }

    await db.insert(scheduledEmails).values({
        userId: session.user.id,
        senderIdentityId: validated.data.senderIdentityId,
        recipients,
        ccRecipients: splitEmails(validated.data.cc),
        bccRecipients: splitEmails(validated.data.bcc),
        subject: validated.data.subject,
        htmlContent: validated.data.html,
        scheduledFor,
        status: "scheduled",
    })

    return { success: true, message: "Email scheduled" }
}

export async function deleteDraftAction(formData: FormData): Promise<EmailState> {
    const session = await auth()
    const draftId = z.string().uuid().safeParse(formData.get("draftId"))
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    if (!draftId.success) return { success: false, error: "Invalid draft" }

    await db.delete(emailDrafts).where(and(
        eq(emailDrafts.id, draftId.data),
        eq(emailDrafts.userId, session.user.id),
    ))
    revalidatePath("/dashboard/drafts")
    return { success: true, message: "Draft deleted" }
}

export async function deleteSentEmailAction(formData: FormData): Promise<EmailState> {
    const session = await auth()
    const emailId = z.string().uuid().safeParse(formData.get("emailId"))
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    if (!emailId.success) return { success: false, error: "Invalid email" }

    if (session.user.role === "admin") {
        await db.delete(emailLogs).where(eq(emailLogs.id, emailId.data))
    } else {
        await db.delete(emailLogs).where(and(
            eq(emailLogs.id, emailId.data),
            eq(emailLogs.userId, session.user.id),
        ))
    }
    revalidatePath("/dashboard")
    return { success: true, message: "Email deleted" }
}

export async function cancelScheduledEmailAction(formData: FormData): Promise<EmailState> {
    const session = await auth()
    const scheduledId = z.string().uuid().safeParse(formData.get("scheduledId"))
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    if (!scheduledId.success) return { success: false, error: "Invalid scheduled email" }

    const scheduled = await db.query.scheduledEmails.findFirst({
        where: and(
            eq(scheduledEmails.id, scheduledId.data),
            eq(scheduledEmails.userId, session.user.id),
            eq(scheduledEmails.status, "scheduled"),
        ),
    })
    if (!scheduled) return { success: false, error: "Scheduled email not found" }

    await db.transaction(async (transaction) => {
        await transaction.insert(emailDrafts).values({
            userId: scheduled.userId,
            senderIdentityId: scheduled.senderIdentityId,
            recipients: scheduled.recipients,
            ccRecipients: scheduled.ccRecipients,
            bccRecipients: scheduled.bccRecipients,
            subject: scheduled.subject,
            htmlContent: scheduled.htmlContent,
        })
        await transaction.delete(scheduledEmails).where(eq(scheduledEmails.id, scheduled.id))
    })

    revalidatePath("/dashboard/scheduled")
    revalidatePath("/dashboard/drafts")
    return { success: true, message: "Scheduled email moved to drafts" }
}

export async function editScheduledEmailAction(formData: FormData): Promise<never> {
    const session = await auth()
    const scheduledId = z.string().uuid().safeParse(formData.get("scheduledId"))
    if (!session?.user?.id) redirect("/api/auth/signin")
    if (!scheduledId.success) redirect("/dashboard/scheduled")

    const scheduled = await db.query.scheduledEmails.findFirst({
        where: and(
            eq(scheduledEmails.id, scheduledId.data),
            eq(scheduledEmails.userId, session.user.id),
            eq(scheduledEmails.status, "scheduled"),
        ),
    })
    if (!scheduled) redirect("/dashboard/scheduled")

    const [draft] = await db.transaction(async (transaction) => {
        const inserted = await transaction.insert(emailDrafts).values({
            userId: scheduled.userId,
            senderIdentityId: scheduled.senderIdentityId,
            recipients: scheduled.recipients,
            ccRecipients: scheduled.ccRecipients,
            bccRecipients: scheduled.bccRecipients,
            subject: scheduled.subject,
            htmlContent: scheduled.htmlContent,
        }).returning({ id: emailDrafts.id })
        await transaction.delete(scheduledEmails).where(eq(scheduledEmails.id, scheduled.id))
        return inserted
    })

    revalidatePath("/dashboard/scheduled")
    revalidatePath("/dashboard/drafts")
    redirect(`/dashboard/compose?draftId=${draft.id}`)
}
