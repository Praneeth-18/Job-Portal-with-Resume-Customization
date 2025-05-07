-- CreateTable
CREATE TABLE "job_listings" (
    "id" SERIAL NOT NULL,
    "position_title" TEXT NOT NULL,
    "posting_date" TIMESTAMP(3) NOT NULL,
    "apply_link" TEXT,
    "work_model" TEXT,
    "location" TEXT,
    "company" TEXT NOT NULL,
    "company_size" TEXT,
    "company_industry" TEXT,
    "salary" TEXT,
    "qualifications" TEXT,
    "h1b_sponsored" BOOLEAN,
    "is_new_grad" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "content_hash" TEXT NOT NULL,

    CONSTRAINT "job_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_applications" (
    "id" SERIAL NOT NULL,
    "job_listing_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_status" TEXT NOT NULL DEFAULT 'Applied',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "user_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" SERIAL NOT NULL,
    "user_application_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_listings_position_title_company_posting_date_content_ha_key" ON "job_listings"("position_title", "company", "posting_date", "content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_applications_job_listing_id_user_id_key" ON "user_applications"("job_listing_id", "user_id");

-- AddForeignKey
ALTER TABLE "user_applications" ADD CONSTRAINT "user_applications_job_listing_id_fkey" FOREIGN KEY ("job_listing_id") REFERENCES "job_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_user_application_id_fkey" FOREIGN KEY ("user_application_id") REFERENCES "user_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
