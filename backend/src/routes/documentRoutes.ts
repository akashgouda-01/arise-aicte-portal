import { Router, Request, Response } from 'express';
import multer from 'multer';
import { StorageService, MAX_FILE_SIZE_BYTES } from '../services/storageService';
import { AuditService } from '../services/auditService';
import { createTaskInternal } from './taskRoutes';
import { EvidenceDocument, UserRole } from '../models/types';
import { mockEvidenceDocuments } from '../data/mockData';

export const documentRouter = Router();

// In-memory document registry synchronized with evidence documents
export let storedDocuments: EvidenceDocument[] = [...mockEvidenceDocuments];

// Configure Multer with in-memory buffer so we can validate magic bytes & hash before writing to private disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

/**
 * GET /api/documents
 * List documents with optional filters
 */
documentRouter.get('/', (req: Request, res: Response) => {
  const { applicationId, institutionId, requirementId, currentOnly } = req.query;
  let result = [...storedDocuments];

  if (applicationId) {
    result = result.filter((d) => d.applicationId === applicationId);
  }
  if (institutionId) {
    result = result.filter((d) => d.institutionId === institutionId);
  }
  if (requirementId) {
    result = result.filter((d) => d.requirementId === requirementId);
  }
  if (currentOnly === 'true') {
    result = result.filter((d) => d.isCurrentVersion !== false);
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * GET /api/documents/:id
 * Retrieve document metadata
 */
documentRouter.get('/:id', (req: Request, res: Response) => {
  const doc = storedDocuments.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Document record not found' });
  }

  // Find version history chain
  const history = storedDocuments.filter(
    (d) =>
      d.requirementId === doc.requirementId &&
      d.institutionId === doc.institutionId &&
      d.applicationId === doc.applicationId
  ).sort((a, b) => (b.version || 1) - (a.version || 1));

  res.json({
    success: true,
    data: {
      ...doc,
      history,
    },
  });
});

/**
 * GET /api/documents/:id/download
 * Secure document download/view endpoint
 */
documentRouter.get('/:id/download', (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  let doc = storedDocuments.find((d) => d.id === targetId || d.storageKey === targetId);

  if (!doc) {
    const directSafePath = StorageService.getSafePath(targetId);
    if (directSafePath) {
      const ext = targetId.split('.').pop()?.toLowerCase();
      let mime = 'application/octet-stream';
      if (ext === 'png') mime = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'pdf') mime = 'application/pdf';
      else if (ext === 'webm') mime = 'audio/webm';
      else if (ext === 'mp3') mime = 'audio/mpeg';
      else if (ext === 'wav') mime = 'audio/wav';

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="${targetId}"`);
      return res.sendFile(directSafePath);
    }
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  if (!doc.storageKey) {
    // Demo mock record without disk payload - provide dynamic simulated buffer
    res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(`AICTE DEMO STATUTORY EVIDENCE ARCHIVE\nDocument: ${doc.fileName}\nDocument ID: ${doc.id}\nUploaded By: ${doc.uploadedBy}\nTimestamp: ${doc.uploadedAt}\nChecksum: SHA-256 Verified (Mock-Preserved)`);
  }

  const safePath = StorageService.getSafePath(doc.storageKey);
  if (!safePath) {
    return res.status(404).json({ success: false, error: 'Stored binary file not found on server' });
  }

  res.setHeader('Content-Type', doc.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
  res.sendFile(safePath);
});

/**
 * POST /api/documents/upload
 * Multi-part file upload with cryptographic hashing and versioning
 */
documentRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided for upload.' });
    }

    const {
      requirementId,
      institutionId,
      applicationId,
      documentType,
      issueDate,
      expiryDate,
      uploadedBy,
      uploaderRole,
      replaceDocumentId,
      verificationNotes,
    } = req.body;

    if (!requirementId) {
      return res.status(400).json({ success: false, error: 'requirementId is required.' });
    }

    // 1. Store file safely to private disk
    const stored = await StorageService.saveBuffer(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

    // 2. Compute expiry status
    let daysUntilExpiry: number | undefined;
    let isExpiringSoon = false;
    let isExpired = false;

    if (expiryDate) {
      const exp = new Date(expiryDate);
      daysUntilExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      isExpired = daysUntilExpiry <= 0;
      isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }

    // 3. Handle version replacement
    let newVersion = 1;
    let previousVersionId: string | undefined;

    if (replaceDocumentId) {
      const oldDoc = storedDocuments.find((d) => d.id === replaceDocumentId);
      if (oldDoc) {
        oldDoc.isCurrentVersion = false;
        newVersion = (oldDoc.version || 1) + 1;
        previousVersionId = oldDoc.id;
      }
    } else {
      // Check if requirement already has an active document for this application
      const existing = storedDocuments.find(
        (d) =>
          d.requirementId === requirementId &&
          d.applicationId === applicationId &&
          d.isCurrentVersion !== false
      );
      if (existing) {
        existing.isCurrentVersion = false;
        newVersion = (existing.version || 1) + 1;
        previousVersionId = existing.id;
      }
    }

    // 4. Construct new EvidenceDocument
    const newDocId = `doc_${Date.now()}`;
    const newDoc: EvidenceDocument = {
      id: newDocId,
      requirementId,
      institutionId: institutionId || 'inst_01',
      applicationId,
      fileName: stored.sanitizedName,
      fileSize: stored.formattedSize,
      fileSizeBytes: stored.fileSize,
      mimeType: stored.mimeType,
      storageKey: stored.storageKey,
      checksum: stored.checksum,
      version: newVersion,
      previousVersionId,
      isCurrentVersion: true,
      downloadUrl: `/api/documents/${newDocId}/download`,
      documentType: documentType || 'Statutory Compliance Record',
      uploadedAt: timestamp,
      uploadedBy: uploadedBy || 'Authorized Representative',
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      status: isExpired ? 'EXPIRED' : 'RECEIVED',
      reviewStatus: 'PENDING_REVIEW',
      verificationNotes: verificationNotes || undefined,
      daysUntilExpiry,
      isExpiringSoon,
      isExpired,
      automatedCheck: {
        passed: !isExpired,
        ruleCode: 'CHECK-DOC-INTAKE',
        message: isExpired
          ? 'Uploaded document has an expired validity date. Renewal mandatory.'
          : 'Document integrity verified with SHA-256 checksum and format validation.',
        requiresHumanReview: true,
        suggestedAction: isExpired
          ? 'Upload updated validity endorsement.'
          : 'Awaiting scrutiny committee verification.',
      },
    };

    storedDocuments.unshift(newDoc);

    // 5. Dispatch task for Scrutiny Officer
    createTaskInternal({
      taskType: 'EVIDENCE_VERIFICATION',
      title: `Verify ${newDoc.documentType}: ${newDoc.fileName} (${newDoc.institutionId})`,
      applicationId: newDoc.applicationId,
      institutionId: newDoc.institutionId,
      requirementId: newDoc.requirementId,
      assignedRole: 'PROCESSING_OFFICER',
      priority: isExpired ? 'CRITICAL' : 'HIGH',
      status: 'PENDING',
      isOverdue: false,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      sourceEvent: previousVersionId ? 'DOCUMENT_REPLACED' : 'EVIDENCE_SUBMISSION',
      allowedActions: ['VERIFY_COMPLIANT', 'MARK_DEFICIENT', 'REQUEST_RESUBMISSION'],
      targetSection: 'compliance',
    });

    // 6. Record in immutable audit trail
    AuditService.logEvent({
      actorId: 'usr_actor',
      actorName: uploadedBy || 'Institution User',
      actorRole: (uploaderRole as UserRole) || 'INSTITUTION',
      action: previousVersionId ? 'REPLACE_DOCUMENT_VERSION' : 'UPLOAD_STATUTORY_EVIDENCE',
      entityType: 'EVIDENCE',
      entityId: newDoc.id,
      entityName: newDoc.fileName,
      details: `Uploaded ${newDoc.fileName} (${newDoc.fileSize}) for requirement ${newDoc.requirementId}. Checksum: ${(newDoc.checksum || '').slice(0, 16)}...`,
      previousValue: previousVersionId ? `Version ${newVersion - 1}` : undefined,
      newValue: `Version ${newVersion} (${newDoc.status})`,
    });

    res.status(201).json({
      success: true,
      data: newDoc,
      document: newDoc,
      message: `Document '${newDoc.fileName}' uploaded and verified successfully (v${newVersion}).`,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'File upload failed validation checks.',
    });
  }
});
