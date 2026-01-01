"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { emailTemplates } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

// Get all templates (available to all authenticated users)
export async function getTemplates() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const templates = await db.query.emailTemplates.findMany({
        orderBy: (templates, { desc }) => [desc(templates.createdAt)],
        with: {
            createdBy: {
                columns: {
                    name: true,
                    email: true,
                }
            }
        }
    })

    return { templates }
}

// Get single template by ID
export async function getTemplateById(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Unauthorized" }
    }

    const template = await db.query.emailTemplates.findFirst({
        where: eq(emailTemplates.id, id),
        with: {
            createdBy: {
                columns: {
                    name: true,
                    email: true,
                }
            }
        }
    })

    if (!template) {
        return { error: "Template not found" }
    }

    return { template }
}

// Create template (admin only)
export async function createTemplate(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'admin') {
        return { error: "Unauthorized - Admin access required" }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string | null
    const htmlContent = formData.get("htmlContent") as string

    if (!name || !htmlContent) {
        return { error: "Name and HTML content are required" }
    }

    try {
        const [template] = await db.insert(emailTemplates).values({
            name,
            description,
            htmlContent,
            createdById: session.user.id,
        }).returning()

        revalidatePath("/dashboard/templates")
        return { success: true, template }
    } catch (error) {
        console.error("Error creating template:", error)
        return { error: "Failed to create template" }
    }
}

// Update template (admin only)
export async function updateTemplate(id: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'admin') {
        return { error: "Unauthorized - Admin access required" }
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string | null
    const htmlContent = formData.get("htmlContent") as string

    if (!name || !htmlContent) {
        return { error: "Name and HTML content are required" }
    }

    try {
        await db.update(emailTemplates)
            .set({
                name,
                description,
                htmlContent,
                updatedAt: new Date(),
            })
            .where(eq(emailTemplates.id, id))

        revalidatePath("/dashboard/templates")
        return { success: true }
    } catch (error) {
        console.error("Error updating template:", error)
        return { error: "Failed to update template" }
    }
}

// Delete template (admin only)
export async function deleteTemplate(id: string) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'admin') {
        return { error: "Unauthorized - Admin access required" }
    }

    try {
        await db.delete(emailTemplates).where(eq(emailTemplates.id, id))
        revalidatePath("/dashboard/templates")
        return { success: true }
    } catch (error) {
        console.error("Error deleting template:", error)
        return { error: "Failed to delete template" }
    }
}
