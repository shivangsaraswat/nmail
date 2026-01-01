
import { pgTable, text, timestamp, boolean, uuid, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";
import { relations } from "drizzle-orm";

// --- Auth.js Tables ---

export const users = pgTable("user", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    // Custom fields
    role: text("role").notNull().default("user"), // 'admin' | 'user'
    status: text("status").notNull().default("active"), // 'active' | 'disabled'
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
    "account",
    {
        userId: uuid("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: uuid("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);

// --- Application Tables ---

export const senderIdentities = pgTable("sender_identities", {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: text("display_name").notNull(),
    emailAddress: text("email_address").notNull(), // The actual Gmail address
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSenderPermissions = pgTable("user_sender_permissions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    senderIdentityId: uuid("sender_identity_id").references(() => senderIdentities.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    senderIdentityId: uuid("sender_identity_id").references(() => senderIdentities.id).notNull(),
    recipients: jsonb("recipients").notNull(), // Array of strings
    subject: text("subject").notNull(),
    htmlContentHash: text("html_content_hash").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    deliveryStatus: text("delivery_status").notNull(), // 'sent', 'failed'
    errorMessage: text("error_message"),
});

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    actionType: text("action_type").notNull(),
    metadata: jsonb("metadata"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    permissions: many(userSenderPermissions),
    emailLogs: many(emailLogs),
    auditLogs: many(auditLogs),
}));

export const senderIdentitiesRelations = relations(senderIdentities, ({ many }) => ({
    permissions: many(userSenderPermissions),
    emailLogs: many(emailLogs),
}));

export const userSenderPermissionsRelations = relations(userSenderPermissions, ({ one }) => ({
    user: one(users, {
        fields: [userSenderPermissions.userId],
        references: [users.id],
    }),
    senderIdentity: one(senderIdentities, {
        fields: [userSenderPermissions.senderIdentityId],
        references: [senderIdentities.id],
    }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
    user: one(users, {
        fields: [emailLogs.userId],
        references: [users.id],
    }),
    senderIdentity: one(senderIdentities, {
        fields: [emailLogs.senderIdentityId],
        references: [senderIdentities.id],
    }),
}));
