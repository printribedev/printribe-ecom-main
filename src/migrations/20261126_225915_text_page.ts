import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_text_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "pages_blocks_text_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"updated" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_page_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_page" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_text_page_sections" ADD CONSTRAINT "pages_blocks_text_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_page" ADD CONSTRAINT "pages_blocks_text_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_page_sections" ADD CONSTRAINT "_pages_v_blocks_text_page_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_page" ADD CONSTRAINT "_pages_v_blocks_text_page_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_page_sections_order_idx" ON "pages_blocks_text_page_sections" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_page_sections_parent_id_idx" ON "pages_blocks_text_page_sections" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_page_order_idx" ON "pages_blocks_text_page" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_page_parent_id_idx" ON "pages_blocks_text_page" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_page_path_idx" ON "pages_blocks_text_page" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_text_page_sections_order_idx" ON "_pages_v_blocks_text_page_sections" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_page_sections_parent_id_idx" ON "_pages_v_blocks_text_page_sections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_page_order_idx" ON "_pages_v_blocks_text_page" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_page_parent_id_idx" ON "_pages_v_blocks_text_page" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_page_path_idx" ON "_pages_v_blocks_text_page" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_text_page_sections" CASCADE;
  DROP TABLE "pages_blocks_text_page" CASCADE;
  DROP TABLE "_pages_v_blocks_text_page_sections" CASCADE;
  DROP TABLE "_pages_v_blocks_text_page" CASCADE;`)
}
