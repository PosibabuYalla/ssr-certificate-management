import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import Student from '../models/Student';
import Certificate from '../models/Certificate';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(requireAuth);

const upload = multer({ dest: 'src/uploads/csv/' });

function generateStudentId(): string {
  const now = new Date();
  const yyyymmdd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(10000 + Math.random() * 90000));
  return `STU-${yyyymmdd}-${random}`;
}

const enrollmentSchema = z.object({
  courseId: z.string(),
  batchNumber: z.string().optional().default(''),
  enrollmentDate: z.string().optional(),
  completionStatus: z.enum(['enrolled', 'completed', 'dropped']).optional().default('enrolled'),
});

const studentSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  enrollments: z.array(enrollmentSchema).optional().default([]),
});

const updateStudentSchema = studentSchema.partial();

// GET /api/students
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string) || '';
    const courseFilter = (req.query.courseId as string) || '';
    const statusFilter = (req.query.status as string) || '';

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (courseFilter) {
      query['enrollments.courseId'] = courseFilter;
    }

    if (statusFilter) {
      query['enrollments.completionStatus'] = statusFilter;
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[students/list]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/students
router.post('/', validate(studentSchema), async (req: Request, res: Response) => {
  try {
    const studentId = generateStudentId();
    const student = await Student.create({ ...req.body, studentId });
    res.status(201).json({ success: true, data: student });
  } catch (err: unknown) {
    const error = err as { code?: number };
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Student already exists' });
      return;
    }
    console.error('[students/create]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/students/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    const certificates = await Certificate.find({ studentId: student._id })
      .populate('courseId', 'name category')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: { ...student, certificates } });
  } catch (err) {
    console.error('[students/get]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/students/:id
router.patch('/:id', validate(updateStudentSchema), async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error('[students/update]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/students/import — CSV bulk import
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'CSV file is required' });
    return;
  }

  const filePath = req.file.path;
  const created: unknown[] = [];
  const errors: { row: number; error: string; data?: unknown }[] = [];

  try {
    const rows: string[][] = await new Promise((resolve, reject) => {
      const results: string[][] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ skip_empty_lines: true, trim: true }))
        .on('data', (row: string[]) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    if (rows.length < 2) {
      res.status(400).json({ success: false, error: 'CSV must have a header row and at least one data row' });
      fs.unlinkSync(filePath);
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const nameIdx = headers.indexOf('fullname');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');

    if (nameIdx === -1) {
      res.status(400).json({ success: false, error: 'CSV must have a "fullName" column' });
      fs.unlinkSync(filePath);
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = row[nameIdx]?.trim() ?? '';
      const email = emailIdx >= 0 ? row[emailIdx]?.trim() : '';
      const phone = phoneIdx >= 0 ? row[phoneIdx]?.trim() : '';

      if (!fullName) {
        errors.push({ row: i + 1, error: 'Missing fullName', data: row });
        continue;
      }

      try {
        const studentId = generateStudentId();
        const student = await Student.create({ studentId, fullName, email, phone, enrollments: [] });
        created.push(student);
      } catch (createErr: unknown) {
        const ce = createErr as { message?: string };
        errors.push({ row: i + 1, error: ce.message ?? 'Create failed', data: { fullName, email, phone } });
      }
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, data: { created: created.length, errors } });
  } catch (err) {
    console.error('[students/import]', err);
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    res.status(500).json({ success: false, error: 'Failed to process CSV' });
  }
});

export default router;
