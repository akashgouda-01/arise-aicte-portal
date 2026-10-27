import { AuditEvent, UserRole } from '../models/types';
import { mockAuditEvents } from '../data/mockData';

export class AuditService {
  private static events: AuditEvent[] = [...mockAuditEvents];

  static logEvent(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: string;
    entityType: AuditEvent['entityType'];
    entityId: string;
    entityName: string;
    details: string;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
  }): AuditEvent {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;
    
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      details: params.details,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress || '10.24.8.112 (NIC GovNet Gateway)',
    };

    this.events.unshift(event);
    return event;
  }

  static getEvents(filter?: {
    entityType?: string;
    entityId?: string;
    actorRole?: string;
    search?: string;
  }): AuditEvent[] {
    let result = [...this.events];

    if (filter?.entityType) {
      result = result.filter((e) => e.entityType === filter.entityType);
    }
    if (filter?.entityId) {
      result = result.filter((e) => e.entityId === filter.entityId);
    }
    if (filter?.actorRole) {
      result = result.filter((e) => e.actorRole === filter.actorRole);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.actorName.toLowerCase().includes(q) ||
          e.entityName.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
      );
    }

    return result;
  }
}
