import { Router, Request, Response } from 'express';
import { mockApplications } from '../data/mockData';
import { Application, WorkflowStage, UserRole } from '../models/types';
import { WorkflowEngine } from '../services/workflowEngine';
import { AuditService } from '../services/auditService';

export const applicationRouter = Router();

// In-memory persistent state for running server session
let applications: Application[] = [...mockApplications];

// GET all applications with filters
applicationRouter.get('/', (req: Request, res: Response) => {
  const { region, stage, category, search, institutionId } = req.query;
  let result = [...applications];

  if (region) {
    result = result.filter((a) => a.region.toLowerCase() === String(region).toLowerCase());
  }
  if (stage) {
    result = result.filter((a) => a.currentStage === stage);
  }
  if (category) {
    result = result.filter((a) => a.category === category);
  }
  if (institutionId) {
    result = result.filter((a) => a.institutionId === institutionId);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (a) =>
        a.applicationNumber.toLowerCase().includes(q) ||
        a.institutionName.toLowerCase().includes(q) ||
        (a.programmeName && a.programmeName.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET single application by ID
applicationRouter.get('/:id', (req: Request, res: Response) => {
  const app = applications.find((a) => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }
  res.json({ success: true, data: app });
});

// POST create new application
applicationRouter.post('/', (req: Request, res: Response) => {
  const {
    institutionId,
    institutionName,
    category,
    categoryLabel,
    academicYear,
    region,
    state,
    district,
    programmeName,
    intakeProposed,
    landArea,
    affiliatingUniversity,
    uploadedDocumentIds,
    actorName,
    actorRole,
  } = req.body;

  if (!institutionId || !category) {
    return res.status(400).json({ success: false, error: 'institutionId and category are required' });
  }

  const newId = `app_${Date.now()}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const applicationNumber = `APP-2026-${randomSuffix}`;

  const today = new Date().toISOString().split('T')[0];
  const targetDate = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];

  const newApp: Application = {
    id: newId,
    applicationNumber,
    institutionId,
    institutionName: institutionName || 'Chennai Institute of Technology & Engineering (CITE Chennai)',
    category: category || 'EXTENSION_OF_APPROVAL',
    categoryLabel: categoryLabel || 'Extension of Approval (EoA)',
    academicYear: academicYear || '2026-27',
    region: region || 'Southern',
    state: state || 'Tamil Nadu',
    district: district || 'Chennai',
    currentStage: 'SUBMITTED',
    stageLabel: 'Submitted — Pending Scrutiny Assignment',
    status: 'UNDER_REVIEW',
    submissionDate: today,
    targetCompletionDate: targetDate,
    daysInCurrentStage: 0,
    isOverdue: false,
    requiresEVC: category === 'NEW_INSTITUTION' || category === 'NEW_PROGRAMME',
    programmeName: programmeName || 'B.Tech Engineering & Technology',
    intakeProposed: intakeProposed ? Number(intakeProposed) : 120,
    stageHistory: [
      {
        id: `sh_${Date.now()}_1`,
        stage: 'SUBMITTED',
        timestamp: today,
        actorName: actorName || 'Prof. Anand Verma',
        actorRole: (actorRole as UserRole) || 'INSTITUTION',
        action: 'Application Created & Formally Submitted by Institution',
        reason: 'Statutory institutional filing for AY 2026-27 with digital evidence documents.',
        durationDays: 0,
      },
    ],
  };

  applications.unshift(newApp);

  // Log in national audit trail
  AuditService.logEvent({
    actorId: institutionId,
    actorName: actorName || 'Institution Representative',
    actorRole: (actorRole as UserRole) || 'INSTITUTION',
    action: 'APPLICATION_CREATED',
    entityType: 'APPLICATION',
    entityId: newApp.id,
    entityName: newApp.institutionName,
    details: `New approval application ${applicationNumber} (${newApp.categoryLabel}) created and submitted for AY 2026-27.`,
    newValue: 'SUBMITTED',
  });

  res.status(201).json({
    success: true,
    message: 'Application successfully created and submitted.',
    data: newApp,
  });
});

// Concurrency lock for in-flight transitions per application ID
const inFlightTransitions = new Set<string>();

// POST transition application workflow stage
applicationRouter.post('/:id/transition', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { nextStage, actorName, actorRole, action, reason } = req.body;

  // 1. Concurrency guard: reject concurrent mutations on the same application
  if (inFlightTransitions.has(id)) {
    return res.status(409).json({
      success: false,
      error: 'A transition request is currently in progress for this application. Please wait.',
    });
  }

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  const currentApp = applications[appIndex];

  // 2. Idempotency guard: If the application has already achieved the requested stage
  if (currentApp.currentStage === nextStage) {
    if (nextStage === 'APPROVED') {
      return res.status(200).json({
        success: true,
        alreadyCompleted: true,
        message: 'Decision already recorded: Application is already Approved with an active Letter of Approval (LoA).',
        data: { ...currentApp, alreadyCompleted: true },
      });
    }
    return res.status(200).json({
      success: true,
      alreadyCompleted: true,
      message: `Application is already at stage '${currentApp.stageLabel}'.`,
      data: { ...currentApp, alreadyCompleted: true },
    });
  }

  // 3. Prevent illegal re-transitions on already finalized decisions
  if (currentApp.currentStage === 'APPROVED' && nextStage !== 'CLOSED') {
    return res.status(400).json({
      success: false,
      error: "Application is already in APPROVED stage with formal decision recorded. Further action is limited to formal case closure ('CLOSED').",
    });
  }

  if (currentApp.currentStage === 'REJECTED' && nextStage !== 'CLOSED') {
    return res.status(400).json({
      success: false,
      error: "Application is already REJECTED with Speaking Order recorded. Further action is limited to formal case closure ('CLOSED').",
    });
  }

  // 4. Validate transition through the authoritative WorkflowEngine state machine
  const validation = WorkflowEngine.validateTransition(
    currentApp.currentStage,
    nextStage as WorkflowStage,
    actorRole as UserRole,
    currentApp.category
  );

  if (!validation.allowed) {
    const statusCode = validation.reason?.includes('not authorized') ? 403 : 400;
    return res.status(statusCode).json({ success: false, error: validation.reason });
  }

  // 5. Apply transition atomically under concurrency lock
  inFlightTransitions.add(id);
  try {
    const updatedApp = WorkflowEngine.applyTransition(
      currentApp,
      nextStage as WorkflowStage,
      actorName || 'Authorized Officer',
      actorRole as UserRole,
      action || `Transitioned to ${nextStage}`,
      reason
    );

    applications[appIndex] = updatedApp;

    // Log to digital audit trail
    AuditService.logEvent({
      actorId: actorRole,
      actorName: actorName || 'Authorized User',
      actorRole: actorRole as UserRole,
      action: nextStage === 'APPROVED' ? 'FORMAL_APPROVAL_GRANTED' : 'WORKFLOW_TRANSITION',
      entityType: 'APPLICATION',
      entityId: updatedApp.id,
      entityName: updatedApp.institutionName,
      details: `${action || `Transitioned to ${nextStage}`}. Reason: ${reason || 'Statutory stage milestone completed per APH regulations.'}`,
      previousValue: currentApp.currentStage,
      newValue: nextStage,
    });

    res.json({
      success: true,
      message: `Application successfully transitioned to ${updatedApp.stageLabel}`,
      data: updatedApp,
    });
  } finally {
    inFlightTransitions.delete(id);
  }
});

// POST request clarification / deficiencies
applicationRouter.post('/:id/clarification', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, requestedBy, deadline } = req.body;

  const appIndex = applications.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ success: false, error: 'Application not found' });
  }

  const currentApp = applications[appIndex];
  const updatedApp: Application = {
    ...currentApp,
    currentStage: 'CLARIFICATION_REQUIRED',
    stageLabel: 'Clarification / Deficiency Communicated',
    status: 'ACTION_REQUIRED',
    pendingClarification: {
      requestedBy: requestedBy || 'Scrutiny Officer',
      requestedAt: new Date().toISOString().split('T')[0],
      reason: reason || 'Deficiencies detected during scrutiny review.',
      deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    },
  };

  applications[appIndex] = updatedApp;

  AuditService.logEvent({
    actorId: 'usr_scrut_01',
    actorName: requestedBy || 'Scrutiny Officer',
    actorRole: 'PROCESSING_OFFICER',
    action: 'DEFICIENCY_COMMUNICATED',
    entityType: 'APPLICATION',
    entityId: updatedApp.id,
    entityName: updatedApp.institutionName,
    details: `Deficiencies issued to ${updatedApp.institutionName}. Deadline: ${updatedApp.pendingClarification?.deadline}. Reason: ${reason}`,
  });

  res.json({
    success: true,
    message: 'Clarification request issued to institution.',
    data: updatedApp,
  });
});

export function getApplicationList(): Application[] {
  return applications;
}

export function attachRegulatoryNotice(notice: {
  policyId: string;
  version: string;
  title: string;
  effectiveDate: string;
  impactSummary: string;
}): { affectedCount: number; applicationIds: string[] } {
  const affectedIds: string[] = [];
  const now = new Date();
  const enactedAt = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  applications = applications.map((app) => {
    // Only in-flight applications (not approved or rejected) receive contextual notice
    if (['SUBMITTED', 'SCRUTINY', 'CLARIFICATION_REQUIRED', 'EVC_REQUIRED', 'EVC_SCHEDULED'].includes(app.currentStage)) {
      affectedIds.push(app.id);
      return {
        ...app,
        regulatoryNotice: {
          policyId: notice.policyId,
          version: notice.version,
          title: notice.title,
          effectiveDate: notice.effectiveDate,
          impactSummary: notice.impactSummary,
          status: 'ACTIVE_AMENDMENT',
          enactedAt,
        },
      };
    }
    return app;
  });

  return { affectedCount: affectedIds.length, applicationIds: affectedIds };
}

