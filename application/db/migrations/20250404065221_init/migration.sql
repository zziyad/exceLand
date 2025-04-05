-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'SECURITY', 'ADMIN');

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovalReason" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RemovalReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemovalImage" (
    "id" SERIAL NOT NULL,
    "removalId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "RemovalImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" SERIAL NOT NULL,
    "removalId" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "approverId" INTEGER NOT NULL,
    "approval" TEXT NOT NULL,
    "signature" TEXT,
    "signatureDate" TIMESTAMP(3),

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Removal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "removalTerms" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3),
    "employee" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "removalReasonId" INTEGER NOT NULL,
    "customReason" TEXT,
    "status" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Removal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemovalImage" ADD CONSTRAINT "RemovalImage_removalId_fkey" FOREIGN KEY ("removalId") REFERENCES "Removal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_removalId_fkey" FOREIGN KEY ("removalId") REFERENCES "Removal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Removal" ADD CONSTRAINT "Removal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Removal" ADD CONSTRAINT "Removal_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Removal" ADD CONSTRAINT "Removal_removalReasonId_fkey" FOREIGN KEY ("removalReasonId") REFERENCES "RemovalReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
