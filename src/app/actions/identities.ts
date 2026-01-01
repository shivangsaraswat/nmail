
"use server"

import { db } from "@/db"
import { senderIdentities } from "@/db/schema"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createIdentitySchema = z.object({
    displayName: z.string().min(2),
    emailAddress: z.string().email(),
})

export async function createSenderIdentity(formData: FormData) {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    const rawData = {
        displayName: formData.get("displayName"),
        emailAddress: formData.get("emailAddress"),
    }

    const validated = createIdentitySchema.parse(rawData)

    await db.insert(senderIdentities).values({
        displayName: validated.displayName,
        emailAddress: validated.emailAddress,
        isActive: true,
    })

    revalidatePath("/dashboard/identities")
    return { success: true }
}

export async function toggleIdentityStatus(id: string, currentStatus: boolean) {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    await db.update(senderIdentities)
        .set({ isActive: !currentStatus })
        .where(eq(senderIdentities.id, id))

    revalidatePath("/dashboard/identities")
}

export async function deleteIdentity(id: string) {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    // Note: In real app, might want to check for dependencies (permissions/logs) before hard deleting.
    // Ideally use soft delete, but schema supports hard delete cascaded for permissions, 
    // but LOGS refer to it? Logs usually shouldn't cascade delete.
    // For now we will just delete.
    await db.delete(senderIdentities).where(eq(senderIdentities.id, id))

    revalidatePath("/dashboard/identities")
}
