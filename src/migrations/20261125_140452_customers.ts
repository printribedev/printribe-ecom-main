import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"password_hash" varchar NOT NULL,
  	"session_version" numeric DEFAULT 1,
  	"reset_token_hash" varchar,
  	"reset_expires" timestamp(3) with time zone,
  	"failed_logins" numeric DEFAULT 0,
  	"locked_until" timestamp(3) with time zone,
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "designs" ADD COLUMN "customer_id" integer;
  ALTER TABLE "orders" ADD COLUMN "customer_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE INDEX "customers_reset_token_hash_idx" ON "customers" USING btree ("reset_token_hash");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  ALTER TABLE "designs" ADD CONSTRAINT "designs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "designs_customer_idx" ON "designs" USING btree ("customer_id");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "customers" CASCADE;
  ALTER TABLE "designs" DROP CONSTRAINT "designs_customer_id_customers_id_fk";
  
  ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  DROP INDEX "designs_customer_idx";
  DROP INDEX "orders_customer_idx";
  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  ALTER TABLE "designs" DROP COLUMN "customer_id";
  ALTER TABLE "orders" DROP COLUMN "customer_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";`)
}
