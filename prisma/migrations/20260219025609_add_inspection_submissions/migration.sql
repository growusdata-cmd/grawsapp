/*
  Warnings:

  - Added the required column `submittedBy` to the `Inspection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "reviewerNotes" TEXT,
ADD COLUMN     "submittedBy" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "InspectionData" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "InspectionData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionData" ADD CONSTRAINT "InspectionData_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionData" ADD CONSTRAINT "InspectionData_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
