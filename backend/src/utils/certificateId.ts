import Counter from '../models/Counter';

export async function generateCertificateId(category: string, year: number): Promise<string> {
  let prefix: string;

  switch (category.toLowerCase()) {
    case 'electrical':
      prefix = 'SSR-EL';
      break;
    case 'software':
      prefix = 'SSR-SW';
      break;
    default:
      prefix = 'SSR-WS';
  }

  const counterName = `${prefix}-${year}`;
  const seq = await Counter.nextSeq(counterName);
  const padded = String(seq).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
}
