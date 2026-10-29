import { Router, Request, Response } from 'express';
import { z } from 'zod';
import Course from '../models/Course';
import CertificateTemplate from '../models/CertificateTemplate';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(requireAuth);

const courseSchema = z.object({
  courseCode: z.string().min(1).toUpperCase(),
  name: z.string().min(1),
  category: z.enum(['electrical', 'software']),
  description: z.string().optional().default(''),
  defaultDuration: z.string().optional().default(''),
  durationUnit: z.string().optional().default(''),
  certificatePrefix: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

const updateCourseSchema = courseSchema.partial();

// GET /api/courses
router.get('/', async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().sort({ name: 1 }).lean();

    // For each course, count its templates
    const coursesWithTemplates = await Promise.all(
      courses.map(async (course) => {
        const templateCount = await CertificateTemplate.countDocuments({ courseId: course._id });
        return { ...course, templateCount };
      })
    );

    res.json({ success: true, data: coursesWithTemplates });
  } catch (err) {
    console.error('[courses/list]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/courses
router.post('/', validate(courseSchema), async (req: Request, res: Response) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string };
    if (error.code === 11000) {
      res.status(409).json({ success: false, error: 'Course code already exists' });
      return;
    }
    console.error('[courses/create]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }
    res.json({ success: true, data: course });
  } catch (err) {
    console.error('[courses/get]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/courses/:id
router.patch('/:id', validate(updateCourseSchema), async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!course) {
      res.status(404).json({ success: false, error: 'Course not found' });
      return;
    }

    res.json({ success: true, data: course });
  } catch (err) {
    console.error('[courses/update]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/courses/:id/templates
router.get('/:id/templates', async (req: Request, res: Response) => {
  try {
    const templates = await CertificateTemplate.find({ courseId: req.params.id })
      .sort({ version: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: templates });
  } catch (err) {
    console.error('[courses/templates]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
