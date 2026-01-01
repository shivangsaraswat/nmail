
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { eq } from "drizzle-orm";

async function main() {
    const { db } = await import("../src/db");
    const { users } = await import("../src/db/schema");

    const email = "shivangk512@gmail.com";
    console.log(`Searching for user with email: ${email}`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    console.log("User found:", user);

    if (user.role === "admin") {
        console.log("User is already an admin.");
        return;
    }

    console.log("Updating user role to 'admin'...");
    await db.update(users).set({ role: "admin" }).where(eq(users.email, email));

    console.log("User updated successfully!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
