import React, { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { courses, students, certificates, templates } from '../../lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Spinner } from '../../components/ui/spinner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog'
import { useToast } from '../../components/ui/toast'
import type { Course, CertificateTemplate } from '../../types'

const STEPS = ['Select Course', 'Student Details', 'Preview', 'Complete']

interface FormData {
  courseId: string
  templateId: string
  studentId?: string
  createNewStudent: boolean
  fullName: string
  enrollmentNumber: string
  startDate: string
  completionDate: string
  trainingDuration: string
  issueDate: string
  authorizedSignatory: string
  batchNumber: string
  specialization: string
  assessmentResult: string
  grade: string
  studentEmail: string
  studentPhone: string
}

export default function CreateCertificatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [category, setCategory] = useState<'electrical' | 'software'>('electrical')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [issuedCertId, setIssuedCertId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitted = useRef(false)

  const [form, setForm] = useState<FormData>({
    courseId: '',
    templateId: '',
    createNewStudent: false,
    fullName: '',
    enrollmentNumber: '',
    startDate: '',
    completionDate: '',
    trainingDuration: '',
    issueDate: new Date().toISOString().slice(0, 10),
    authorizedSignatory: '',
    batchNumber: '',
    specialization: '',
    assessmentResult: '',
    grade: '',
    studentEmail: '',
    studentPhone: '',
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courses.list().then((r) => r.data.data),
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students-search', studentSearch],
    queryFn: () => students.list({ search: studentSearch, limit: 8 }).then((r) => r.data),
    enabled: studentSearch.length >= 2,
  })

  const setField = (key: keyof FormData, val: string | boolean) => {
    setForm((f) => ({ ...f, [key]: val }))
  }

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course)
    setField('courseId', course.id)
    // load template for this course
    try {
      const res = await courses.getTemplates(course.id)
      const tpl = res.data.data[0]
      if (tpl) {
        setSelectedTemplate(tpl)
        setField('templateId', tpl.id)
      }
    } catch {
      // no template
    }
    setStep(1)
  }

  const handlePreview = async () => {
    if (!selectedTemplate) {
      setStep(2)
      return
    }
    try {
      const res = await templates.preview(selectedTemplate.id, {
        fullName: form.fullName,
        courseName: selectedCourse?.name,
        completionDate: form.completionDate,
        duration: form.trainingDuration,
        issueDate: form.issueDate,
        signatory: form.authorizedSignatory,
      })
      const url = URL.createObjectURL(res.data)
      setPreviewUrl(url)
    } catch {
      setPreviewUrl(null)
    }
    setStep(2)
  }

  const saveDraft = async () => {
    const payload = {
      courseId: form.courseId,
      templateId: form.templateId,
      studentId: form.studentId,
      createNewStudent: form.createNewStudent,
      studentData: form.createNewStudent
        ? {
            fullName: form.fullName,
            studentId: form.enrollmentNumber,
            email: form.studentEmail,
            phone: form.studentPhone,
          }
        : undefined,
      enrollmentNumber: form.enrollmentNumber,
      startDate: form.startDate,
      completionDate: form.completionDate,
      trainingDuration: form.trainingDuration,
      issueDate: form.issueDate,
      authorizedSignatory: form.authorizedSignatory,
      batchNumber: form.batchNumber || undefined,
      specialization: form.specialization || undefined,
      assessmentResult: form.assessmentResult || undefined,
      grade: form.grade || undefined,
    }
    if (draftId) {
      await certificates.updateDraft(draftId, payload)
      return draftId
    } else {
      const res = await certificates.createDraft(payload as Parameters<typeof certificates.createDraft>[0])
      setDraftId(res.data.data.id)
      return res.data.data.id
    }
  }

  const handleSaveDraft = async () => {
    try {
      await saveDraft()
      toast.success('Draft saved')
      navigate('/admin/certificates')
    } catch {
      toast.error('Failed to save draft')
    }
  }

  const handleIssue = async () => {
    if (submitted.current || isSubmitting) return
    submitted.current = true
    setIsSubmitting(true)
    try {
      const id = await saveDraft()
      const res = await certificates.issue(id)
      setIssuedCertId(res.data.data.certificateId)
      setConfirmOpen(false)
      setSuccessOpen(true)
    } catch {
      toast.error('Failed to issue certificate')
      submitted.current = false
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCourses = (coursesData ?? []).filter((c) => c.category === category && c.isActive)

  const step1Valid = !!selectedCourse
  const step2Valid = form.fullName && form.completionDate && form.issueDate && form.authorizedSignatory

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Create Certificate</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? 'text-[#1e3a5f]' : 'text-gray-400'}`}>
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i < step
                    ? 'bg-[#1e3a5f] text-white'
                    : i === step
                    ? 'bg-[#d97706] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Course */}
      {step === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-6">
              {(['electrical', 'software'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    category === cat
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {coursesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filteredCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No courses in this category</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseSelect(course)}
                    className={`text-left rounded-lg border-2 p-4 transition-all ${
                      selectedCourse?.id === course.id
                        ? 'border-[#d97706] bg-amber-50'
                        : 'border-gray-200 hover:border-[#1e3a5f]'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{course.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{course.code} &bull; {course.defaultDuration}</p>
                    <Badge variant={course.category === 'electrical' ? 'warning' : 'default'} className="mt-2">
                      {course.category}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Student Details */}
      {step === 1 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-semibold text-gray-900">Course: {selectedCourse?.name}</h2>
            </div>

            {/* Student lookup */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setField('createNewStudent', false)}
                  className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${!form.createNewStudent ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Existing Student
                </button>
                <button
                  onClick={() => setField('createNewStudent', true)}
                  className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${form.createNewStudent ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  New Student
                </button>
              </div>

              {!form.createNewStudent ? (
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search student by name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                  {studentsData && studentsData.data.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {studentsData.data.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                          onClick={() => {
                            setField('studentId', s.id)
                            setField('fullName', s.fullName)
                            setStudentSearch(s.fullName)
                          }}
                        >
                          <p className="font-medium">{s.fullName}</p>
                          <p className="text-xs text-gray-500">{s.studentId}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Student Email</label>
                    <Input value={form.studentEmail} onChange={(e) => setField('studentEmail', e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Phone</label>
                    <Input value={form.studentPhone} onChange={(e) => setField('studentPhone', e.target.value)} placeholder="Phone number" />
                  </div>
                </div>
              )}
            </div>

            {/* Required fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Full Name *</label>
                <Input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="Student full name" required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Enrollment / Student ID *</label>
                <Input value={form.enrollmentNumber} onChange={(e) => setField('enrollmentNumber', e.target.value)} placeholder="e.g. SSR-2024-001" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Course Start Date *</label>
                <Input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Completion Date *</label>
                <Input type="date" value={form.completionDate} onChange={(e) => setField('completionDate', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Training Duration *</label>
                <Input value={form.trainingDuration} onChange={(e) => setField('trainingDuration', e.target.value)} placeholder={selectedCourse?.defaultDuration ?? 'e.g. 3 months'} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Issue Date *</label>
                <Input type="date" value={form.issueDate} onChange={(e) => setField('issueDate', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Authorized Signatory *</label>
                <Input value={form.authorizedSignatory} onChange={(e) => setField('authorizedSignatory', e.target.value)} placeholder="Name of signatory" />
              </div>
            </div>

            {/* Optional fields */}
            <div className="border-t pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Optional Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Batch Number</label>
                  <Input value={form.batchNumber} onChange={(e) => setField('batchNumber', e.target.value)} placeholder="Batch / Group" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Specialization</label>
                  <Input value={form.specialization} onChange={(e) => setField('specialization', e.target.value)} placeholder="Specialization area" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Assessment Result</label>
                  <Input value={form.assessmentResult} onChange={(e) => setField('assessmentResult', e.target.value)} placeholder="Pass / Fail / Score" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Grade</label>
                  <Input value={form.grade} onChange={(e) => setField('grade', e.target.value)} placeholder="A / B / C" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={handlePreview} disabled={!step2Valid}>
                Next: Preview <ChevronRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 2 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Certificate Preview</h2>

            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 min-h-[320px] flex items-center justify-center">
              {previewUrl ? (
                <iframe src={previewUrl} className="w-full h-96" title="Certificate Preview" />
              ) : (
                <div className="text-center text-gray-400 py-16">
                  <p className="text-sm">Preview not available</p>
                  <p className="text-xs mt-1">The template preview could not be generated</p>
                </div>
              )}
            </div>

            {/* Details summary */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm space-y-2">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <span className="text-gray-500">Student:</span><span className="font-medium">{form.fullName}</span>
                <span className="text-gray-500">Course:</span><span>{selectedCourse?.name}</span>
                <span className="text-gray-500">Duration:</span><span>{form.trainingDuration}</span>
                <span className="text-gray-500">Completion:</span><span>{form.completionDate}</span>
                <span className="text-gray-500">Issue Date:</span><span>{form.issueDate}</span>
                <span className="text-gray-500">Signatory:</span><span>{form.authorizedSignatory}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Actions */}
      {step === 3 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Finalize Certificate</h2>
            <p className="text-sm text-gray-500">
              Ready to create a certificate for <strong>{form.fullName}</strong> in{' '}
              <strong>{selectedCourse?.name}</strong>.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save as Draft
              </Button>
              <Button variant="golden" onClick={() => setConfirmOpen(true)}>
                Create &amp; Issue Certificate
              </Button>
              <Button variant="ghost" onClick={() => navigate('/admin/certificates')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm issue dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Certificate Issuance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Issue certificate for <strong>{form.fullName}</strong> in course{' '}
            <strong>{selectedCourse?.name}</strong>? This cannot be undone without revocation.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="golden"
              size="sm"
              onClick={handleIssue}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={successOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} /> Certificate Issued
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Certificate has been issued successfully.</p>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-xs text-gray-500">Certificate ID</p>
              <p className="font-mono font-bold text-green-800 text-lg mt-0.5">{issuedCertId}</p>
            </div>
            <p className="text-xs text-gray-500">
              Public verification URL:{' '}
              <a
                href={`/verify/${issuedCertId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#1e3a5f] underline"
              >
                {window.location.origin}/verify/{issuedCertId}
              </a>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/certificates')}
            >
              View All Certificates
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setSuccessOpen(false)
                navigate('/admin/certificates/new')
                setStep(0)
                setSelectedCourse(null)
                setDraftId(null)
                submitted.current = false
              }}
            >
              Create Another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
