import { Router, Request, Response } from 'express';
import Certificate from '../models/Certificate';
import { PublicCertificateResponse } from '../types';

const router = Router();

// GET /api/public/certificates/:certificateId — public verification endpoint
router.get('/certificates/:certificateId', async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId })
      .populate<{ templateId: { signatories: Array<{ name: string; title: string }> } }>(
        'templateId',
        'signatories'
      )
      .populate<{ courseId: { name: string; category: string } }>('courseId', 'name category')
      .lean();

    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    // Draft certificates are not publicly visible
    if (cert.status === 'draft') {
      res.status(404).json({ success: false, error: 'Certificate not found' });
      return;
    }

    const template = cert.templateId as unknown as { signatories?: Array<{ name: string; title: string }> } | null;
    const signatory = template?.signatories?.[0];
    const course = cert.courseId as unknown as { name: string; category: string } | null;

    const publicData: PublicCertificateResponse = {
      certificateId: cert.certificateId,
      studentName: cert.studentNameSnapshot,
      courseName: cert.courseNameSnapshot,
      courseCategory: course?.category ?? '',
      trainingDuration: cert.trainingDuration,
      completionDate: cert.completionDate,
      issueDate: cert.issueDate,
      status: cert.status,
      revokedAt: cert.revokedAt,
      signatoryName: signatory?.name,
      signatoryTitle: signatory?.title,
      publicVerificationPath: cert.publicVerificationPath,
    };

    res.json({ success: true, data: publicData });
  } catch (err) {
    console.error('[public/verify]', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
