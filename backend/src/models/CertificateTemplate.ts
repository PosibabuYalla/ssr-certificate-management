import mongoose, { Schema, Document } from 'mongoose';
import { Orientation } from '../types';

export interface ISignatoryDoc {
  name: string;
  title: string;
  signatureImagePath?: string;
}

export interface ICertificateTemplateDocument extends Document {
  templateCode: string;
  courseId: mongoose.Types.ObjectId;
  name: string;
  orientation: Orientation;
  dimensions: { width: number; height: number };
  designConfig?: Record<string, unknown>;
  defaultWording?: string;
  signatories: ISignatoryDoc[];
  logoPath?: string;
  version: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SignatorySchema = new Schema<ISignatoryDoc>(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    signatureImagePath: { type: String },
  },
  { _id: false }
);

const CertificateTemplateSchema = new Schema<ICertificateTemplateDocument>(
  {
    templateCode: { type: String, required: true, unique: true, trim: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true, trim: true },
    orientation: { type: String, enum: ['landscape', 'portrait'], default: 'landscape' },
    dimensions: {
      width: { type: Number, default: 841.89 },
      height: { type: Number, default: 595.28 },
    },
    designConfig: { type: Schema.Types.Mixed },
    defaultWording: { type: String, default: '' },
    signatories: { type: [SignatorySchema], default: [] },
    logoPath: { type: String },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
);

const CertificateTemplate = mongoose.model<ICertificateTemplateDocument>(
  'CertificateTemplate',
  CertificateTemplateSchema
);
export default CertificateTemplate;
