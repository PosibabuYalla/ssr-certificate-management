import { Types } from 'mongoose';

// ─── Enums / Literal Types ────────────────────────────────────────────────────

export type CertificateStatus = 'draft' | 'issued' | 'revoked';
export type CourseCategory = 'electrical' | 'software';
export type AdminRole = 'admin' | 'superadmin';
export type CompletionStatus = 'enrolled' | 'completed' | 'dropped';
export type Orientation = 'landscape' | 'portrait';

export const CATEGORY_PREFIXES: Record<string, string> = {
  electrical: 'SSR-EL',
  software: 'SSR-SW',
  default: 'SSR-WS',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

export interface IEnrollment {
  courseId: Types.ObjectId;
  batchNumber: string;
  enrollmentDate: Date;
  completionStatus: CompletionStatus;
  completedAt?: Date;
}

export interface IStudent {
  _id: Types.ObjectId;
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  enrollments: IEnrollment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse {
  _id: Types.ObjectId;
  courseCode: string;
  name: string;
  category: CourseCategory;
  description?: string;
  defaultDuration?: string;
  durationUnit?: string;
  certificatePrefix: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISignatory {
  name: string;
  title: string;
  signatureImagePath?: string;
}

export interface ICertificateTemplate {
  _id: Types.ObjectId;
  templateCode: string;
  courseId: Types.ObjectId;
  name: string;
  orientation: Orientation;
  dimensions: { width: number; height: number };
  designConfig?: Record<string, unknown>;
  defaultWording?: string;
  signatories: ISignatory[];
  logoPath?: string;
  version: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICertificate {
  _id: Types.ObjectId;
  certificateId: string;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  templateId?: Types.ObjectId;
  templateVersion?: number;
  studentNameSnapshot: string;
  courseNameSnapshot: string;
  trainingStartDate?: Date;
  completionDate?: Date;
  trainingDuration?: string;
  issueDate?: Date;
  batchNumber?: string;
  specialization?: string;
  assessmentResult?: string;
  grade?: string;
  additionalRemarks?: string;
  certificateDataSnapshot?: Record<string, unknown>;
  publicVerificationPath?: string;
  pdfPath?: string;
  status: CertificateStatus;
  createdBy: Types.ObjectId;
  issuedBy?: Types.ObjectId;
  revokedAt?: Date;
  revocationReason?: string;
  previousCertificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ICounter {
  _id: Types.ObjectId;
  name: string;
  seq: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Public Verification Response ─────────────────────────────────────────────

export interface PublicCertificateResponse {
  certificateId: string;
  studentName: string;
  courseName: string;
  courseCategory: string;
  trainingDuration?: string;
  completionDate?: Date;
  issueDate?: Date;
  status: CertificateStatus;
  revokedAt?: Date;
  signatoryName?: string;
  signatoryTitle?: string;
  publicVerificationPath?: string;
}
