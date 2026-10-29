import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>({
  actorId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true, index: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
export default AuditLog;
