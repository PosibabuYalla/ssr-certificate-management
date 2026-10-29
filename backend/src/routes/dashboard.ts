import { Router, Request, Response } from 'express';
import Certificate from '../models/Certificate';
import Student from '../models/Student';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [
      totalCertificates,
      issuedCertificates,
      draftCertificates,
      revokedCertificates,
      totalStudents,
    ] = await Promise.all([
      Certificate.countDocuments(),
      Certificate.countDocuments({ status: 'issued' }),
      Certificate.countDocuments({ status: 'draft' }),
      Certificate.countDocuments({ status: 'revoked' }),
      Student.countDocuments(),
    ]);

    // Certificates issued per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyIssuance = await Certificate.aggregate([
      { $match: { status: 'issued', issueDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalCertificates,
        issuedCertificates,
        draftCertificates,
        revokedCertificates,
        totalStudents,
        monthlyIssuance,
      },
    });
  } catch (err) {
    console.error('[dashboard/stats]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dashboard/recent-certificates
router.get('/recent-certificates', async (req: Request, res: Response) => {
  try {
    const certificates = await Certificate.find({ status: 'issued' })
      .populate('studentId', 'fullName studentId')
      .populate('courseId', 'name category')
      .populate('issuedBy', 'name')
      .sort({ issueDate: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: certificates });
  } catch (err) {
    console.error('[dashboard/recent-certificates]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
