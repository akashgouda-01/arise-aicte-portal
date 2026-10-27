import { Router, Request, Response } from 'express';
import { mockAlerts } from '../data/mockData';
import { SystemAlert, UserRole } from '../models/types';
import { AuditService } from '../services/auditService';

export const alertRouter = Router();

let alerts: SystemAlert[] = [...mockAlerts];

// GET all alerts
alertRouter.get('/', (req: Request, res: Response) => {
  const { severity, category, isResolved, role } = req.query;
  let result = [...alerts];

  if (severity) {
    result = result.filter((a) => a.severity === severity);
  }
  if (category) {
    result = result.filter((a) => a.category === category);
  }
  if (isResolved !== undefined) {
    const resolved = isResolved === 'true';
    result = result.filter((a) => a.isResolved === resolved);
  }
  if (role) {
    result = result.filter((a) => a.responsibleRole === role);
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// POST resolve alert
alertRouter.post('/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolvedBy, actorRole, notes } = req.body;

  const idx = alerts.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  const current = alerts[idx];
  const updated: SystemAlert = {
    ...current,
    isResolved: true,
    resolvedAt: new Date().toISOString(),
  };

  alerts[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'officer',
    actorName: resolvedBy || 'Authorized Officer',
    actorRole: (actorRole as UserRole) || 'PROCESSING_OFFICER',
    action: 'ALERT_RESOLVED',
    entityType: 'ALERT',
    entityId: updated.id,
    entityName: updated.title,
    details: `Alert '${updated.title}' resolved by ${resolvedBy}. Notes: ${notes || 'Condition addressed.'}`,
  });

  res.json({
    success: true,
    message: 'Alert marked as resolved.',
    data: updated,
  });
});

// POST escalate alert
alertRouter.post('/:id/escalate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { escalatedBy, actorRole, reason } = req.body;

  const idx = alerts.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  const current = alerts[idx];
  const newLevel = (current.escalationLevel || 1) + 1;

  const updated: SystemAlert = {
    ...current,
    isEscalated: true,
    escalationLevel: newLevel,
    severity: 'CRITICAL',
  };

  alerts[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'system',
    actorName: escalatedBy || 'System Escalation Engine',
    actorRole: (actorRole as UserRole) || 'SYSTEM_ADMIN',
    action: 'ALERT_ESCALATED',
    entityType: 'ALERT',
    entityId: updated.id,
    entityName: updated.title,
    details: `Alert escalated to Level ${newLevel}. Reason: ${reason || 'Statutory response deadline expired.'}`,
    previousValue: `LEVEL_${current.escalationLevel || 1}`,
    newValue: `LEVEL_${newLevel}`,
  });

  res.json({
    success: true,
    message: `Alert escalated to Level ${newLevel}.`,
    data: updated,
  });
});
