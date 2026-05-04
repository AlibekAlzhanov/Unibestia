import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
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
  EducationProgramGroup,
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
import { createRequire } from "node:module";
import { Repository } from "typeorm";
import { StorageService } from "../storage/storage.service.js";

type UploadedPdfFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type PdfHttpResponse = {
  setHeader(name: string, value: string): void;
  send(body: Buffer): unknown;
};

type AuthenticatedHttpRequest = {
  headers: {
    authorization?: string | string[];
  };
};

type PdfParseResult = {
  text?: string;
  numpages?: number;
  info?: unknown;
  metadata?: unknown;
};

type PdfParse = (buffer: Buffer) => Promise<PdfParseResult>;

type VerificationTemplateCheck = {
  code: string;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
  score: number;
};

type ExtractedStudentCardFields = {
  fullName: string | null;
  university: string | null;
  degree: string | null;
  programGroup: string | null;
  course: string | null;
  admissionDate: string | null;
  hasStudentCardTitle: boolean;
  rawTextPreview: string;
};

const require = createRequire(import.meta.url);
const loadedPdfParse = require("pdf-parse") as unknown;

const pdfParse: PdfParse =
  typeof loadedPdfParse === "function"
    ? (loadedPdfParse as PdfParse)
    : typeof (loadedPdfParse as { default?: unknown }).default === "function"
      ? ((loadedPdfParse as { default: PdfParse }).default as PdfParse)
      : async () => {
          throw new Error("pdf-parse export is not a function");
        };

@Controller("student-verifications")
export class StudentVerificationDocumentsController {
  private readonly logger = new Logger(
    StudentVerificationDocumentsController.name
  );

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
    private readonly universityEmailDomainsRepo: Repository<UniversityEmailDomain>,
    @Inject(StorageService)
    private readonly storageService: StorageService
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
      documentUrl: `r2://${storageKey}`,
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

    if (!verification.documentUrl?.startsWith("r2://")) {
      throw new NotFoundException("Verification document file is missing");
    }

    const storageKey = verification.documentUrl.replace("r2://", "");

    let storedObject: Awaited<ReturnType<StorageService["getObject"]>>;

    try {
      storedObject = await this.storageService.getObject(storageKey);
    } catch {
      throw new NotFoundException("Verification document file is missing");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="student-verification-${verification.id}.pdf"`
    );

    if (storedObject.contentLength) {
      res.setHeader("Content-Length", String(storedObject.contentLength));
    }

    return res.send(storedObject.body);
  }

  @Post("documents/:verificationId/analyze")
  async analyzeDocument(
    @Req() req: AuthenticatedHttpRequest,
    @Param("verificationId") verificationId: string
  ) {
    const user = await this.requireCurrentLocalUser(req);

    if (!(await this.isAdmin(user.id))) {
      throw new ForbiddenException("Only admins can analyze verification documents");
    }

    const verification = await this.studentVerificationsRepo.findOne({
      where: { id: verificationId },
      relations: {
        user: true,
        studentProfile: {
          university: true,
          educationProgramGroup: true,
        },
      },
    });

    if (!verification) {
      throw new NotFoundException("Verification document not found");
    }

    if (!verification.documentUrl?.startsWith("r2://")) {
      throw new NotFoundException("Verification document file is missing");
    }

    const storageKey = verification.documentUrl.replace("r2://", "");

    let storedObject: Awaited<ReturnType<StorageService["getObject"]>>;

    try {
      storedObject = await this.storageService.getObject(storageKey);
    } catch {
      throw new NotFoundException("Verification document file is missing");
    }

    let parsedPdf: PdfParseResult;

    try {
      parsedPdf = await pdfParse(storedObject.body);
    } catch (error) {
      this.logger.error(
        "Student verification PDF parse failed",
        error instanceof Error ? error.stack : String(error)
      );

      throw new BadRequestException(
        error instanceof Error
          ? `Unable to extract text from PDF document: ${error.message}`
          : "Unable to extract text from PDF document"
      );
    }

    const extractedText = parsedPdf.text ?? "";

    return this.buildStudentCardAnalysis({
      verification,
      extractedText,
      pageCount: parsedPdf.numpages ?? null,
    });
  }

  private buildStudentCardAnalysis(input: {
    verification: StudentVerification;
    extractedText: string;
    pageCount: number | null;
  }) {
    const fields = this.extractStudentCardFields(input.extractedText);
    const verification = input.verification;
    const studentProfile = verification.studentProfile ?? null;
    const user = verification.user ?? null;

    const checks: VerificationTemplateCheck[] = [];

    const addCheck = (check: VerificationTemplateCheck) => {
      checks.push(check);
    };

    addCheck({
      code: "pdf_text_layer",
      label: "PDF text layer",
      status: input.extractedText.trim().length >= 30 ? "pass" : "fail",
      message:
        input.extractedText.trim().length >= 30
          ? "PDF contains extractable text."
          : "PDF text layer is empty or unreadable.",
      score: 15,
    });

    addCheck({
      code: "student_card_template",
      label: "Student card template",
      status: fields.hasStudentCardTitle ? "pass" : "warning",
      message: fields.hasStudentCardTitle
        ? "Student card title or expected labels were found."
        : "Student card title was not found, but fields may still be readable.",
      score: 15,
    });

    addCheck({
      code: "full_name_detected",
      label: "Full name detected",
      status: fields.fullName ? "pass" : "fail",
      message: fields.fullName
        ? `Detected full name: ${fields.fullName}`
        : "Full name was not detected.",
      score: 15,
    });

    const profileNameMatches = this.profileNameMatchesDetectedName({
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      detectedFullName: fields.fullName,
    });

    addCheck({
      code: "full_name_matches_profile",
      label: "Full name matches profile",
      status: !fields.fullName
        ? "warning"
        : profileNameMatches
          ? "pass"
          : "warning",
      message: !fields.fullName
        ? "Cannot compare name because parser did not detect it."
        : profileNameMatches
          ? "Detected name matches student profile."
          : "Detected name does not fully match profile. Manual review is recommended.",
      score: 10,
    });

    addCheck({
      code: "university_detected",
      label: "University detected",
      status: fields.university ? "pass" : "fail",
      message: fields.university
        ? `Detected university: ${fields.university}`
        : "University was not detected.",
      score: 15,
    });

    const universityMatches = this.universityMatchesProfile(
      input.extractedText,
      fields.university,
      studentProfile?.university ?? null
    );

    addCheck({
      code: "university_matches_profile",
      label: "University matches profile",
      status: !fields.university
        ? "warning"
        : universityMatches
          ? "pass"
          : "warning",
      message: !fields.university
        ? "Cannot compare university because it was not detected."
        : universityMatches
          ? "Detected university matches profile."
          : "Detected university differs from profile. Manual review is recommended.",
      score: 10,
    });

    addCheck({
      code: "degree_detected",
      label: "Degree detected",
      status: fields.degree ? "pass" : "warning",
      message: fields.degree
        ? `Detected degree: ${fields.degree}`
        : "Academic degree was not detected.",
      score: 10,
    });

    const degreeMatches = this.profileDegreeMatchesDetectedDegree(
      studentProfile?.degree ?? null,
      fields.degree
    );

    addCheck({
      code: "degree_matches_profile",
      label: "Degree matches profile",
      status: !fields.degree
        ? "warning"
        : degreeMatches
          ? "pass"
          : "warning",
      message: !fields.degree
        ? "Cannot compare degree because it was not detected."
        : degreeMatches
          ? "Detected degree matches profile."
          : "Detected degree differs from profile. Manual review is recommended.",
      score: 5,
    });

    addCheck({
      code: "program_group_detected",
      label: "Program group detected",
      status: fields.programGroup ? "pass" : "warning",
      message: fields.programGroup
        ? `Detected program group: ${fields.programGroup}`
        : "Program group was not detected.",
      score: 5,
    });

    const programGroupMatches = this.programGroupMatchesProfile(
      input.extractedText,
      fields.programGroup,
      studentProfile?.educationProgramGroup ?? null
    );

    addCheck({
      code: "program_group_matches_profile",
      label: "Program group matches profile",
      status: !fields.programGroup
        ? "warning"
        : programGroupMatches
          ? "pass"
          : "warning",
      message: !fields.programGroup
        ? "Cannot compare program group because it was not detected."
        : programGroupMatches
          ? "Detected program group matches selected education program group."
          : "Detected program group differs from selected profile program group. Manual review is recommended.",
      score: 10,
    });

    const profileCourse = studentProfile?.course
      ? String(studentProfile.course)
      : null;

    addCheck({
      code: "course_detected",
      label: "Course detected",
      status: fields.course ? "pass" : "fail",
      message: fields.course
        ? `Detected course: ${fields.course}`
        : "Course was not detected.",
      score: 10,
    });

    addCheck({
      code: "course_matches_profile",
      label: "Course matches profile",
      status: !fields.course
        ? "warning"
        : profileCourse === fields.course
          ? "pass"
          : "warning",
      message: !fields.course
        ? "Cannot compare course because it was not detected."
        : profileCourse === fields.course
          ? "Detected course matches profile."
          : "Detected course differs from profile. Manual review is recommended.",
      score: 5,
    });

    const profileAdmissionDate = this.normalizeDateValue(
      studentProfile?.admissionDate ?? null
    );

    addCheck({
      code: "admission_date_detected",
      label: "Admission date detected",
      status: fields.admissionDate ? "pass" : "warning",
      message: fields.admissionDate
        ? `Detected admission date: ${fields.admissionDate}`
        : "Admission date was not detected.",
      score: 10,
    });

    addCheck({
      code: "admission_date_matches_profile",
      label: "Admission date matches profile",
      status: !fields.admissionDate
        ? "warning"
        : this.datesMatch(profileAdmissionDate, fields.admissionDate)
          ? "pass"
          : "warning",
      message: !fields.admissionDate
        ? "Cannot compare admission date because it was not detected."
        : this.datesMatch(profileAdmissionDate, fields.admissionDate)
          ? "Detected admission date matches profile."
          : "Detected admission date differs from profile. Manual review is recommended.",
      score: 5,
    });

    const maxScore = checks.reduce((sum, check) => sum + check.score, 0);
    const actualScore = checks.reduce((sum, check) => {
      if (check.status === "pass") {
        return sum + check.score;
      }

      if (check.status === "warning") {
        return sum + Math.floor(check.score / 2);
      }

      return sum;
    }, 0);

    const confidence = Math.round((actualScore / maxScore) * 100);
    const failCount = checks.filter((check) => check.status === "fail").length;
    const warningCount = checks.filter(
      (check) => check.status === "warning"
    ).length;

    const riskLevel =
      confidence >= 80 && failCount === 0
        ? "low"
        : confidence >= 55 && failCount <= 1
          ? "medium"
          : "high";

    const recommendation =
      riskLevel === "low"
        ? "approve"
        : riskLevel === "medium"
          ? "manual_review"
          : "reject";

    return {
      recommendation,
      confidence,
      riskLevel,
      pageCount: input.pageCount,
      extractedFields: fields,
      checks: checks.map((check) => ({
        code: check.code,
        label: check.label,
        status: check.status,
        message: check.message,
      })),
      summary:
        recommendation === "approve"
          ? "Document structure and extracted fields look consistent with the student profile."
          : recommendation === "manual_review"
            ? "Document has enough information, but some fields require manual review."
            : "Document does not provide enough reliable evidence for automatic recommendation.",
      suggestedApproveComment:
        "AI/OCR assistant: student card data is readable and matches the profile.",
      suggestedRejectComment:
        "AI/OCR assistant: document data is incomplete, unreadable, or does not match the profile.",
      debug: {
        maxScore,
        actualScore,
        failCount,
        warningCount,
      },
    };
  }

  private extractStudentCardFields(rawText: string): ExtractedStudentCardFields {
    const lines = rawText
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const fullText = lines.join(" ");
    const normalizedText = this.normalizeForCompare(fullText);

    const hasStudentCardTitle =
      normalizedText.includes("студент") ||
      normalizedText.includes("студенттік") ||
      normalizedText.includes("студенческий") ||
      normalizedText.includes("оку курсы") ||
      normalizedText.includes("оқу курсы") ||
      normalizedText.includes("курс обучения");

    const degree = this.extractDegree(lines, fullText);
    const admissionDate = this.extractAdmissionDate(lines, fullText);
    const programLine =
      lines.find((line) => /\b[A-ZА-Я]\d{3}\b/u.test(line)) ?? null;

    const course = this.extractCourse(lines, fullText);
    const fullName = this.extractFullName(lines);
    const university = this.extractUniversity(lines);

    return {
      fullName,
      university,
      degree,
      programGroup: programLine,
      course,
      admissionDate,
      hasStudentCardTitle,
      rawTextPreview: rawText.replace(/\s+/g, " ").trim().slice(0, 2500),
    };
  }

  private extractFullName(lines: string[]): string | null {
    const blockedKeywords = [
      "жжокб",
      "атауы",
      "наименование",
      "овпо",
      "университет",
      "академ",
      "дәреже",
      "степень",
      "білім",
      "образователь",
      "курс",
      "түсу",
      "тусу",
      "дата",
      "бакалавр",
      "магистр",
      "докторантура",
    ];

    return (
      lines.find((line) => {
        const normalized = this.normalizeForCompare(line);
        const words = line.split(" ").filter(Boolean);

        return (
          words.length >= 2 &&
          words.length <= 5 &&
          !line.includes("/") &&
          !blockedKeywords.some((keyword) => normalized.includes(keyword)) &&
          /^[A-ZА-ЯӘІҢҒҮҰҚӨҺ][A-Za-zА-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ'’-]+/u.test(
            line
          )
        );
      }) ?? null
    );
  }

  private extractUniversity(lines: string[]): string | null {
    return (
      lines.find((line) => {
        const normalized = this.normalizeForCompare(line);

        return (
          normalized.includes("университет") ||
          normalized.includes("university") ||
          normalized.includes("сатпаев") ||
          normalized.includes("сэтбаев") ||
          normalized.includes("satbayev")
        );
      }) ?? null
    );
  }

  private extractCourse(lines: string[], fullText: string): string | null {
    const courseLabelIndex = lines.findIndex((line) => {
      const normalized = this.normalizeForCompare(line);

      return (
        normalized.includes("курс обучения") ||
        normalized.includes("оқу курсы") ||
        normalized.includes("оку курсы")
      );
    });

    if (courseLabelIndex >= 0) {
      const nextLine = lines
        .slice(courseLabelIndex + 1, courseLabelIndex + 4)
        .find((line) => /^[1-6]$/.test(line.trim()));

      if (nextLine) {
        return nextLine.trim();
      }
    }

    const courseMatch = fullText.match(
      /(?:курс обучения|оқу курсы|оку курсы|курс)[^\d]{0,30}([1-6])/i
    );

    return courseMatch?.[1] ?? null;
  }

  private extractDegree(lines: string[], fullText: string): string | null {
    const directMatch = fullText.match(
      /\b(Бакалавр|Магистр|Докторантура|Bachelor|Master|PhD)\b/i
    );

    if (directMatch?.[1]) {
      return directMatch[1];
    }

    const degreeLabelIndex = lines.findIndex((line) => {
      const normalized = this.normalizeForCompare(line);

      return (
        normalized.includes("академиялық дәреже") ||
        normalized.includes("академиялык дәреже") ||
        normalized.includes("академическая степень") ||
        normalized.includes("academic degree") ||
        normalized.includes("дәреже") ||
        normalized.includes("степень")
      );
    });

    if (degreeLabelIndex >= 0) {
      const nextDegreeLine = lines
        .slice(degreeLabelIndex + 1, degreeLabelIndex + 6)
        .find((line) =>
          /\b(Бакалавр|Магистр|Докторантура|Bachelor|Master|PhD)\b/i.test(line)
        );

      if (nextDegreeLine) {
        const match = nextDegreeLine.match(
          /\b(Бакалавр|Магистр|Докторантура|Bachelor|Master|PhD)\b/i
        );

        return match?.[1] ?? nextDegreeLine.trim();
      }
    }

    return null;
  }

  private profileNameMatchesDetectedName(input: {
    firstName: string | null;
    lastName: string | null;
    detectedFullName: string | null;
  }): boolean {
    if (!input.firstName || !input.lastName || !input.detectedFullName) {
      return false;
    }

    const documentTokens = input.detectedFullName
      .split(/s+/)
      .flatMap((token) => this.tokenVariants(token));

    const requiredTokens = [input.lastName, input.firstName].flatMap((token) =>
      this.tokenVariants(token)
    );

    return requiredTokens.every((requiredToken) =>
      documentTokens.some(
        (documentToken) =>
          documentToken === requiredToken ||
          documentToken.includes(requiredToken) ||
          requiredToken.includes(documentToken)
      )
    );
  }

  private tokenVariants(value: string): string[] {
    const normalized = this.normalizeForCompare(value).replace(/s+/g, "");
    const latin = this.normalizeForCompare(this.cyrillicToLatin(value)).replace(
      /s+/g,
      ""
    );

    return [...new Set([normalized, latin].filter(Boolean))];
  }

  private cyrillicToLatin(value: string): string {
    const map: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "i",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sh",
      ы: "y",
      э: "e",
      ю: "yu",
      я: "ya",
      ә: "a",
      і: "i",
      ң: "n",
      ғ: "g",
      ү: "u",
      ұ: "u",
      қ: "k",
      ө: "o",
      һ: "h",
      ь: "",
      ъ: "",
    };

    return value
      .toLowerCase()
      .split("")
      .map((char) => map[char] ?? char)
      .join("");
  }

  private universityMatchesProfile(
    fullDocumentText: string,
    detectedUniversity: string | null,
    university: University | null
  ): boolean {
    if (!university) {
      return false;
    }

    const documentText = this.normalizeForCompare(
      [fullDocumentText, detectedUniversity].filter(Boolean).join(" ")
    );

    const candidates = [
      university.name,
      university.shortName,
      university.officialNameRu,
      university.officialNameKz,
      university.officialNameEn,
      ...(university.documentKeywords ?? []),
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => this.normalizeForCompare(value))
      .filter((value) => value.length >= 3);

    return candidates.some(
      (candidate) =>
        documentText.includes(candidate) || candidate.includes(documentText)
    );
  }

  private programGroupMatchesProfile(
    fullDocumentText: string,
    detectedProgramGroup: string | null,
    program: EducationProgramGroup | null
  ): boolean {
    if (!program) {
      return false;
    }

    const documentText = this.normalizeForCompare(
      [fullDocumentText, detectedProgramGroup].filter(Boolean).join(" ")
    );

    const code = this.normalizeForCompare(program.code);
    const names = [program.nameRu, program.nameKz, program.nameEn]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => this.normalizeForCompare(value));

    return (
      documentText.includes(code) ||
      names.some((name) => documentText.includes(name))
    );
  }

  private extractAdmissionDate(lines: string[], fullText: string): string | null {
    const dateRegex = /d{1,2}[./-]d{1,2}[./-]d{4}/;

    const labelIndex = lines.findIndex((line) => {
      const normalized = this.normalizeForCompare(line);

      return (
        normalized.includes("түсу күні") ||
        normalized.includes("тусу күні") ||
        normalized.includes("түсу куні") ||
        normalized.includes("дата поступления") ||
        normalized.includes("admission date")
      );
    });

    if (labelIndex >= 0) {
      const nearbyText = lines.slice(labelIndex, labelIndex + 6).join(" ");
      const nearbyMatch = nearbyText.match(dateRegex);

      if (nearbyMatch?.[0]) {
        return nearbyMatch[0];
      }
    }

    const directMatch = fullText.match(
      /(?:түсу күні|тусу күні|дата поступления|admission date)[^0-9]{0,100}(d{1,2}[./-]d{1,2}[./-]d{4})/i
    );

    if (directMatch?.[1]) {
      return directMatch[1];
    }

    return null;
  }


  private normalizeForCompare(value: string): string {
    return value
      .toLowerCase()
      .replace(/ё/g, "е")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private datesMatch(
    profileDate: string | null,
    detectedDate: string | null
  ): boolean {
    if (!profileDate || !detectedDate) {
      return false;
    }

    const normalizedProfileDate = this.normalizeDateValue(profileDate);
    const normalizedDetectedDate = this.normalizeDateValue(detectedDate);

    return Boolean(
      normalizedProfileDate &&
        normalizedDetectedDate &&
        normalizedProfileDate === normalizedDetectedDate
    );
  }

  private normalizeDateValue(value: string | Date | null): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return this.formatDateAsDdMmYyyy(value);
    }

    const trimmed = value.trim();

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    const isoDateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (isoDateOnlyMatch) {
      return `${isoDateOnlyMatch[3]}.${isoDateOnlyMatch[2]}.${isoDateOnlyMatch[1]}`;
    }

    const isoDateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);

    if (isoDateTimeMatch) {
      return `${isoDateTimeMatch[3]}.${isoDateTimeMatch[2]}.${isoDateTimeMatch[1]}`;
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return this.formatDateAsDdMmYyyy(parsed);
    }

    return trimmed;
  }

  private formatDateAsDdMmYyyy(value: Date): string {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = String(value.getFullYear());

    return `${day}.${month}.${year}`;
  }

  private profileDegreeMatchesDetectedDegree(
    profileDegree: string | null,
    detectedDegree: string | null
  ): boolean {
    if (!profileDegree || !detectedDegree) {
      return false;
    }

    const normalizedProfile = this.normalizeForCompare(profileDegree);
    const normalizedDetected = this.normalizeForCompare(detectedDegree);

    const degreeAliases: Record<string, string[]> = {
      bachelor: ["бакалавр", "bachelor"],
      master: ["магистр", "master"],
      phd: ["докторантура", "phd", "доктор"],
      other: [],
    };

    const aliases = degreeAliases[normalizedProfile] ?? [normalizedProfile];

    return aliases.some((alias) => normalizedDetected.includes(alias));
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
    if (!studentProfile.educationProgramGroupId) missingFields.push("Группа образовательных программ");
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

  private async storePdfFile(
    userId: string,
    file: UploadedPdfFile
  ): Promise<string> {
    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, "");
    const fileName = `${randomUUID()}.pdf`;
    const storageKey = `student-verifications/${safeUserId}/${fileName}`;

    await this.storageService.uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: "application/pdf",
    });

    return storageKey;
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