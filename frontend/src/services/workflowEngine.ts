import { Application, ApplicationCategory, UserRole, WorkflowStage } from '../types';

// Permitted transitions per category
const PERMITTED_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['SCRUTINY'],
  SCRUTINY: ['CLARIFICATION_REQUIRED', 'EVC_REQUIRED', 'DECISION_PENDING', 'DEFICIENCY_COMMUNICATED'],
  CLARIFICATION_REQUIRED: ['RESUBMITTED'],
  RESUBMITTED: ['SCRUTINY'],
  EVC_REQUIRED: ['EVC_SCHEDULED'],
  EVC_SCHEDULED: ['EVC_VISIT_COMPLETED'],
  EVC_VISIT_COMPLETED: ['REPORT_PENDING'],
  REPORT_PENDING: ['COMMITTEE_REVIEW', 'DECISION_PENDING'],
  COMMITTEE_REVIEW: ['DECISION_PENDING', 'DEFICIENCY_COMMUNICATED'],
  DECISION_PENDING: ['APPROVED', 'DEFICIENCY_COMMUNICATED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  DEFICIENCY_COMMUNICATED: ['COMMITTEE_REVIEW', 'CLOSED', 'REJECTED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

// Roles authorized to perform transitions
const STAGE_PERMISSIONS: Partial<Record<WorkflowStage, UserRole[]>> = {
  SUBMITTED: ['INSTITUTION'],
  SCRUTINY: ['PROCESSING_OFFICER', 'REGIONAL_OFFICER'],
  CLARIFICATION_REQUIRED: ['PROCESSING_OFFICER'],
  RESUBMITTED: ['INSTITUTION'],
  EVC_REQUIRED: ['PROCESSING_OFFICER', 'REGIONAL_OFFICER'],
  EVC_SCHEDULED: ['EVC_MEMBER', 'EVC_COMMITTEE_MEMBER', 'REGIONAL_OFFICER'],
  EVC_VISIT_COMPLETED: ['EVC_MEMBER', 'EVC_COMMITTEE_MEMBER'],
  REPORT_PENDING: ['EVC_MEMBER', 'EVC_COMMITTEE_MEMBER', 'CENTRAL_DECISION_MAKER', 'SYSTEM_ADMIN'],
  COMMITTEE_REVIEW: ['COMMITTEE_MEMBER', 'EVC_COMMITTEE_MEMBER', 'CENTRAL_OFFICER', 'CENTRAL_DECISION_MAKER'],
  DECISION_PENDING: ['CENTRAL_OFFICER', 'CENTRAL_DECISION_MAKER', 'PROCESSING_OFFICER', 'COMMITTEE_MEMBER', 'EVC_COMMITTEE_MEMBER'],
  APPROVED: ['DECISION_MAKER', 'CENTRAL_DECISION_MAKER'],
  DEFICIENCY_COMMUNICATED: ['PROCESSING_OFFICER', 'DECISION_MAKER', 'CENTRAL_DECISION_MAKER', 'COMMITTEE_MEMBER', 'EVC_COMMITTEE_MEMBER'],
  REJECTED: ['DECISION_MAKER', 'CENTRAL_DECISION_MAKER'],
  CLOSED: ['SYSTEM_ADMIN', 'DECISION_MAKER', 'CENTRAL_DECISION_MAKER'],
};

export class WorkflowEngine {
  /**
   * Validate if a transition from currentStage to nextStage is valid and authorized for the user role.
   */
  static validateTransition(
    currentStage: WorkflowStage,
    nextStage: WorkflowStage,
    actorRole: UserRole,
    category: ApplicationCategory
  ): { allowed: boolean; reason?: string } {
    // 1. Role Authorization Check: verify actorRole is authorized to initiate nextStage
    const allowedRoles = STAGE_PERMISSIONS[nextStage];
    if (allowedRoles && !allowedRoles.includes(actorRole) && actorRole !== 'SYSTEM_ADMIN') {
      return {
        allowed: false,
        reason: `User role '${actorRole}' is not authorized to transition an application to '${nextStage}'. Required role: [${allowedRoles.join(', ')}]`,
      };
    }

    // 2. State Reachability Check: verify nextStage is reachable from currentStage
    const allowedNext = PERMITTED_TRANSITIONS[currentStage] || [];
    if (!allowedNext.includes(nextStage)) {
      return {
        allowed: false,
        reason: `Transition from ${currentStage} to ${nextStage} is not permitted under AICTE Approval Process rules. Allowed stages: [${allowedNext.join(', ')}]`,
      };
    }

    // 3. Category-specific constraints
    if (category === 'EXTENSION_OF_APPROVAL' && nextStage === 'EVC_REQUIRED') {
      // In normal EoA, EVC is surprise/complaint-based only
      // permitted but logged
    }

    return { allowed: true };
  }

  /**
   * Compute standard SLA target days per stage
   */
  static getStageSLADays(stage: WorkflowStage): number {
    switch (stage) {
      case 'SUBMITTED': return 3;
      case 'SCRUTINY': return 10;
      case 'CLARIFICATION_REQUIRED': return 15;
      case 'EVC_REQUIRED': return 7;
      case 'EVC_SCHEDULED': return 14;
      case 'REPORT_PENDING': return 5;
      case 'COMMITTEE_REVIEW': return 10;
      case 'DECISION_PENDING': return 15;
      default: return 30;
    }
  }

  /**
   * Apply transition and append stage history record
   */
  static applyTransition(
    application: Application,
    nextStage: WorkflowStage,
    actorName: string,
    actorRole: UserRole,
    action: string,
    reason?: string
  ): Application {
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;
    
    const newHistoryItem = {
      id: `hist_${Date.now()}`,
      stage: nextStage,
      timestamp,
      actorName,
      actorRole,
      action,
      reason,
      durationDays: application.daysInCurrentStage,
    };

    let newStatus: Application['status'] = 'IN_PROGRESS';
    let formalDecision = application.formalDecision;

    if (nextStage === 'APPROVED') {
      newStatus = 'COMPLETED';
      const orderMatch = reason?.match(/Order Ref:\s*([^)]+)/);
      formalDecision = {
        orderSerial: orderMatch ? orderMatch[1].trim() : `AICTE/LOA/2026/${application.applicationNumber.split('/').pop()}`,
        decision: 'APPROVED',
        decidedBy: actorName,
        decidedRole: actorRole,
        decidedAt: timestamp,
        statutoryRationale: reason || 'Formal statutory approval granted under AICTE Act regulations.',
        letterOfApprovalUrl: `/documents/loa_${application.id}.pdf`,
      };
    } else if (nextStage === 'REJECTED') {
      newStatus = 'REJECTED';
      const orderMatch = reason?.match(/Order Ref:\s*([^)]+)/);
      formalDecision = {
        orderSerial: orderMatch ? orderMatch[1].trim() : `AICTE/LOR/2026/${application.applicationNumber.split('/').pop()}`,
        decision: 'REJECTED',
        decidedBy: actorName,
        decidedRole: actorRole,
        decidedAt: timestamp,
        statutoryRationale: reason || 'Formal statutory rejection speaking order issued.',
      };
    } else if (nextStage === 'CLARIFICATION_REQUIRED') {
      newStatus = 'ACTION_REQUIRED';
    } else if (nextStage === 'DECISION_PENDING') {
      newStatus = 'DECISION_PENDING';
    } else if (nextStage === 'COMMITTEE_REVIEW' || nextStage === 'REPORT_PENDING') {
      newStatus = 'UNDER_REVIEW';
    }

    return {
      ...application,
      currentStage: nextStage,
      stageLabel: this.getStageLabel(nextStage),
      status: newStatus,
      daysInCurrentStage: 0,
      isOverdue: false,
      formalDecision,
      stageHistory: [...application.stageHistory, newHistoryItem],
    };
  }

  static getStageLabel(stage: WorkflowStage): string {
    const labels: Record<WorkflowStage, string> = {
      DRAFT: 'Draft Application',
      SUBMITTED: 'Submitted to Regional Office',
      SCRUTINY: 'Digital Scrutiny in Progress',
      CLARIFICATION_REQUIRED: 'Clarification / Correction Required',
      RESUBMITTED: 'Resubmitted by Institution',
      EVC_REQUIRED: 'EVC Inspection Required',
      EVC_SCHEDULED: 'EVC Inspection Scheduled',
      EVC_VISIT_COMPLETED: 'EVC Visit Completed',
      REPORT_PENDING: 'EVC Report Upload Pending',
      COMMITTEE_REVIEW: 'SAC / SHC Committee Review',
      DECISION_PENDING: 'Executive Committee Decision Pending',
      APPROVED: 'Approved (LoA Issued)',
      DEFICIENCY_COMMUNICATED: 'Deficiency Communicated (LoD)',
      REJECTED: 'Rejected (Speaking Order Issued)',
      CLOSED: 'Case Closed',
    };
    return labels[stage] || stage;
  }
}
