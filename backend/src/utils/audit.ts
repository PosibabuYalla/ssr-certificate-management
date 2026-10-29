import AuditLog from '../models/AuditLog';

interface AuditParams {
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await AuditLog.create({
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? {},
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
