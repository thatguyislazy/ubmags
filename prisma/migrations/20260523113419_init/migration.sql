-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'FACULTY', 'STAFF', 'DEPT_HEAD', 'MAGS_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('VENUE', 'EQUIPMENT', 'SERVICE');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('DRAFT', 'PENDING_DEPT', 'SEMI_APPROVED', 'PENDING_MAGS', 'APPROVED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalLevel" AS ENUM ('DEPT_HEAD', 'MAGS_OFFICER', 'DIRECTOR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GatePassStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'RETURNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION_UPDATE', 'APPROVAL', 'REJECTION', 'SCHEDULE_REMINDER', 'RETURN_REMINDER', 'CONFLICT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('TRANSFER', 'TURN_OVER');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "departmentId" TEXT,
    "studentNumber" TEXT,
    "course" TEXT,
    "phone" TEXT,
    "emailVerified" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "verifyToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "building" TEXT,
    "requiresSpecify" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDescription" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING_DEPT',
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemsPersonnelNote" TEXT,
    "customVenueSpecify" TEXT,
    "conformeName" TEXT,
    "conformeDate" TIMESTAMP(3),
    "conformeSigned" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationVenue" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "specifyText" TEXT,

    CONSTRAINT "ReservationVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationEquipment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReservationEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationService" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ReservationService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "passNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reservationId" TEXT,
    "dateFiled" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestorName" TEXT NOT NULL,
    "course" TEXT,
    "studentNumber" TEXT,
    "equipmentType" TEXT NOT NULL,
    "equipmentDescription" TEXT,
    "brand" TEXT,
    "serialNumber" TEXT,
    "model" TEXT,
    "purpose" TEXT NOT NULL,
    "entryDateTime" TIMESTAMP(3) NOT NULL,
    "pullOutDateTime" TIMESTAMP(3) NOT NULL,
    "returnDateTime" TIMESTAMP(3),
    "status" "GatePassStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "qrCodeData" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePassEquipment" (
    "id" TEXT NOT NULL,
    "gatePassId" TEXT NOT NULL,
    "resourceId" TEXT,
    "customName" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GatePassEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "approverId" TEXT,
    "level" "ApprovalLevel" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "signatureName" TEXT,
    "actedAt" TIMESTAMP(3),
    "reservationId" TEXT,
    "gatePassId" TEXT,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferTurnover" (
    "id" TEXT NOT NULL,
    "formNumber" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "dateFiled" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferTurnover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "resourceId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "brandSerial" TEXT,
    "propertyNumber" TEXT,
    "remarks" TEXT,

    CONSTRAINT "TransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedEquipment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "equipmentDescription" TEXT,
    "brand" TEXT,
    "serialNumber" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_requestNumber_key" ON "Reservation"("requestNumber");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_departmentId_idx" ON "Reservation"("departmentId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_startDateTime_endDateTime_idx" ON "Reservation"("startDateTime", "endDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationVenue_reservationId_resourceId_key" ON "ReservationVenue"("reservationId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationEquipment_reservationId_resourceId_key" ON "ReservationEquipment"("reservationId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationService_reservationId_resourceId_key" ON "ReservationService"("reservationId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GatePass_passNumber_key" ON "GatePass"("passNumber");

-- CreateIndex
CREATE INDEX "GatePass_userId_idx" ON "GatePass"("userId");

-- CreateIndex
CREATE INDEX "GatePass_status_idx" ON "GatePass"("status");

-- CreateIndex
CREATE INDEX "ApprovalLog_entityType_entityId_idx" ON "ApprovalLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferTurnover_formNumber_key" ON "TransferTurnover"("formNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SavedEquipment_userId_idx" ON "SavedEquipment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_token_key" ON "EmailVerification"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationVenue" ADD CONSTRAINT "ReservationVenue_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationVenue" ADD CONSTRAINT "ReservationVenue_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationEquipment" ADD CONSTRAINT "ReservationEquipment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationEquipment" ADD CONSTRAINT "ReservationEquipment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationService" ADD CONSTRAINT "ReservationService_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationService" ADD CONSTRAINT "ReservationService_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePassEquipment" ADD CONSTRAINT "GatePassEquipment_gatePassId_fkey" FOREIGN KEY ("gatePassId") REFERENCES "GatePass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePassEquipment" ADD CONSTRAINT "GatePassEquipment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_gatePassId_fkey" FOREIGN KEY ("gatePassId") REFERENCES "GatePass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferTurnover" ADD CONSTRAINT "TransferTurnover_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "TransferTurnover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedEquipment" ADD CONSTRAINT "SavedEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
