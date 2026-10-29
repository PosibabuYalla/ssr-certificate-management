import { Router, Request, Response } from 'express';
import { z } from 'zod';
import path from 'path';
import CertificateTemplate from '../models/CertificateTemplate';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateCertificatePDF } from '../services/pdfService';
import config from '../config';

const router = Router();
router.use(requireAuth);

const signatorySchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  signatureImagePath: z.string().optional(),
});

const templateSchema = z.object({
  templateCode: z.string().min(1),
  courseId: z.string().min(1),
  name: z.string().min(1),
  orientation: z.enum(['landscape', 'portrait']).optional().default('landscape'),
  dimensions: z
    .object({ width: z.number(), height: z.number() })
    .optional()
    .default({ width: 841.89, height: 595.28 }),
  designConfig: z.record(z.unknown()).optional(),
  defaultWording: z.string().optional().default(''),
  signatories: z.array(signatorySchema).optional().default([]),
  logoPath: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const updateTemplateSchema = templateSchema.partial();

// GET /api/templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await CertificateTemplate.find()
      .populate('courseId', 'name category courseCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: templates });
  } catch (err) {
    console.error('[templates/list]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/templates
router.post('/', validate(templateSchema), async (req: Request, res: Response) => {
  try {
    const template = await CertificateTemplate.create({
      ...req.body,
      createdBy: req.admin!.id,
    });
    res.status(201).json({ success: true, data: template });
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Template code already exists' });
      return;
    }
    console.error('[templates/create]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id)
      .populate('courseId', 'name category courseCode')
      .populate('createdBy', 'name email')
      .lean();

    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (err) {
    console.error('[templates/get]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/templates/:id
router.patch('/:id', validate(updateTemplateSchema), async (req: Request, res: Response) => {
  try {
    const existing = await CertificateTemplate.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    // Increment version on update
    const newVersion = (existing.version ?? 1) + 1;
    const template = await CertificateTemplate.findByIdAndUpdate(
      req.params.id,
      { ...req.body, version: newVersion },
      { new: true, runValidators: true }
    ).lean();

    res.json({ success: true, data: template });
  } catch (err) {
    console.error('[templates/update]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/templates/:id/preview — generate a preview PDF
router.post('/:id/preview', async (req: Request, res: Response) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id)
      .populate<{ courseId: { name: string; category: string } }>('courseId', 'name category')
      .lean();

    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const signatory = (template.signatories && template.signatories[0]) ?? {
      name: 'Director',
      title: 'SSR Institute',
    };

    const previewData = {
      certificateId: 'SSR-EL-2026-PREVIEW',
      studentName: 'Sample Student Name',
      courseName: template.courseId?.name ?? 'Sample Course',
      courseCategory: template.courseId?.category ?? 'electrical',
      trainingDuration: '3 Months',
      startDate: '01 Jan 2026',
      completionDate: '31 Mar 2026',
      issueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      signatoryName: signatory.name,
      signatoryTitle: signatory.title,
      publicVerificationUrl: `${config.PUBLIC_BASE_URL}/verify/SSR-EL-2026-PREVIEW`,
    };

    const filename = `preview_${template.templateCode}_${Date.now()}.pdf`;
    const outputPath = path.join(config.UPLOAD_DIR, 'previews', filename);

    await generateCertificatePDF(previewData, outputPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fs = await import('fs');
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    fileStream.on('end', () => {
      try { fs.unlinkSync(outputPath); } catch { /* ignore cleanup errors */ }
    });
  } catch (err) {
    console.error('[templates/preview]', err);
    res.status(500).json({ success: false, error: 'Failed to generate preview' });
  }
});

export default router;
