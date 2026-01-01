
import nodemailer from "nodemailer";
import { db } from "@/db";
import { emailLogs, userSenderPermissions, senderIdentities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(params: {
        userId: string;
        senderIdentityId: string;
        recipients: string[];
        cc?: string[];
        bcc?: string[];
        subject: string;
        html: string;
        isAdmin?: boolean;
        attachments?: { filename: string; content: Buffer; contentType: string }[];
    }) {
        let senderIdentity;

        if (params.isAdmin) {
            // Admins can use any active sender identity
            senderIdentity = await db.query.senderIdentities.findFirst({
                where: and(
                    eq(senderIdentities.id, params.senderIdentityId),
                    eq(senderIdentities.isActive, true)
                )
            });

            if (!senderIdentity) {
                throw new Error("Sender identity not found or inactive.");
            }
        } else {
            // Regular users need explicit permission
            const permission = await db.query.userSenderPermissions.findFirst({
                where: and(
                    eq(userSenderPermissions.userId, params.userId),
                    eq(userSenderPermissions.senderIdentityId, params.senderIdentityId)
                ),
                with: {
                    senderIdentity: true,
                }
            });

            if (!permission || !permission.senderIdentity) {
                throw new Error("Unauthorized: You do not have permission to use this sender identity.");
            }

            senderIdentity = permission.senderIdentity;
            if (!senderIdentity.isActive) {
                throw new Error("Sender identity is inactive.");
            }
        }

        // Prepare Email
        const from = `"${senderIdentity.displayName}" <${senderIdentity.emailAddress}>`;
        const htmlHash = crypto.createHash('sha256').update(params.html).digest('hex');

        // Send via SMTP
        try {
            const info = await this.transporter.sendMail({
                from: from,
                to: params.recipients.join(", "),
                cc: params.cc?.join(", "),
                bcc: params.bcc?.join(", "),
                subject: params.subject,
                html: params.html,
                attachments: params.attachments?.map(att => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                })),
            });

            // Log Success
            await db.insert(emailLogs).values({
                userId: params.userId,
                senderIdentityId: params.senderIdentityId,
                recipients: params.recipients,
                subject: params.subject,
                htmlContentHash: htmlHash,
                deliveryStatus: "sent",
            });

            return { success: true, messageId: info.messageId };

        } catch (error: any) {
            console.error("Email send failed:", error);
            // Log Failure
            await db.insert(emailLogs).values({
                userId: params.userId,
                senderIdentityId: params.senderIdentityId,
                recipients: params.recipients,
                subject: params.subject,
                htmlContentHash: htmlHash,
                deliveryStatus: "failed",
                errorMessage: error.message,
            });
            return { success: false, error: error.message };
        }
    }
}

export const emailService = new EmailService();


