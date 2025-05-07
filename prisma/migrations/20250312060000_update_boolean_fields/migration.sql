/*
  Warnings:

  - Made the column `h1b_sponsored` on table `job_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_new_grad` on table `job_listings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "job_listings_position_title_company_posting_date_content_ha_key";

-- AlterTable
ALTER TABLE "job_listings" ALTER COLUMN "h1b_sponsored" SET NOT NULL,
ALTER COLUMN "h1b_sponsored" SET DEFAULT false,
ALTER COLUMN "is_new_grad" SET NOT NULL,
ALTER COLUMN "is_new_grad" SET DEFAULT false;
