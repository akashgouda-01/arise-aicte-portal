import { Application, RegulatoryPolicy, UserRole } from '../models/types';

export interface PolicyDiffItem {
  clauseNumber: string;
  sectionTitle: string;
  changeType: 'ADDITION' | 'DELETION' | 'AMENDMENT';
  oldText?: string;
  newText: string;
  impactLevel: 'CRITICAL' | 'MODERATE' | 'LOW';
  affectedRequirementCodes: string[];
}

export class RCIEEngine {
  /**
   * Assess impact of proposed policy changes across active applications
   */
  static assessImpact(
    policy: RegulatoryPolicy,
    applications: Application[]
  ): {
    affectedApplications: {
      applicationId: string;
      applicationNumber: string;
      institutionName: string;
      category: string;
      currentStage: string;
      region: string;
      impactReason: string;
    }[];
    totalCount: number;
  } {
    const affectedRequirementCodes = new Set<string>();
    for (const diff of policy.differences) {
      for (const code of diff.affectedRequirementCodes) {
        affectedRequirementCodes.add(code);
      }
    }

    const affected: {
      applicationId: string;
      applicationNumber: string;
      institutionName: string;
      category: string;
      currentStage: string;
      region: string;
      impactReason: string;
    }[] = [];

    for (const app of applications) {
      // In-flight applications at Scrutiny, Clarification, or EVC stages are affected
      if (['SUBMITTED', 'SCRUTINY', 'CLARIFICATION_REQUIRED', 'EVC_REQUIRED', 'EVC_SCHEDULED'].includes(app.currentStage)) {
        let reason = 'Active in-flight application subject to revised scrutiny norms under draft APH.';
        if (app.category === 'NEW_PROGRAMME') {
          reason = 'Eligible for relaxed 1:25 Year-1 Faculty Ratio under revised Clause 7.4.1.';
        } else if (app.category === 'NEW_INSTITUTION') {
          reason = 'Mandatory solar/rainwater audit under Clause 9.1 applies to newly established campus.';
        }

        affected.push({
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          institutionName: app.institutionName,
          category: app.categoryLabel,
          currentStage: app.stageLabel,
          region: app.region,
          impactReason: reason,
        });
      }
    }

    return {
      affectedApplications: affected,
      totalCount: affected.length,
    };
  }

  /**
   * Validate if user role is authorized to publish a regulatory change
   */
  static canPublish(actorRole: UserRole): boolean {
    return (
      actorRole === 'CENTRAL_DECISION_MAKER' ||
      actorRole === 'DECISION_MAKER' ||
      actorRole === 'SYSTEM_ADMIN'
    );
  }
}
