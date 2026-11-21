import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_colours_mockups_view" AS ENUM('front', 'back', 'left', 'right');
  CREATE TYPE "public"."enum_products_studio_views_areas_size" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_products_studio_views_view" AS ENUM('front', 'back', 'left', 'right');
  CREATE TABLE "products_colours_mockups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" "enum_products_colours_mockups_view" NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "products_studio_views_areas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"size" "enum_products_studio_views_areas_size" DEFAULT 'medium' NOT NULL,
  	"x" numeric NOT NULL,
  	"y" numeric NOT NULL,
  	"width" numeric NOT NULL,
  	"height" numeric NOT NULL,
  	"size_note" varchar
  );
  
  CREATE TABLE "products_studio_views" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"view" "enum_products_studio_views_view" NOT NULL
  );
  
  CREATE TABLE "print_methods" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"description" varchar,
  	"small_price" numeric DEFAULT 0 NOT NULL,
  	"medium_price" numeric DEFAULT 0 NOT NULL,
  	"large_price" numeric DEFAULT 0 NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "studio_enabled" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "print_methods_id" integer;
  ALTER TABLE "products_colours_mockups" ADD CONSTRAINT "products_colours_mockups_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_colours_mockups" ADD CONSTRAINT "products_colours_mockups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_colours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_studio_views_areas" ADD CONSTRAINT "products_studio_views_areas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_studio_views"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_studio_views" ADD CONSTRAINT "products_studio_views_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_colours_mockups_order_idx" ON "products_colours_mockups" USING btree ("_order");
  CREATE INDEX "products_colours_mockups_parent_id_idx" ON "products_colours_mockups" USING btree ("_parent_id");
  CREATE INDEX "products_colours_mockups_image_idx" ON "products_colours_mockups" USING btree ("image_id");
  CREATE INDEX "products_studio_views_areas_order_idx" ON "products_studio_views_areas" USING btree ("_order");
  CREATE INDEX "products_studio_views_areas_parent_id_idx" ON "products_studio_views_areas" USING btree ("_parent_id");
  CREATE INDEX "products_studio_views_order_idx" ON "products_studio_views" USING btree ("_order");
  CREATE INDEX "products_studio_views_parent_id_idx" ON "products_studio_views" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "print_methods_slug_idx" ON "print_methods" USING btree ("slug");
  CREATE INDEX "print_methods_updated_at_idx" ON "print_methods" USING btree ("updated_at");
  CREATE INDEX "print_methods_created_at_idx" ON "print_methods" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_print_methods_fk" FOREIGN KEY ("print_methods_id") REFERENCES "public"."print_methods"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_print_methods_id_idx" ON "payload_locked_documents_rels" USING btree ("print_methods_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_colours_mockups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_studio_views_areas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_studio_views" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "print_methods" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_colours_mockups" CASCADE;
  DROP TABLE "products_studio_views_areas" CASCADE;
  DROP TABLE "products_studio_views" CASCADE;
  DROP TABLE "print_methods" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_print_methods_fk";
  
  DROP INDEX "payload_locked_documents_rels_print_methods_id_idx";
  ALTER TABLE "products" DROP COLUMN "studio_enabled";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "print_methods_id";
  DROP TYPE "public"."enum_products_colours_mockups_view";
  DROP TYPE "public"."enum_products_studio_views_areas_size";
  DROP TYPE "public"."enum_products_studio_views_view";`)
}
