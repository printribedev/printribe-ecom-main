import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_designs_status" AS ENUM('saved', 'ordered');
  CREATE TABLE "designs_areas_used" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" varchar,
  	"area_key" varchar,
  	"area_name" varchar,
  	"size" varchar,
  	"method_id" integer,
  	"method_title" varchar,
  	"extra" numeric
  );
  
  CREATE TABLE "designs_previews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "designs_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "designs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"status" "enum_designs_status" DEFAULT 'saved' NOT NULL,
  	"product_id" integer,
  	"product_title" varchar NOT NULL,
  	"colour" varchar,
  	"quantity" numeric,
  	"base_unit" numeric,
  	"extras_per_piece" numeric,
  	"per_piece" numeric,
  	"total" numeric,
  	"views" jsonb,
  	"method_by_area" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "designs_id" integer;
  ALTER TABLE "designs_areas_used" ADD CONSTRAINT "designs_areas_used_method_id_print_methods_id_fk" FOREIGN KEY ("method_id") REFERENCES "public"."print_methods"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "designs_areas_used" ADD CONSTRAINT "designs_areas_used_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "designs_previews" ADD CONSTRAINT "designs_previews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "designs_files" ADD CONSTRAINT "designs_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "designs" ADD CONSTRAINT "designs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "designs_areas_used_order_idx" ON "designs_areas_used" USING btree ("_order");
  CREATE INDEX "designs_areas_used_parent_id_idx" ON "designs_areas_used" USING btree ("_parent_id");
  CREATE INDEX "designs_areas_used_method_idx" ON "designs_areas_used" USING btree ("method_id");
  CREATE INDEX "designs_previews_order_idx" ON "designs_previews" USING btree ("_order");
  CREATE INDEX "designs_previews_parent_id_idx" ON "designs_previews" USING btree ("_parent_id");
  CREATE INDEX "designs_files_order_idx" ON "designs_files" USING btree ("_order");
  CREATE INDEX "designs_files_parent_id_idx" ON "designs_files" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "designs_token_idx" ON "designs" USING btree ("token");
  CREATE INDEX "designs_product_idx" ON "designs" USING btree ("product_id");
  CREATE INDEX "designs_updated_at_idx" ON "designs" USING btree ("updated_at");
  CREATE INDEX "designs_created_at_idx" ON "designs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_designs_fk" FOREIGN KEY ("designs_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_designs_id_idx" ON "payload_locked_documents_rels" USING btree ("designs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "designs_areas_used" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "designs_previews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "designs_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "designs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "designs_areas_used" CASCADE;
  DROP TABLE "designs_previews" CASCADE;
  DROP TABLE "designs_files" CASCADE;
  DROP TABLE "designs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_designs_fk";
  
  DROP INDEX "payload_locked_documents_rels_designs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "designs_id";
  DROP TYPE "public"."enum_designs_status";`)
}
