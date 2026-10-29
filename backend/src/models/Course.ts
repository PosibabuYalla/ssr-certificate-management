import mongoose, { Schema, Document } from 'mongoose';
import { CourseCategory } from '../types';

export interface ICourseDocument extends Document {
  courseCode: string;
  name: string;
  category: CourseCategory;
  description?: string;
  defaultDuration?: string;
  durationUnit?: string;
  certificatePrefix: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    courseCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['electrical', 'software'], required: true },
    description: { type: String, default: '' },
    defaultDuration: { type: String, default: '' },
    durationUnit: { type: String, default: '' },
    certificatePrefix: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourseDocument>('Course', CourseSchema);
export default Course;
