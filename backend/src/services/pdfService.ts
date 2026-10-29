import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQRCodeBuffer } from './qrService';

export interface CertificateData {
  certificateId: string;
  studentName: string;
  courseName: string;
  courseCategory: string;
  trainingDuration: string;
  startDate: string;
  completionDate: string;
  issueDate: string;
  signatoryName: string;
  signatoryTitle: string;
  publicVerificationUrl: string;
  additionalFields?: Record<string, string>;
}

// Color palette
const NAVY = '#1B2A4A';
const GOLDEN = '#C9A84C';
const GREY = '#555555';
const LIGHT_GREY = '#888888';
const WHITE = '#FFFFFF';

export async function generateCertificatePDF(
  data: CertificateData,
  outputPath: string
): Promise<string> {
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Generate QR code buffer
  const qrBuffer = await generateQRCodeBuffer(data.publicVerificationUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [841.89, 595.28], // A4 landscape in points
      layout: 'landscape',
      margin: 0,
      info: {
        Title: `Certificate - ${data.studentName}`,
        Author: 'SSR Institute',
        Subject: `${data.courseName} - Certificate of Completion`,
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = 841.89;
    const H = 595.28;
    const MARGIN = 20;

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    // ── Outer border (double line) ────────────────────────────────────────────
    doc
      .rect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2)
      .lineWidth(3)
      .stroke(NAVY);

    doc
      .rect(MARGIN + 6, MARGIN + 6, W - (MARGIN + 6) * 2, H - (MARGIN + 6) * 2)
      .lineWidth(1)
      .stroke(GOLDEN);

    // ── Top section: Institute header ─────────────────────────────────────────
    const topY = MARGIN + 30;

    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(NAVY)
      .text('SSR INSTITUTE', MARGIN + 30, topY, { width: W - (MARGIN + 30) * 2, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor(GOLDEN)
      .text('Smart Skills Recruitment', MARGIN + 30, topY + 36, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(LIGHT_GREY)
      .text(
        'Hyderabad, Telangana, India  |  ssrinstitute.in  |  info@ssrinstitute.in',
        MARGIN + 30,
        topY + 58,
        { width: W - (MARGIN + 30) * 2, align: 'center' }
      );

    // ── Decorative golden separator line ─────────────────────────────────────
    const sepY = topY + 78;
    doc
      .moveTo(MARGIN + 60, sepY)
      .lineTo(W - MARGIN - 60, sepY)
      .lineWidth(2)
      .stroke(GOLDEN);

    doc
      .moveTo(MARGIN + 60, sepY + 4)
      .lineTo(W - MARGIN - 60, sepY + 4)
      .lineWidth(0.5)
      .stroke(GOLDEN);

    // ── Certificate title ─────────────────────────────────────────────────────
    const titleY = sepY + 18;
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(NAVY)
      .text('CERTIFICATE OF COMPLETION', MARGIN + 30, titleY, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
        characterSpacing: 3,
      });

    // ── Body text ─────────────────────────────────────────────────────────────
    const bodyStartY = titleY + 44;

    doc
      .font('Helvetica-Oblique')
      .fontSize(14)
      .fillColor(GREY)
      .text('This is to certify that', MARGIN + 30, bodyStartY, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor(NAVY)
      .text(data.studentName, MARGIN + 30, bodyStartY + 22, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(GREY)
      .text('has successfully completed the', MARGIN + 30, bodyStartY + 66, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(NAVY)
      .text(data.courseName, MARGIN + 30, bodyStartY + 85, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(GREY)
      .text('training program at SSR Institute', MARGIN + 30, bodyStartY + 112, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    // ── Duration and dates row ────────────────────────────────────────────────
    const datesY = bodyStartY + 136;
    const colW = (W - (MARGIN + 60) * 2) / 3;
    const col1X = MARGIN + 60;
    const col2X = col1X + colW;
    const col3X = col2X + colW;

    // Duration
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Duration', col1X, datesY, { width: colW, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor(GREY).text(data.trainingDuration || '—', col1X, datesY + 14, { width: colW, align: 'center' });

    // Completion date
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Completion Date', col2X, datesY, { width: colW, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor(GREY).text(data.completionDate || '—', col2X, datesY + 14, { width: colW, align: 'center' });

    // Start date
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Start Date', col3X, datesY, { width: colW, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor(GREY).text(data.startDate || '—', col3X, datesY + 14, { width: colW, align: 'center' });

    // ── Issue date ────────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(LIGHT_GREY)
      .text(`Issued on: ${data.issueDate}`, MARGIN + 30, datesY + 40, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    // ── Bottom section ────────────────────────────────────────────────────────
    const bottomY = H - MARGIN - 90;

    // Certificate ID box (bottom left)
    const idBoxX = MARGIN + 30;
    const idBoxY = bottomY + 4;
    doc
      .rect(idBoxX, idBoxY, 200, 32)
      .fillAndStroke('#EEF2F7', NAVY);

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(NAVY)
      .text('CERTIFICATE ID', idBoxX + 6, idBoxY + 5, { width: 188 });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(NAVY)
      .text(data.certificateId, idBoxX + 6, idBoxY + 17, { width: 188 });

    // Signatory (bottom center)
    const sigX = (W - 200) / 2;
    doc
      .moveTo(sigX, bottomY + 4)
      .lineTo(sigX + 200, bottomY + 4)
      .lineWidth(1)
      .stroke(NAVY);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(NAVY)
      .text(data.signatoryName, sigX, bottomY + 10, { width: 200, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(GREY)
      .text(data.signatoryTitle, sigX, bottomY + 25, { width: 200, align: 'center' });

    // QR code (bottom right)
    const qrSize = 80;
    const qrX = W - MARGIN - 30 - qrSize;
    const qrY = bottomY;

    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(LIGHT_GREY)
      .text(`Verify at: ssrinstitute.in/verify/${data.certificateId}`, qrX - 20, qrY + qrSize + 4, {
        width: qrSize + 40,
        align: 'center',
      });

    // ── Footer line ───────────────────────────────────────────────────────────
    const footerY = H - MARGIN - 20;
    doc
      .moveTo(MARGIN + 30, footerY)
      .lineTo(W - MARGIN - 30, footerY)
      .lineWidth(0.5)
      .stroke(GOLDEN);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(LIGHT_GREY)
      .text('www.ssrinstitute.in', MARGIN + 30, footerY + 4, {
        width: W - (MARGIN + 30) * 2,
        align: 'center',
      });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}
