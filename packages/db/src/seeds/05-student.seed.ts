import type { DataSource } from "typeorm";
import {
  StudentProfile,
  StudentVerification,
  StudentVerificationMethod,
  StudentVerificationRequestStatus,
  StudentVerificationStatus,
  University,
  User,
} from "../entities/index.js";
import { upsertByWhere, logSeedStep } from "./utils.js";

export async function seedStudents(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const universityRepo = dataSource.getRepository(University);
  const profileRepo = dataSource.getRepository(StudentProfile);
  const verificationRepo = dataSource.getRepository(StudentVerification);

  const admin = await userRepo.findOne({ where: { email: "admin@unibestie.local" } });
  const alibek = await userRepo.findOne({ where: { email: "alibek@student.satbayev.local" } });
  const madina = await userRepo.findOne({ where: { email: "madina@student.kaznu.local" } });
  const satbayev = await universityRepo.findOne({ where: { shortName: "Satbayev" } });
  const kaznu = await universityRepo.findOne({ where: { shortName: "KazNU" } });

  if (!admin || !alibek || !madina || !satbayev || !kaznu) {
    throw new Error("Student seed prerequisites not found");
  }

  const alibekProfile = await upsertByWhere(profileRepo, { userId: alibek.id }, {
    userId: alibek.id,
    universityId: satbayev.id,
    studentEmail: "alibek@student.satbayev.local",
    studentCardNumber: "SU-2025-001",
    faculty: "Information Technology",
    specialty: "Software Engineering",
    course: 3,
    groupName: "SE-22-1",
    verificationStatus: StudentVerificationStatus.VERIFIED,
    verifiedAt: new Date(),
  });

  await upsertByWhere(verificationRepo, { userId: alibek.id, studentProfileId: alibekProfile.id }, {
    userId: alibek.id,
    studentProfileId: alibekProfile.id,
    method: StudentVerificationMethod.EDU_EMAIL,
    status: StudentVerificationRequestStatus.APPROVED,
    submittedEmail: "alibek@student.satbayev.local",
    reviewedByUserId: admin.id,
    reviewedAt: new Date(),
  });

  const madinaProfile = await upsertByWhere(profileRepo, { userId: madina.id }, {
    userId: madina.id,
    universityId: kaznu.id,
    studentEmail: "madina@student.kaznu.local",
    studentCardNumber: "KZNU-2025-014",
    faculty: "Economics",
    specialty: "Finance",
    course: 2,
    groupName: "FN-23-2",
    verificationStatus: StudentVerificationStatus.VERIFIED,
    verifiedAt: new Date(),
  });

  await upsertByWhere(verificationRepo, { userId: madina.id, studentProfileId: madinaProfile.id }, {
    userId: madina.id,
    studentProfileId: madinaProfile.id,
    method: StudentVerificationMethod.DOCUMENT_PDF,
    status: StudentVerificationRequestStatus.APPROVED,
    submittedEmail: "madina@student.kaznu.local",
    documentUrl: null,
    documentType: "student_card_pdf",
    reviewedByUserId: admin.id,
    reviewedAt: new Date(),
  });

  await logSeedStep(dataSource, "Student profiles and verification history seeded");
}
