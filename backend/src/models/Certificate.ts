import mongoose, { Schema, Document } from 'mongoose';
import { CertificateStatus } from '../types';

export interface ICertificateDocument extends Document {
  certificateId: string;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  templateVersion?: number;
  studentNameSnapshot: string;
  courseNameSnapshot: string;
  trainingStartDate?: Date;
  completionDate?: Date;
  trainingDuration?: string;
  issueDate?: Date;
  batchNumber?: string;
  specialization?: string;
  assessmentResult?: string;
  grade?: string;
  additionalRemarks?: string;
  certificateDataSnapshot?: Record<string, unknown>;
  publicVerificationPath?: string;
  pdfPath?: string;
  status: CertificateStatus;
  createdBy: mongoose.Types.ObjectId;
  issuedBy?: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revocationReason?: string;
  previousCertificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificateDocument>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'CertificateTemplate' },
    templateVersion: { type: Number },
    studentNameSnapshot: { type: String, required: true },
    courseNameSnapshot: { type: String, required: true },
    trainingStartDate: { type: Date },
    completionDate: { type: Date },
    trainingDuration: { type: String },
    issueDate: { type: Date, index: true },
    batchNumber: { type: String },
    specialization: { type: String },
    assessmentResult: { type: String },
    grade: { type: String },
    additionalRemarks: { type: String },
    certificateDataSnapshot: { type: Schema.Types.Mixed },
    publicVerificationPath: { type: String },
    pdfPath: { type: String },
    status: {
      type: String,
      enum: ['draft', 'issued', 'revoked'],
      default: 'draft',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    revokedAt: { type: Date },
    revocationReason: { type: String },
    previousCertificateId: { type: String },
  },
  { timestamps: true }
);

const Certificate = mongoose.model<ICertificateDocument>('Certificate', CertificateSchema);
export default Certificate;
