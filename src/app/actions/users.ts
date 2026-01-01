
"use server"

import { db } from "@/db"
import { users, userSenderPermissions } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, newRole: string) {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    // Prevent admin from revoking their own admin rights (basic safety)
    if (userId === session.user.id && newRole !== 'admin') {
        throw new Error("Cannot revoke your own admin status")
    }

    await db.update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId))

    revalidatePath("/dashboard/users")
}

export async function togglePermission(userId: string, senderIdentityId: string, hasPermission: boolean) {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    if (hasPermission) {
        // Grant: Create record if it doesn't exist
        // Check first to avoid duplicates if race condition
        const existing = await db.query.userSenderPermissions.findFirst({
            where: and(
                eq(userSenderPermissions.userId, userId),
                eq(userSenderPermissions.senderIdentityId, senderIdentityId)
            )
        })

        if (!existing) {
            await db.insert(userSenderPermissions).values({
                userId,
                senderIdentityId,
            })
        }
    } else {
        // Revoke: Delete record
        await db.delete(userSenderPermissions).where(
            and(
                eq(userSenderPermissions.userId, userId),
                eq(userSenderPermissions.senderIdentityId, senderIdentityId)
            )
        )
    }

    revalidatePath("/dashboard/users")
}

export async function inviteUser(email: string, name?: string, role: string = "user") {
    const session = await auth()

    if (session?.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    })

    if (existingUser) {
        throw new Error("User with this email already exists")
    }

    // Create the user
    await db.insert(users).values({
        email,
        name: name || null,
        role,
    })

    revalidatePath("/dashboard/users")
}
