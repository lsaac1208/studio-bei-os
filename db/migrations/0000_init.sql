CREATE TYPE "public"."budget_range" AS ENUM('UNDER_3K', 'R_3K_8K', 'R_8K_20K', 'OVER_20K', 'UNSURE');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('APPOINTMENT', 'ORDER_INVENTORY', 'WEBSITE_CRM', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFYING', 'QUOTED', 'WON', 'LOST', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('LOW', 'NORMAL', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."timeline" AS ENUM('WITHIN_2W', 'WITHIN_1M', 'WITHIN_3M', 'UNSURE');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"outcome_summary" text,
	"client_name" text,
	"industry" text,
	"year" integer,
	"duration" text,
	"cover_image" text,
	"body" jsonb DEFAULT 'null'::jsonb,
	"client_quote" jsonb DEFAULT 'null'::jsonb,
	"demo_component" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tech_stack" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"actor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"content" text NOT NULL,
	"next_follow_up_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"wechat" text,
	"phone" text,
	"email" text,
	"business_type" "business_type" NOT NULL,
	"budget_range" "budget_range" NOT NULL,
	"timeline" timeline,
	"pain_point" text,
	"message" text NOT NULL,
	"source" text,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"priority" "priority" DEFAULT 'NORMAL' NOT NULL,
	"feishu_message_id" text,
	"bitable_record_id" text,
	"bitable_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"password_hash" text,
	"lark_open_id" text,
	"lark_union_id" text,
	"lark_tenant_key" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_lark_open_id_unique" UNIQUE("lark_open_id"),
	CONSTRAINT "user_lark_union_id_unique" UNIQUE("lark_union_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_published_order_idx" ON "cases" USING btree ("published","order");--> statement-breakpoint
CREATE INDEX "cases_featured_order_idx" ON "cases" USING btree ("featured","order");--> statement-breakpoint
CREATE INDEX "faqs_published_order_idx" ON "faqs" USING btree ("published","order");--> statement-breakpoint
CREATE INDEX "landing_blocks_kind_order_idx" ON "landing_blocks" USING btree ("kind","order");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_created_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_created_idx" ON "lead_notes" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_notes_pending_followup_idx" ON "lead_notes" USING btree ("next_follow_up_at","completed_at");--> statement-breakpoint
CREATE INDEX "leads_status_created_idx" ON "leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "leads_bitable_synced_idx" ON "leads" USING btree ("bitable_synced_at");