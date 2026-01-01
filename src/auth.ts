
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
        Google({
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            // Add user id to session
            session.user.id = user.id;

            // Fetch the user's role from the database
            const dbUser = await db.query.users.findFirst({
                where: eq(users.id, user.id),
            });

            session.user.role = dbUser?.role || "user";
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
})
