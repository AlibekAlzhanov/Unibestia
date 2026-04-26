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
import { StorageModule } from "../storage/storage.module.js";

@Module({
  imports: [
    StorageModule,
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