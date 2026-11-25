import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'in-progress', 'done');
  CREATE TABLE "enquiries_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_enquiries_status" DEFAULT 'new' NOT NULL,
  	"customer_id" integer,
  	"name" varchar NOT NULL,
  	"email" varchar,
  	"phone" varchar,
  	"organisation" varchar,
  	"interested_in" varchar,
  	"need" varchar,
  	"quantity" varchar,
  	"needed_by" varchar,
  	"best_time" varchar,
  	"channel" varchar,
  	"message" varchar NOT NULL,
  	"heard_from" varchar,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar DEFAULT 'info@theprintribe.com',
  	"whatsapp" varchar,
  	"phone" varchar,
  	"hours" varchar,
  	"location" varchar DEFAULT 'Bengaluru, India',
  	"reply_time" varchar DEFAULT 'within 24 hours',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_studio_teaser" ALTER COLUMN "tag" SET DEFAULT 'New';
  ALTER TABLE "pages_blocks_studio_teaser" ALTER COLUMN "button_label" SET DEFAULT 'Start designing';
  ALTER TABLE "_pages_v_blocks_studio_teaser" ALTER COLUMN "tag" SET DEFAULT 'New';
  ALTER TABLE "_pages_v_blocks_studio_teaser" ALTER COLUMN "button_label" SET DEFAULT 'Start designing';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enquiries_id" integer;
  ALTER TABLE "enquiries_files" ADD CONSTRAINT "enquiries_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "enquiries_files_order_idx" ON "enquiries_files" USING btree ("_order");
  CREATE INDEX "enquiries_files_parent_id_idx" ON "enquiries_files" USING btree ("_parent_id");
  CREATE INDEX "enquiries_customer_idx" ON "enquiries" USING btree ("customer_id");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "enquiries_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "enquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "enquiries_files" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "contact_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_enquiries_id_idx";
  ALTER TABLE "pages_blocks_studio_teaser" ALTER COLUMN "tag" SET DEFAULT 'Coming soon';
  ALTER TABLE "pages_blocks_studio_teaser" ALTER COLUMN "button_label" SET DEFAULT 'Notify me';
  ALTER TABLE "_pages_v_blocks_studio_teaser" ALTER COLUMN "tag" SET DEFAULT 'Coming soon';
  ALTER TABLE "_pages_v_blocks_studio_teaser" ALTER COLUMN "button_label" SET DEFAULT 'Notify me';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enquiries_id";
  DROP TYPE "public"."enum_enquiries_status";`)
}
