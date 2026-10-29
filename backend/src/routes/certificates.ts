import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import Certificate from '../models/Certificate';
import Student from '../models/Student';
import Course from '../models/Course';
import CertificateTemplate from '../models/CertificateTemplate';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateCertificateId } from '../utils/certificateId';
import { logAudit } from '../utils/audit';
import { generateCertificatePDF } from '../services/pdfService';
import config from '../config';

const router = Router();

const draftSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  templateId: z.string().optional(),
  trainingStartDate: z.string().optional(),
  completionDate: z.string().optional(),
  trainingDuration: z.string().optional(),
  batchNumber: z.string().optional(),
  specialization: z.string().optional(),
  assessmentResult: z.string().optional(),
  grade: z.string().optional(),
  additionalRemarks: z.string().optional(),
});

const updateDraftSchema = draftSchema.partial();

const revokeSchema = z.object({
  revocationReason: z.string().min(1, 'Revocation reason is required'),
});

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function buildAndIssueCertificate(
  certId: string,
  adminId: string,
  adminName: string
): Promise<void> {
  const cert = await Certificate.findById(certId)
    .populate<{ studentId: { fullName: string } }>('studentId', 'fullName')
    .populate<{ courseId: { name: string; category: string; certificatePrefix: string } }>('courseId', 'name category certificatePrefix')
    .populate<{ templateId: { signatories: Array<{ name: string; title: string }> } }>('templateId', 'signatories');

  if (!cert) throw new Error('Certificate not found');

  const student = cert.studentId as unknown as { fullName: string };
  const course = cert.courseId as unknown as { name: string; category: string };
  const template = cert.templateId as unknown as { signatories: Array<{ name: string; title: string }> } | null;

  const signatory = template?.signatories?.[0] ?? { name: 'Director', title: 'SSR Institute' };
  const issueDate = new Date();
  const verPath = `/verify/${cert.certificateId}`;
  const filename = `${cert.certificateId}.pdf`;
  const pdfOutputPath = path.join(config.UPLOAD_DIR, 'certificates', filename);

  const pdfData = {
    certificateId: cert.certificateId,
    studentName: cert.studentNameSnapshot,
    courseName: cert.courseNameSnapshot,
    courseCategory: course.category,
    trainingDuration: cert.trainingDuration ?? '',
    startDate: cert.trainingStartDate ? formatDate(cert.trainingStartDate) : '',
    completionDate: cert.completionDate ? formatDate(cert.completionDate) : '',
    issueDate: formatDate(issueDate),
    signatoryName: signatory.name,
    signatoryTitle: signatory.title,
    publicVerificationUrl: `${config.PUBLIC_BASE_URL}${verPath}`,
  };

  await generateCertificatePDF(pdfData, pdfOutputPath);

  await Certificate.findByIdAndUpdate(certId, {
    status: 'issued',
    issueDate,
    issuedBy: adminId,
    pdfPath: pdfOutputPath,
    publicVerificationPath: verPath,
    certificateDataSnapshot: pdfData,
  });

  await logAudit({
    actorId: adminId,
    actorName: adminName,
    action: 'certificate.issued',
    entityType: 'Certificate',
    entityId: cert.certificateId,
    metadata: { studentName: student.fullName, courseName: course.name },
  });
}

// GET /api/certificates — list with filters
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || '';
    const statusFilter = (req.query.status as string) || '';
    const courseFilter = (req.query.courseId as string) || '';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { certificateId: { $regex: search, $options: 'i' } },
        { studentNameSnapshot: { $regex: search, $options: 'i' } },
      ];
    }
    if (statusFilter) query.status = statusFilter;
    if (courseFilter) query.courseId = courseFilter;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      query.issueDate = dateFilter;
    }

    const [total, certs] = await Promise.all([
      Certificate.countDocuments(query),
      Certificate.find(query)
        .populate('studentId', 'fullName studentId')
        .populate('courseId', 'name category')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: certs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[certificates/list]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/drafts — create draft
router.post('/drafts', requireAuth, validate(draftSchema), async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    const course = await Course.findById(req.body.courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    const year = new Date().getFullYear();
    const certificateId = await generateCertificateId(course.category, year);

    const cert = await Certificate.create({
      certificateId,
      studentId: student._id,
      courseId: course._id,
      templateId: req.body.templateId || undefined,
      studentNameSnapshot: student.fullName,
      courseNameSnapshot: course.name,
      trainingStartDate: req.body.trainingStartDate ? new Date(req.body.trainingStartDate) : undefined,
      completionDate: req.body.completionDate ? new Date(req.body.completionDate) : undefined,
      trainingDuration: req.body.trainingDuration,
      batchNumber: req.body.batchNumber,
      specialization: req.body.specialization,
      assessmentResult: req.body.assessmentResult,
      grade: req.body.grade,
      additionalRemarks: req.body.additionalRemarks,
      status: 'draft',
      createdBy: req.admin!.id,
    });

    res.status(201).json({ success: true, data: cert });
  } catch (err) {
    console.error('[certificates/create-draft]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/certificates/:id/draft — update draft
router.patch('/:id/draft', requireAuth, validate(updateDraftSchema), async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }
    if (cert.status !== 'draft') {
      res.status(400).json({ success: false, error: 'Only draft certificates can be updated' });
      return;
    }

    const updates: Record<string, unknown> = { ...req.body };
    if (req.body.trainingStartDate) updates.trainingStartDate = new Date(req.body.trainingStartDate as string);
    if (req.body.completionDate) updates.completionDate = new Date(req.body.completionDate as string);

    const updated = await Certificate.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[certificates/update-draft]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/issue — issue certificate
router.post('/:id/issue', requireAuth, async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    // Idempotency check
    if (cert.status === 'issued') {
      const existing = await Certificate.findById(req.params.id)
        .populate('studentId', 'fullName')
        .populate('courseId', 'name')
        .lean();
      res.json({ success: true, data: existing, message: 'Certificate already issued' });
      return;
    }

    if (cert.status === 'revoked') {
      res.status(400).json({ success: false, error: 'Cannot issue a revoked certificate' });
      return;
    }

    await buildAndIssueCertificate(
      (cert._id as { toString(): string }).toString(),
      req.admin!.id,
      req.admin!.name
    );

    const issued = await Certificate.findById(cert._id)
      .populate('studentId', 'fullName studentId')
      .populate('courseId', 'name category')
      .lean();

    res.json({ success: true, data: issued });
  } catch (err) {
    console.error('[certificates/issue]', err);
    res.status(500).json({ success: false, error: 'Failed to issue certificate' });
  }
});

// GET /api/certificates/:id/pdf — stream PDF
router.get('/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findById(req.params.id).lean();
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }
    if (!cert.pdfPath || !fs.existsSync(cert.pdfPath)) {
      res.status(404).json({ success: false, error: 'PDF not found' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificateId}.pdf"`);
    fs.createReadStream(cert.pdfPath).pipe(res);
  } catch (err) {
    console.error('[certificates/pdf]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/revoke
router.post('/:id/revoke', requireAuth, validate(revokeSchema), async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }
    if (cert.status === 'revoked') {
      res.status(400).json({ success: false, error: 'Certificate already revoked' });
      return;
    }

    const updated = await Certificate.findByIdAndUpdate(
      req.params.id,
      {
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: req.body.revocationReason,
      },
      { new: true }
    ).lean();

    await logAudit({
      actorId: req.admin!.id,
      actorName: req.admin!.name,
      action: 'certificate.revoked',
      entityType: 'Certificate',
      entityId: cert.certificateId,
      metadata: { reason: req.body.revocationReason },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[certificates/revoke]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/:id/reissue — create new cert linked to previous
router.post('/:id/reissue', requireAuth, async (req: Request, res: Response) => {
  try {
    const oldCert = await Certificate.findById(req.params.id);
    if (!oldCert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }
    if (oldCert.status === 'draft') {
      res.status(400).json({ success: false, error: 'Draft certificates cannot be reissued' });
      return;
    }

    const course = await Course.findById(oldCert.courseId);
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    const year = new Date().getFullYear();
    const newCertificateId = await generateCertificateId(course.category, year);

    // Create new draft linked to old
    const newCert = await Certificate.create({
      certificateId: newCertificateId,
      studentId: oldCert.studentId,
      courseId: oldCert.courseId,
      templateId: oldCert.templateId,
      studentNameSnapshot: oldCert.studentNameSnapshot,
      courseNameSnapshot: oldCert.courseNameSnapshot,
      trainingStartDate: oldCert.trainingStartDate,
      completionDate: oldCert.completionDate,
      trainingDuration: oldCert.trainingDuration,
      batchNumber: oldCert.batchNumber,
      specialization: oldCert.specialization,
      assessmentResult: oldCert.assessmentResult,
      grade: oldCert.grade,
      additionalRemarks: oldCert.additionalRemarks,
      status: 'draft',
      createdBy: req.admin!.id,
      previousCertificateId: oldCert.certificateId,
    });

    // Revoke old certificate
    await Certificate.findByIdAndUpdate(req.params.id, {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: 'Reissued — superseded by ' + newCertificateId,
    });

    await logAudit({
      actorId: req.admin!.id,
      actorName: req.admin!.name,
      action: 'certificate.reissued',
      entityType: 'Certificate',
      entityId: newCertificateId,
      metadata: { previousCertificateId: oldCert.certificateId },
    });

    res.status(201).json({ success: true, data: newCert });
  } catch (err) {
    console.error('[certificates/reissue]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/certificates/bulk-issue
router.post('/bulk-issue', requireAuth, async (req: Request, res: Response) => {
  const items = req.body.items as Array<{ studentId: string; courseId: string }>;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'items array is required' });
    return;
  }

  const results: Array<{ studentId: string; courseId: string; success: boolean; certificateId?: string; error?: string }> = [];

  for (const item of items) {
    try {
      const student = await Student.findById(item.studentId);
      const course = await Course.findById(item.courseId);

      if (!student || !course) {
        results.push({ ...item, success: false, error: 'Student or course not found' });
        continue;
      }

      const year = new Date().getFullYear();
      const certificateId = await generateCertificateId(course.category, year);

      const cert = await Certificate.create({
        certificateId,
        studentId: student._id,
        courseId: course._id,
        studentNameSnapshot: student.fullName,
        courseNameSnapshot: course.name,
        status: 'draft',
        createdBy: req.admin!.id,
      });

      await buildAndIssueCertificate(
        (cert._id as { toString(): string }).toString(),
        req.admin!.id,
        req.admin!.name
      );

      results.push({ ...item, success: true, certificateId });
    } catch (err: unknown) {
      const error = err as { message?: string };
      results.push({ ...item, success: false, error: error.message ?? 'Failed to issue' });
    }
  }

  res.json({ success: true, data: { results } });
});

export default router;
