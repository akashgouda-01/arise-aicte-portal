import { Router, Request, Response } from 'express';
import { AuditService } from '../services/auditService';

export const auditRouter = Router();

// GET audit trail events with optional filtering
auditRouter.get('/', (req: Request, res: Response) => {
  const { entityType, entityId, actorRole, search } = req.query;

  const events = AuditService.getEvents({
    entityType: entityType ? String(entityType) : undefined,
    entityId: entityId ? String(entityId) : undefined,
    actorRole: actorRole ? String(actorRole) : undefined,
    search: search ? String(search) : undefined,
  });

  res.json({
    success: true,
    count: events.length,
    data: events,
  });
});
