import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_studio_views_areas" ADD COLUMN "width_in" numeric;
  ALTER TABLE "products_studio_views_areas" ADD COLUMN "height_in" numeric;
  ALTER TABLE "print_methods" ADD COLUMN "max_width_in" numeric;
  ALTER TABLE "print_methods" ADD COLUMN "max_height_in" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_studio_views_areas" DROP COLUMN "width_in";
  ALTER TABLE "products_studio_views_areas" DROP COLUMN "height_in";
  ALTER TABLE "print_methods" DROP COLUMN "max_width_in";
  ALTER TABLE "print_methods" DROP COLUMN "max_height_in";`)
}
