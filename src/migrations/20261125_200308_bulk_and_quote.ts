import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_quotes_status" AS ENUM('new', 'quoted', 'accepted', 'lost');
  CREATE TABLE "quotes_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_title" varchar,
  	"product_id" integer,
  	"colour" varchar,
  	"quantity" numeric,
  	"unit_price" numeric,
  	"printing_per_piece" numeric,
  	"line_total" numeric,
  	"design_id" integer,
  	"design_preview" varchar
  );
  
  CREATE TABLE "quotes_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "quotes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote_number" varchar NOT NULL,
  	"status" "enum_quotes_status" DEFAULT 'new' NOT NULL,
  	"customer_id" integer,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"company" varchar,
  	"gst_number" varchar,
  	"city" varchar,
  	"pincode" varchar,
  	"multiple_addresses" boolean,
  	"timeline" varchar,
  	"deadline" varchar,
  	"estimate_total" numeric,
  	"notes" varchar,
  	"quoted_amount" numeric,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "enquiries" ADD COLUMN "gst_number" varchar;
  ALTER TABLE "enquiries" ADD COLUMN "topic" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quotes_id" integer;
  ALTER TABLE "quotes_items" ADD CONSTRAINT "quotes_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quotes_items" ADD CONSTRAINT "quotes_items_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quotes_items" ADD CONSTRAINT "quotes_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quotes_files" ADD CONSTRAINT "quotes_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "quotes_items_order_idx" ON "quotes_items" USING btree ("_order");
  CREATE INDEX "quotes_items_parent_id_idx" ON "quotes_items" USING btree ("_parent_id");
  CREATE INDEX "quotes_items_product_idx" ON "quotes_items" USING btree ("product_id");
  CREATE INDEX "quotes_items_design_idx" ON "quotes_items" USING btree ("design_id");
  CREATE INDEX "quotes_files_order_idx" ON "quotes_files" USING btree ("_order");
  CREATE INDEX "quotes_files_parent_id_idx" ON "quotes_files" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "quotes_quote_number_idx" ON "quotes" USING btree ("quote_number");
  CREATE INDEX "quotes_customer_idx" ON "quotes" USING btree ("customer_id");
  CREATE INDEX "quotes_updated_at_idx" ON "quotes" USING btree ("updated_at");
  CREATE INDEX "quotes_created_at_idx" ON "quotes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quotes_fk" FOREIGN KEY ("quotes_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_quotes_id_idx" ON "payload_locked_documents_rels" USING btree ("quotes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quotes_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quotes_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quotes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quotes_items" CASCADE;
  DROP TABLE "quotes_files" CASCADE;
  DROP TABLE "quotes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quotes_fk";
  
  DROP INDEX "payload_locked_documents_rels_quotes_id_idx";
  ALTER TABLE "enquiries" DROP COLUMN "gst_number";
  ALTER TABLE "enquiries" DROP COLUMN "topic";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quotes_id";
  DROP TYPE "public"."enum_quotes_status";`)
}
