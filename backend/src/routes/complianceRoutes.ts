import { Router, Request, Response } from 'express';
import { mockRequirements, mockEvidenceDocuments } from '../data/mockData';
import { ComplianceRequirement, EvidenceDocument, UserRole } from '../models/types';
import { CEIEngine } from '../services/ceiEngine';
import { AuditService } from '../services/auditService';
import { createTaskInternal } from './taskRoutes';

export const complianceRouter = Router();

let requirements: ComplianceRequirement[] = [...mockRequirements];
let evidenceDocuments: EvidenceDocument[] = [...mockEvidenceDocuments];

// GET requirements
complianceRouter.get('/requirements', (_req: Request, res: Response) => {
  res.json({
    success: true,
    count: requirements.length,
    data: requirements,
  });
});

// GET evidence documents
complianceRouter.get('/evidence', (req: Request, res: Response) => {
  const { applicationId, institutionId, status } = req.query;
  let result = [...evidenceDocuments];

  if (applicationId) {
    result = result.filter((e) => e.applicationId === applicationId);
  }
  if (institutionId) {
    result = result.filter((e) => e.institutionId === institutionId);
  }
  if (status) {
    result = result.filter((e) => e.status === status);
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET CEI findings (Compliance Evidence Intelligence)
complianceRouter.get('/findings', (_req: Request, res: Response) => {
  const findings = CEIEngine.evaluateCompliance(requirements, evidenceDocuments);
  res.json({
    success: true,
    count: findings.length,
    data: findings,
  });
});

// POST submit new evidence document
complianceRouter.post('/evidence', (req: Request, res: Response) => {
  const { requirementId, institutionId, applicationId, fileName, documentType, issueDate, expiryDate, uploadedBy } = req.body;

  if (!requirementId || !fileName) {
    return res.status(400).json({ success: false, error: 'requirementId and fileName are required' });
  }

  const reqDoc = requirements.find((r) => r.id === requirementId);
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  // Compute expiry diff
  let daysUntilExpiry: number | undefined;
  let isExpiringSoon = false;
  let isExpired = false;

  if (expiryDate) {
    const exp = new Date(expiryDate);
    daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    isExpired = daysUntilExpiry <= 0;
    isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }

  const newDoc: EvidenceDocument = {
    id: `evi_${Date.now()}`,
    requirementId,
    institutionId: institutionId || 'inst_01',
    applicationId,
    fileName,
    fileSize: '3.2 MB',
    documentType: documentType || reqDoc?.evidenceType || 'Compliance Document',
    uploadedAt: timestamp,
    uploadedBy: uploadedBy || 'Institution Representative',
    issueDate,
    expiryDate,
    status: isExpired ? 'EXPIRED' : 'RECEIVED',
    daysUntilExpiry,
    isExpiringSoon,
    isExpired,
    automatedCheck: {
      passed: !isExpired,
      ruleCode: 'CHECK-DOC-INTAKE',
      message: isExpired ? 'Document submitted with an expired validity date.' : 'Document format, digital signature, and metadata successfully validated.',
      requiresHumanReview: true,
      suggestedAction: isExpired ? 'Upload current renewed order.' : 'Awaiting scrutiny officer verification.',
    },
  };

  evidenceDocuments.unshift(newDoc);

  // Create review task for assigned scrutiny officer
  createTaskInternal({
    taskType: 'EVIDENCE_VERIFICATION',
    title: `Verify Submitted Evidence: ${fileName} (${reqDoc?.code || 'Norm'})`,
    applicationId,
    institutionId: newDoc.institutionId,
    requirementId,
    requirementCode: reqDoc?.code,
    assignedRole: 'PROCESSING_OFFICER',
    assignedToName: 'Dr. Ramesh Chandra',
    status: 'PENDING',
    priority: isExpired ? 'CRITICAL' : 'HIGH',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    isOverdue: false,
    sourceEvent: `Institution representative ${uploadedBy || 'Applicant'} uploaded ${fileName} for statutory requirement ${reqDoc?.code}.`,
    allowedActions: ['VERIFY_EVIDENCE', 'REQUEST_CLARIFICATION', 'FLAG_DEFICIENCY'],
    targetSection: 'compliance-evidence',
  });

  AuditService.logEvent({
    actorId: 'institution',
    actorName: uploadedBy || 'Institution Representative',
    actorRole: 'INSTITUTION',
    action: 'EVIDENCE_UPLOADED',
    entityType: 'EVIDENCE',
    entityId: newDoc.id,
    entityName: fileName,
    details: `Evidence uploaded for requirement ${reqDoc?.code || requirementId}: ${fileName} (${newDoc.documentType})`,
  });

  res.json({
    success: true,
    message: 'Evidence document submitted successfully.',
    data: newDoc,
  });
});

// POST verify or reject evidence document
complianceRouter.post('/evidence/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { verifiedBy, actorRole, outcome, verificationNotes } = req.body;

  const docIndex = evidenceDocuments.findIndex((e) => e.id === id);
  if (docIndex === -1) {
    return res.status(404).json({ success: false, error: 'Evidence document not found' });
  }

  const currentDoc = evidenceDocuments[docIndex];
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const newStatus = outcome === 'APPROVED' ? 'VERIFIED' : 'NEEDS_REVIEW';

  const updatedDoc: EvidenceDocument = {
    ...currentDoc,
    status: newStatus,
    verificationNotes: verificationNotes || (outcome === 'APPROVED' ? 'Verified compliant with APH norms.' : 'Deficiency noted during review.'),
    verifiedBy: verifiedBy || 'Scrutiny Officer',
    verifiedAt: timestamp,
    automatedCheck: {
      ...currentDoc.automatedCheck,
      passed: outcome === 'APPROVED',
      requiresHumanReview: false,
      suggestedAction: outcome === 'APPROVED' ? 'Verified compliance recorded.' : 'Clarification / resubmission requested.',
    },
  };

  evidenceDocuments[docIndex] = updatedDoc;

  AuditService.logEvent({
    actorId: actorRole || 'officer',
    actorName: verifiedBy || 'Scrutiny Officer',
    actorRole: (actorRole as UserRole) || 'PROCESSING_OFFICER',
    action: outcome === 'APPROVED' ? 'EVIDENCE_VERIFIED' : 'EVIDENCE_DEFICIENCY_NOTED',
    entityType: 'EVIDENCE',
    entityId: updatedDoc.id,
    entityName: updatedDoc.fileName,
    details: `Officer ${verifiedBy} recorded outcome '${outcome}' for ${updatedDoc.fileName}. Notes: ${verificationNotes}`,
    previousValue: currentDoc.status,
    newValue: newStatus,
  });

  res.json({
    success: true,
    message: `Document verification outcome recorded: ${newStatus}`,
    data: updatedDoc,
  });
});
