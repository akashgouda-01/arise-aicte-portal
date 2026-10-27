import { Router, Request, Response } from 'express';
import { mockPolicies, mockApplications } from '../data/mockData';
import { RegulatoryPolicy, UserRole } from '../models/types';
import { RCIEEngine } from '../services/rcieEngine';
import { AuditService } from '../services/auditService';
import { attachRegulatoryNotice, getApplicationList } from './applicationRoutes';
import { createTaskInternal } from './taskRoutes';

export const policyRouter = Router();

let policies: RegulatoryPolicy[] = [...mockPolicies];

// GET all policies
policyRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: policies.length,
    data: policies,
  });
});

// GET single policy by ID
policyRouter.get('/:id', (req: Request, res: Response) => {
  const policy = policies.find((p) => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, error: 'Policy not found' });
  }

  // Assess impact on currently active applications
  const impact = RCIEEngine.assessImpact(policy, mockApplications);

  res.json({
    success: true,
    data: {
      ...policy,
      affectedApplications: impact.affectedApplications,
      liveAffectedCount: impact.totalCount,
    },
  });
});

// POST publish policy
policyRouter.post('/:id/publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const { publishedBy, actorRole, gazetteReference, transitionPolicy } = req.body;

  if (!RCIEEngine.canPublish(actorRole as UserRole)) {
    return res.status(403).json({
      success: false,
      error: `User role '${actorRole}' is not authorized to publish official regulatory policy changes. Only Competent Authority (DECISION_MAKER) or Administrator can publish.`,
    });
  }

  const idx = policies.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Policy not found' });
  }

  const current = policies[idx];
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const updated: RegulatoryPolicy = {
    ...current,
    status: 'PUBLISHED',
    publishedBy: publishedBy || 'Competent Decision-Making Authority',
    publishedAt: timestamp,
    gazetteReference: gazetteReference || current.gazetteReference,
    transitionPolicy: transitionPolicy || current.transitionPolicy,
    auditTrailNotes: [
      ...current.auditTrailNotes,
      `${timestamp}: Formally enacted and published into AICTE National Regulation Repository by ${publishedBy}.`,
    ],
  };

  policies[idx] = updated;

  // 1. Contextually attach regulatory notice to active in-flight applications
  const { affectedCount, applicationIds } = attachRegulatoryNotice({
    policyId: updated.id,
    version: updated.version,
    title: updated.title,
    effectiveDate: updated.effectiveDate,
    impactSummary: `Enacted under ${updated.gazetteReference}. Applicable to active scrutiny cycles per recorded transition policy: "${updated.transitionPolicy}".`,
  });

  // 2. Automatically generate follow-up tasks for officers managing affected applications
  const activeApps = getApplicationList().filter((a) => applicationIds.includes(a.id));
  for (const app of activeApps) {
    createTaskInternal({
      taskType: 'POLICY_IMPACT_REVIEW',
      title: `Review ${updated.version} Transition Impact on ${app.applicationNumber}`,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      institutionId: app.institutionId,
      institutionName: app.institutionName,
      category: app.categoryLabel,
      currentStage: app.stageLabel,
      relatedPolicyId: updated.id,
      policyVersion: updated.version,
      assignedRole: 'PROCESSING_OFFICER',
      assignedToName: app.assignedOfficerName || 'Regional Scrutiny Officer',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      isOverdue: false,
      sourceEvent: `Regulatory Policy ${updated.version} published by Competent Authority. Dossier flagged for compliance review against revised clauses.`,
      allowedActions: ['CONFIRM_GLIDEPATH', 'APPLY_REVISED_NORMS', 'EXEMPT_UNDER_GRANDFATHERING'],
      targetSection: 'compliance-evidence',
    });
  }

  AuditService.logEvent({
    actorId: actorRole,
    actorName: publishedBy || 'Competent Decision-Making Authority',
    actorRole: (actorRole as UserRole) || 'DECISION_MAKER',
    action: 'POLICY_PUBLISHED',
    entityType: 'POLICY',
    entityId: updated.id,
    entityName: updated.title,
    details: `Officially published regulatory policy ${updated.version} into production legal registry. Gazette Ref: ${updated.gazetteReference}. Attached to ${affectedCount} active applications with follow-up review tasks created.`,
    previousValue: current.status,
    newValue: 'PUBLISHED',
  });

  res.json({
    success: true,
    message: `Policy ${updated.version} successfully published and enacted. ${affectedCount} active cases notified with operational tasks created.`,
    data: {
      ...updated,
      affectedApplicationsCount: affectedCount,
    },
  });
});

