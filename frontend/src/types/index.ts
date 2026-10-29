export interface Admin {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface Course {
  id: string
  name: string
  code: string
  prefix: string
  category: 'electrical' | 'software'
  description?: string
  defaultDuration: string
  isActive: boolean
  templateId?: string
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  studentId: string
  fullName: string
  email?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
  certificatesCount?: number
  enrollments?: Enrollment[]
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  course?: Course
  startDate: string
  completionDate?: string
  isCompleted: boolean
}

export interface CertificateTemplate {
  id: string
  courseId: string
  course?: Course
  orientation: 'landscape' | 'portrait'
  version: number
  isActive: boolean
  defaultWording?: string
  signatories: Signatory[]
  backgroundImagePath?: string
  createdAt: string
  updatedAt: string
}

export interface Signatory {
  name: string
  title: string
  order: number
}

export type CertificateStatus = 'draft' | 'issued' | 'revoked'

export interface Certificate {
  id: string
  certificateId: string
  studentId: string
  student?: Student
  courseId: string
  course?: Course
  templateId: string
  template?: CertificateTemplate
  status: CertificateStatus
  issueDate?: string
  startDate?: string
  completionDate?: string
  trainingDuration?: string
  batchNumber?: string
  specialization?: string
  assessmentResult?: string
  grade?: string
  authorizedSignatory?: string
  enrollmentNumber?: string
  revokedAt?: string
  revokedReason?: string
  pdfPath?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalCertificates: number
  thisMonth: number
  totalStudents: number
  pendingIssuance: number
  validCertificates: number
  revokedCertificates: number
  byCategory: {
    electrical: number
    software: number
  }
}

export interface RecentCertificate {
  id: string
  certificateId: string
  studentName: string
  courseName: string
  issueDate?: string
  status: CertificateStatus
  studentId: string
  courseId: string
}

export interface PublicCertificate {
  certificateId: string
  studentName: string
  courseName: string
  courseCategory: 'electrical' | 'software'
  duration?: string
  completionDate?: string
  issueDate?: string
  signatoryName?: string
  signatoryTitle?: string
  status: CertificateStatus
  revokedAt?: string
  pdfUrl?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface VerificationRecord {
  id: string
  action: string
  entity: string
  entityId: string
  actorId?: string
  actorName?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}
