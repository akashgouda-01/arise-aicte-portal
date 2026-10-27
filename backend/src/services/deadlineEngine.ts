import { Application, SystemAlert, UserRole } from '../models/types';
import { WorkflowEngine } from './workflowEngine';

export class DeadlineEngine {
  /**
   * Evaluate applications and generate alerts for overdue or approaching deadlines
   */
  static evaluateApplications(applications: Application[]): {
    updatedApplications: Application[];
    newAlerts: SystemAlert[];
  } {
    const updatedApplications: Application[] = [];
    const newAlerts: SystemAlert[] = [];

    for (const app of applications) {
      const slaDays = WorkflowEngine.getStageSLADays(app.currentStage);
      const isOverdue = app.daysInCurrentStage > slaDays;
      const isApproaching = app.daysInCurrentStage >= slaDays - 2 && !isOverdue;

      const updated = {
        ...app,
        isOverdue,
      };
      updatedApplications.push(updated);

      if (isOverdue && app.status !== 'COMPLETED' && app.status !== 'REJECTED') {
        const responsibleRole = this.getResponsibleRoleForStage(app.currentStage);
        newAlerts.push({
          id: `alt_due_${app.id}_${Date.now()}`,
          severity: app.daysInCurrentStage > slaDays + 7 ? 'CRITICAL' : 'HIGH',
          title: `Stage SLA Exceeded: ${app.institutionName}`,
          message: `Application ${app.applicationNumber} has been at '${app.stageLabel}' for ${app.daysInCurrentStage} days (prescribed SLA: ${slaDays} days).`,
          category: 'DEADLINE',
          applicationId: app.id,
          institutionId: app.institutionId,
          institutionName: app.institutionName,
          responsibleRole,
          deadline: app.targetCompletionDate,
          isEscalated: app.daysInCurrentStage > slaDays + 5,
          escalationLevel: app.daysInCurrentStage > slaDays + 10 ? 2 : 1,
          isResolved: false,
          createdAt: new Date().toISOString(),
          recommendedAction: `Expedite stage review and escalate to Regional Director / Bureau Head if unresolved within 48 hours.`,
        });
      }
    }

    return { updatedApplications, newAlerts };
  }

  static getResponsibleRoleForStage(stage: Application['currentStage']): UserRole {
    switch (stage) {
      case 'CLARIFICATION_REQUIRED': return 'INSTITUTION';
      case 'SCRUTINY': return 'PROCESSING_OFFICER';
      case 'EVC_SCHEDULED':
      case 'REPORT_PENDING': return 'EVC_MEMBER';
      case 'COMMITTEE_REVIEW': return 'COMMITTEE_MEMBER';
      case 'DECISION_PENDING': return 'DECISION_MAKER';
      default: return 'REGIONAL_OFFICER';
    }
  }
}
