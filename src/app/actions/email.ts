
"use server"

import { auth } from "@/auth"
import { emailService } from "@/lib/email"
import { z } from "zod"

const sendEmailSchema = z.object({
    senderIdentityId: z.string().uuid(),
    to: z.string().min(1),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().min(1),
    html: z.string().min(1),
})

export type EmailState = {
    success: boolean
    message?: string
    error?: string
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

    // Parse recipients
    const parseEmails = (str?: string) =>
        str?.split(",").map(e => e.trim()).filter(e => e.length > 0) || []

    const recipients = parseEmails(to)
    const ccRecipients = parseEmails(cc)
    const bccRecipients = parseEmails(bcc)

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

    } catch (error: any) {
        return { success: false, error: error.message || "Internal server error" }
    }
}
