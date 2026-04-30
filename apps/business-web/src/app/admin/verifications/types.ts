export type VerificationStatus = "pending" | "approved" | "rejected" | "expired";
export type StatusFilter = "all" | VerificationStatus;

export type VerificationItem = {
  id: string;
  method: string;
  status: VerificationStatus;
  submittedEmail: string | null;
  documentType: string | null;
  documentUrl: string | null;
  reviewComment: string | null;
  reviewedAt: string | Date | null;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  student: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    status: string;
  } | null;
  studentProfile: {
    id: string;
    verificationStatus: string;
    studentEmail: string | null;
    degree: string | null;
    specialty: string | null;
    course: number | null;
    admissionDate: string | null;
    verifiedAt: string | Date | null;
    verificationExpiresAt: string | Date | null;
    university: {
      id: string;
      name: string;
      shortName: string | null;
      city: string | null;
      country: string;
      status: string;
    } | null;
  } | null;
  reviewedBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
};

export type VerificationMetrics = {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
};

export type VerificationList = {
  total: number;
  metrics: VerificationMetrics;
  items: VerificationItem[];
};

export type VerificationAnalysis = {
  recommendation: "approve" | "manual_review" | "reject";
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  pageCount: number | null;
  summary: string;
  suggestedApproveComment: string;
  suggestedRejectComment: string;
  extractedFields: {
    fullName: string | null;
    university: string | null;
    degree: string | null;
    programGroup: string | null;
    course: string | null;
    admissionDate: string | null;
    hasStudentCardTitle: boolean;
    rawTextPreview: string;
  };
  checks: Array<{
    code: string;
    label: string;
    status: "pass" | "warning" | "fail";
    message: string;
  }>;
};