import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "orders_design_snapshot_previews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "orders_design_snapshot_areas_used" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" varchar,
  	"area_name" varchar,
  	"size" varchar,
  	"method_title" varchar,
  	"extra" numeric
  );
  
  CREATE TABLE "orders_design_snapshot_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  ALTER TABLE "orders" ADD COLUMN "design_id" integer;
  ALTER TABLE "orders" ADD COLUMN "design_snapshot_printing_per_piece" numeric;
  ALTER TABLE "orders" ADD COLUMN "design_snapshot_views" jsonb;
  ALTER TABLE "orders_design_snapshot_previews" ADD CONSTRAINT "orders_design_snapshot_previews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_design_snapshot_areas_used" ADD CONSTRAINT "orders_design_snapshot_areas_used_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_design_snapshot_files" ADD CONSTRAINT "orders_design_snapshot_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_design_snapshot_previews_order_idx" ON "orders_design_snapshot_previews" USING btree ("_order");
  CREATE INDEX "orders_design_snapshot_previews_parent_id_idx" ON "orders_design_snapshot_previews" USING btree ("_parent_id");
  CREATE INDEX "orders_design_snapshot_areas_used_order_idx" ON "orders_design_snapshot_areas_used" USING btree ("_order");
  CREATE INDEX "orders_design_snapshot_areas_used_parent_id_idx" ON "orders_design_snapshot_areas_used" USING btree ("_parent_id");
  CREATE INDEX "orders_design_snapshot_files_order_idx" ON "orders_design_snapshot_files" USING btree ("_order");
  CREATE INDEX "orders_design_snapshot_files_parent_id_idx" ON "orders_design_snapshot_files" USING btree ("_parent_id");
  ALTER TABLE "orders" ADD CONSTRAINT "orders_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_design_idx" ON "orders" USING btree ("design_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders_design_snapshot_previews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_design_snapshot_areas_used" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_design_snapshot_files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "orders_design_snapshot_previews" CASCADE;
  DROP TABLE "orders_design_snapshot_areas_used" CASCADE;
  DROP TABLE "orders_design_snapshot_files" CASCADE;
  ALTER TABLE "orders" DROP CONSTRAINT "orders_design_id_designs_id_fk";
  
  DROP INDEX "orders_design_idx";
  ALTER TABLE "orders" DROP COLUMN "design_id";
  ALTER TABLE "orders" DROP COLUMN "design_snapshot_printing_per_piece";
  ALTER TABLE "orders" DROP COLUMN "design_snapshot_views";`)
}
