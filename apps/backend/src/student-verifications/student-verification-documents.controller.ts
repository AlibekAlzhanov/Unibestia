import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { InjectRepository } from "@nestjs/typeorm";
import { clerkClient } from "@clerk/express";
import {
  StudentProfile,
  StudentVerification,
  StudentVerificationMethod,
  StudentVerificationRequestStatus,
  StudentVerificationStatus,
  University,
  UniversityEmailDomain,
  UniversityStatus,
  User,
  UserRole,
} from "@repo/db";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Repository } from "typeorm";

type UploadedPdfFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AuthenticatedHttpRequest = {
  headers: {
    authorization?: string | string[];
  };
};

type PdfHttpResponse = {
  setHeader(name: string, value: string): void;
  sendFile(filePath: string): unknown;
};

@Controller("student-verifications")
export class StudentVerificationDocumentsController {
  private readonly maxPdfSizeBytes = 5 * 1024 * 1024;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
    @InjectRepository(StudentProfile)
    private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(StudentVerification)
    private readonly studentVerificationsRepo: Repository<StudentVerification>,
    @InjectRepository(UniversityEmailDomain)
    private readonly universityEmailDomainsRepo: Repository<UniversityEmailDomain>
  ) {}

  @Post("document")
  @UseInterceptors(
    FileInterceptor("document", {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    })
  )
  async uploadDocument(
    @Req() req: AuthenticatedHttpRequest,
    @UploadedFile() file: UploadedPdfFile | undefined
  ) {
    const user = await this.requireCurrentLocalUser(req);
    const domainCheck = await this.requireAllowedStudentEmailDomain(user);

    const studentProfile = await this.studentProfilesRepo.findOne({
      where: { userId: user.id },
    });

    if (!studentProfile) {
      throw new BadRequestException(
        "Fill student profile before uploading verification document"
      );
    }

    this.assertProfileComplete(user, studentProfile, domainCheck.university);

    if (
      studentProfile.verificationStatus ===
      StudentVerificationStatus.PENDING_REVIEW
    ) {
      throw new ConflictException("Verification request is already pending");
    }

    if (studentProfile.verificationStatus === StudentVerificationStatus.VERIFIED) {
      throw new ConflictException("Student profile is already verified");
    }

    this.assertPdfFile(file);

    const storageKey = await this.storePdfFile(user.id, file);

    const verification = this.studentVerificationsRepo.create({
      userId: user.id,
      studentProfileId: studentProfile.id,
      method: StudentVerificationMethod.DOCUMENT_PDF,
      status: StudentVerificationRequestStatus.PENDING,
      submittedEmail: user.email,
      documentUrl: `local://${storageKey}`,
      documentType: "electronic_student_card_pdf",
      reviewComment: null,
      reviewedByUserId: null,
      reviewedAt: null,
      expiresAt: null,
    });

    const savedVerification =
      await this.studentVerificationsRepo.save(verification);

    studentProfile.studentEmail = user.email;
    studentProfile.universityId = domainCheck.university.id;
    studentProfile.verificationStatus =
      StudentVerificationStatus.PENDING_REVIEW;
    studentProfile.verifiedAt = null;
    studentProfile.verificationExpiresAt = null;

    await this.studentProfilesRepo.save(studentProfile);

    return {
      id: savedVerification.id,
      status: savedVerification.status,
      method: savedVerification.method,
      documentType: savedVerification.documentType,
      documentUrl: `/student-verifications/documents/${savedVerification.id}`,
      createdAt: savedVerification.createdAt,
    };
  }

  @Get("documents/:verificationId")
  async readDocument(
    @Req() req: AuthenticatedHttpRequest,
    @Res() res: PdfHttpResponse,
    @Param("verificationId") verificationId: string
  ) {
    const user = await this.requireCurrentLocalUser(req);

    const verification = await this.studentVerificationsRepo.findOne({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException("Verification document not found");
    }

    if (verification.userId !== user.id && !(await this.isAdmin(user.id))) {
      throw new ForbiddenException("You are not allowed to access this document");
    }

    if (!verification.documentUrl?.startsWith("local://")) {
      throw new NotFoundException("Verification document file is missing");
    }

    const storageKey = verification.documentUrl.replace("local://", "");
    const absolutePath = this.resolveStorageKey(storageKey);

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException("Verification document file is missing");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="student-verification-${verification.id}.pdf"`
    );

    return res.sendFile(absolutePath);
  }

  private async requireCurrentLocalUser(
    req: AuthenticatedHttpRequest
  ): Promise<User> {
    const authHeaderValue = req.headers.authorization;
    const authHeader = Array.isArray(authHeaderValue)
      ? authHeaderValue[0]
      : authHeaderValue;

    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Bearer token is required");
    }

    const sessionId = this.extractSessionIdFromJwt(token);

    if (!sessionId) {
      throw new UnauthorizedException("Invalid Clerk session token");
    }

    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;

    try {
      const session = await clerkClient.sessions.getSession(sessionId);

      if (!session || session.status !== "active" || !session.userId) {
        throw new UnauthorizedException("Clerk session is not active");
      }

      clerkUser = await clerkClient.users.getUser(session.userId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Unable to validate Clerk session");
    }

    const localUser = await this.usersRepo.findOne({
      where: { clerkUserId: clerkUser.id },
    });

    if (!localUser) {
      throw new BadRequestException(
        "Local user was not found. Open and save profile first."
      );
    }

    const clerkEmail =
      clerkUser.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ?? null;

    if (clerkEmail && localUser.email !== clerkEmail) {
      localUser.email = clerkEmail;
      await this.usersRepo.save(localUser);
    }

    return localUser;
  }

  private extractSessionIdFromJwt(token: string): string | null {
    try {
      const parts = token.split(".");

      if (parts.length !== 3 || !parts[1]) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString()
      ) as {
        sid?: string;
      };

      return payload.sid ?? null;
    } catch {
      return null;
    }
  }

  private getEmailDomain(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const parts = normalizedEmail.split("@");

    if (parts.length !== 2 || !parts[1]) {
      throw new BadRequestException("Invalid user email");
    }

    return parts[1];
  }

  private async requireAllowedStudentEmailDomain(user: User): Promise<{
    domain: string;
    university: University;
  }> {
    const domain = this.getEmailDomain(user.email);

    const allowedDomain = await this.universityEmailDomainsRepo.findOne({
      where: {
        domain,
        isActive: true,
      },
      relations: {
        university: true,
      },
    });

    if (
      !allowedDomain?.university ||
      allowedDomain.university.status !== UniversityStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        "Only approved student email domains are allowed"
      );
    }

    return {
      domain,
      university: allowedDomain.university,
    };
  }

  private assertProfileComplete(
    user: User,
    studentProfile: StudentProfile,
    university: University
  ): void {
    const missingFields: string[] = [];

    if (!user.firstName?.trim()) missingFields.push("Имя");
    if (!user.lastName?.trim()) missingFields.push("Фамилия");
    if (!user.phone?.trim()) missingFields.push("Телефон");
    if (!studentProfile.studentEmail?.trim()) {
      missingFields.push("Студенческая почта");
    }
    if (!university.id) missingFields.push("Университет");
    if (!studentProfile.degree?.trim()) missingFields.push("Степень обучения");
    if (!studentProfile.specialty?.trim()) missingFields.push("Специальность");
    if (!studentProfile.course) missingFields.push("Курс");
    if (!studentProfile.admissionDate) missingFields.push("Дата поступления");

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Complete required profile fields before upload: ${missingFields.join(
          ", "
        )}`
      );
    }
  }

  private assertPdfFile(
    file: UploadedPdfFile | undefined
  ): asserts file is UploadedPdfFile {
    if (!file) {
      throw new BadRequestException("PDF document is required");
    }

    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException("Only PDF files are allowed");
    }

    if (file.size <= 0) {
      throw new BadRequestException("PDF file is empty");
    }

    if (file.size > this.maxPdfSizeBytes) {
      throw new BadRequestException("PDF file must not exceed 5 MB");
    }

    if (!file.buffer || file.buffer.length < 5) {
      throw new BadRequestException("PDF file is invalid");
    }

    const signature = file.buffer.subarray(0, 5).toString("utf8");

    if (signature !== "%PDF-") {
      throw new BadRequestException("Uploaded file is not a valid PDF");
    }
  }

  private getUploadRoot(): string {
    return path.resolve(
      process.env.STUDENT_VERIFICATION_UPLOAD_DIR ??
        path.join(process.cwd(), "uploads", "student-verifications")
    );
  }

  private resolveStorageKey(storageKey: string): string {
    const uploadRoot = this.getUploadRoot();
    const absoluteUploadRoot = path.resolve(uploadRoot);
    const absolutePath = path.resolve(absoluteUploadRoot, storageKey);

    if (
      absolutePath !== absoluteUploadRoot &&
      !absolutePath.startsWith(`${absoluteUploadRoot}${path.sep}`)
    ) {
      throw new ForbiddenException("Invalid document path");
    }

    return absolutePath;
  }

  private async storePdfFile(
    userId: string,
    file: UploadedPdfFile
  ): Promise<string> {
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, "");
    const fileName = `${randomUUID()}.pdf`;
    const storageKey = path.join(safeUserId, fileName);
    const absolutePath = this.resolveStorageKey(storageKey);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer, { mode: 0o600 });

    return storageKey.replace(/\\/g, "/");
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const userRoles = await this.userRolesRepo.find({
      where: { userId },
      relations: { role: true },
    });

    return userRoles.some((userRole) =>
      ["admin", "super_admin"].includes(userRole.role?.code ?? "")
    );
  }
}
