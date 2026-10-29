import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 PNG data URL.
 */
export async function generateQRCodeBase64(text: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
  });
  return dataUrl;
}

/**
 * Generate a QR code as a raw PNG Buffer (suitable for embedding in PDFs).
 */
export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  const buffer = await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
  });
  return buffer;
}
