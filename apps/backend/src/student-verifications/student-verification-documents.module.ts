import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  Role,
  StudentProfile,
  StudentVerification,
  University,
  UniversityEmailDomain,
  User,
  UserRole,
} from "@repo/db";
import { StudentVerificationDocumentsController } from "./student-verification-documents.controller.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRole,
      Role,
      StudentProfile,
      StudentVerification,
      University,
      UniversityEmailDomain,
    ]),
  ],
  controllers: [StudentVerificationDocumentsController],
})
export class StudentVerificationDocumentsModule {}
