import mongoose, { Schema, Document } from 'mongoose';
import { CompletionStatus } from '../types';

export interface IEnrollmentDocument {
  courseId: mongoose.Types.ObjectId;
  batchNumber: string;
  enrollmentDate: Date;
  completionStatus: CompletionStatus;
  completedAt?: Date;
}

export interface IStudentDocument extends Document {
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  enrollments: IEnrollmentDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    batchNumber: { type: String, default: '' },
    enrollmentDate: { type: Date, default: Date.now },
    completionStatus: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped'],
      default: 'enrolled',
    },
    completedAt: { type: Date },
  },
  { _id: false }
);

const StudentSchema = new Schema<IStudentDocument>(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true, index: true },
    phone: { type: String, trim: true },
    enrollments: { type: [EnrollmentSchema], default: [] },
  },
  { timestamps: true }
);

StudentSchema.index({ studentId: 1 });
StudentSchema.index({ email: 1 }, { sparse: true });

const Student = mongoose.model<IStudentDocument>('Student', StudentSchema);
export default Student;
