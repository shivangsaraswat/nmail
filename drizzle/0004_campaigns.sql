CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "description" text,
  "status" text NOT NULL DEFAULT 'draft',
  "sender_identity_id" uuid REFERENCES "sender_identities"("id"),
  "subject_template" text NOT NULL DEFAULT '',
  "html_template" text NOT NULL DEFAULT '',
  "scheduled_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE TABLE "campaign_columns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE cascade,
  "display_name" text NOT NULL,
  "variable_key" text NOT NULL,
  "type" text NOT NULL DEFAULT 'text',
  "position" integer NOT NULL DEFAULT 0,
  "required" boolean NOT NULL DEFAULT false
);
CREATE TABLE "campaign_rows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE cascade,
  "data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "sent_at" timestamp,
  "message_id" text,
  "error" text
);
CREATE TABLE "campaign_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE cascade,
  "campaign_row_id" uuid REFERENCES "campaign_rows"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
  "recipient" text,
  "sender" text,
  "status" text NOT NULL,
  "provider_message_id" text,
  "error" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
