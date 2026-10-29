import axios from 'axios'
import type {
  Admin,
  Course,
  Student,
  CertificateTemplate,
  Certificate,
  DashboardStats,
  RecentCertificate,
  PublicCertificate,
  ApiResponse,
  PaginatedResponse,
  VerificationRecord,
} from '../types'

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<{ admin: Admin }>>('/auth/login', { email, password }),
  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),
  me: () => apiClient.get<ApiResponse<{ admin: Admin }>>('/auth/me'),
}

// Courses
export const courses = {
  list: () => apiClient.get<ApiResponse<Course[]>>('/courses'),
  create: (data: Partial<Course>) => apiClient.post<ApiResponse<Course>>('/courses', data),
  update: (id: string, data: Partial<Course>) =>
    apiClient.put<ApiResponse<Course>>(`/courses/${id}`, data),
  getById: (id: string) => apiClient.get<ApiResponse<Course>>(`/courses/${id}`),
  getTemplates: (id: string) =>
    apiClient.get<ApiResponse<CertificateTemplate[]>>(`/courses/${id}/templates`),
}

// Students
export interface StudentListParams {
  search?: string
  course?: string
  isCompleted?: boolean
  page?: number
  limit?: number
}

export const students = {
  list: (params?: StudentListParams) =>
    apiClient.get<PaginatedResponse<Student>>('/students', { params }),
  create: (data: Partial<Student>) => apiClient.post<ApiResponse<Student>>('/students', data),
  getById: (id: string) => apiClient.get<ApiResponse<Student>>(`/students/${id}`),
  update: (id: string, data: Partial<Student>) =>
    apiClient.put<ApiResponse<Student>>(`/students/${id}`, data),
  importCSV: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ created: number; errors: unknown[] }>>('/students/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Templates
export const templates = {
  list: () => apiClient.get<ApiResponse<CertificateTemplate[]>>('/templates'),
  create: (data: Partial<CertificateTemplate>) =>
    apiClient.post<ApiResponse<CertificateTemplate>>('/templates', data),
  update: (id: string, data: Partial<CertificateTemplate>) =>
    apiClient.put<ApiResponse<CertificateTemplate>>(`/templates/${id}`, data),
  getById: (id: string) => apiClient.get<ApiResponse<CertificateTemplate>>(`/templates/${id}`),
  preview: (id: string, data?: Record<string, unknown>) =>
    apiClient.post<Blob>(`/templates/${id}/preview`, data, { responseType: 'blob' }),
}

// Certificates
export interface CertificateListParams {
  search?: string
  status?: string
  category?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CertificateDraftData {
  studentId?: string
  courseId: string
  templateId: string
  studentName?: string
  studentEnrollmentId?: string
  startDate?: string
  completionDate?: string
  trainingDuration?: string
  issueDate?: string
  authorizedSignatory?: string
  batchNumber?: string
  specialization?: string
  assessmentResult?: string
  grade?: string
  createNewStudent?: boolean
  studentData?: Partial<Student>
}

export const certificates = {
  list: (params?: CertificateListParams) =>
    apiClient.get<PaginatedResponse<Certificate>>('/certificates', { params }),
  createDraft: (data: CertificateDraftData) =>
    apiClient.post<ApiResponse<Certificate>>('/certificates', data),
  updateDraft: (id: string, data: Partial<CertificateDraftData>) =>
    apiClient.put<ApiResponse<Certificate>>(`/certificates/${id}`, data),
  issue: (id: string) =>
    apiClient.post<ApiResponse<Certificate>>(`/certificates/${id}/issue`),
  getPdf: (id: string) =>
    apiClient.get<Blob>(`/certificates/${id}/pdf`, { responseType: 'blob' }),
  revoke: (id: string, reason: string) =>
    apiClient.post<ApiResponse<Certificate>>(`/certificates/${id}/revoke`, { reason }),
  reissue: (id: string, data?: Partial<CertificateDraftData>) =>
    apiClient.post<ApiResponse<Certificate>>(`/certificates/${id}/reissue`, data),
  bulkIssue: (items: { certificateId: string }[]) =>
    apiClient.post<ApiResponse<Certificate[]>>('/certificates/bulk-issue', { items }),
}

// Dashboard
export const dashboard = {
  stats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  recentCertificates: () =>
    apiClient.get<ApiResponse<RecentCertificate[]>>('/dashboard/recent-certificates'),
}

// Public verification
export const publicApi = {
  verifyCertificate: (certificateId: string) =>
    apiClient.get<ApiResponse<PublicCertificate>>(`/public/verify/${certificateId}`),
}

// Verification records / audit log
export const verificationRecords = {
  list: (params?: { action?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<VerificationRecord>>('/verification-records', { params }),
}

export default apiClient
