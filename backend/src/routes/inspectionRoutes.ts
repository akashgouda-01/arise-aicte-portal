import { Router, Request, Response } from 'express';
import multer from 'multer';
import { mockInspections } from '../data/mockData';
import { EVCInspection, InspectionEvidenceItem, UserRole } from '../models/types';
import { AuditService } from '../services/auditService';
import { StorageService, MAX_FILE_SIZE_BYTES } from '../services/storageService';

export const inspectionRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

let inspections: EVCInspection[] = [...mockInspections];

// GET all inspections
inspectionRouter.get('/', (req: Request, res: Response) => {
  const { region, status, category, search } = req.query;
  let result = [...inspections];

  if (region) {
    result = result.filter((i) => i.region.toLowerCase() === String(region).toLowerCase());
  }
  if (status) {
    result = result.filter((i) => i.status === status);
  }
  if (category) {
    result = result.filter((i) => i.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (i) =>
        i.inspectionNumber.toLowerCase().includes(q) ||
        i.institutionName.toLowerCase().includes(q) ||
        (i.leadExpertName && i.leadExpertName.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// GET inspection by ID
inspectionRouter.get('/:id', (req: Request, res: Response) => {
  const insp = inspections.find((i) => i.id === req.params.id);
  if (!insp) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }
  res.json({ success: true, data: insp });
});

// POST schedule inspection
inspectionRouter.post('/:id/schedule', (req: Request, res: Response) => {
  const { id } = req.params;
  const { scheduledDate, reportingDeadline, leadExpertName, leadExpertOrganization, teamMembers, actorName, actorRole } = req.body;

  const idx = inspections.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }

  const current = inspections[idx];
  const updated: EVCInspection = {
    ...current,
    status: 'SCHEDULED',
    scheduledDate: scheduledDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    reportingDeadline: reportingDeadline || new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    leadExpertName: leadExpertName || current.leadExpertName,
    leadExpertOrganization: leadExpertOrganization || current.leadExpertOrganization,
    teamMembers: teamMembers && teamMembers.length > 0 ? teamMembers : current.teamMembers,
  };

  inspections[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'usr_evc_01',
    actorName: actorName || 'EVC Coordinator',
    actorRole: (actorRole as UserRole) || 'EVC_MEMBER',
    action: 'EVC_SCHEDULED',
    entityType: 'INSPECTION',
    entityId: updated.id,
    entityName: updated.institutionName,
    details: `Inspection ${updated.inspectionNumber} scheduled for ${updated.scheduledDate}. Lead Expert: ${updated.leadExpertName}`,
    previousValue: current.status,
    newValue: 'SCHEDULED',
  });

  res.json({
    success: true,
    message: 'Inspection successfully scheduled.',
    data: updated,
  });
});

// POST complete visit
inspectionRouter.post('/:id/complete-visit', (req: Request, res: Response) => {
  const { id } = req.params;
  const { visitOutcome, actorName, actorRole } = req.body;

  const idx = inspections.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }

  const current = inspections[idx];
  const updated: EVCInspection = {
    ...current,
    status: 'REPORT_PENDING',
    visitOutcome: visitOutcome || 'SATISFACTORY',
  };

  inspections[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'usr_evc_01',
    actorName: actorName || 'EVC Expert',
    actorRole: (actorRole as UserRole) || 'EVC_MEMBER',
    action: 'EVC_VISIT_COMPLETED',
    entityType: 'INSPECTION',
    entityId: updated.id,
    entityName: updated.institutionName,
    details: `On-site visit completed for ${updated.institutionName}. Outcome: ${visitOutcome || 'SATISFACTORY'}`,
    previousValue: current.status,
    newValue: 'REPORT_PENDING',
  });

  res.json({
    success: true,
    message: 'Visit marked completed. Upload of formal EVC report is now due.',
    data: updated,
  });
});

// POST submit report
inspectionRouter.post('/:id/submit-report', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reportSummary, actorName, actorRole } = req.body;

  const idx = inspections.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }

  const current = inspections[idx];
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const updated: EVCInspection = {
    ...current,
    status: 'REPORT_SUBMITTED',
    reportSummary: reportSummary || 'Expert Visit Committee verified campus infrastructure, labs, and faculty registers.',
    reportSubmittedAt: timestamp,
  };

  inspections[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'usr_evc_01',
    actorName: actorName || 'Lead Expert',
    actorRole: (actorRole as UserRole) || 'EVC_MEMBER',
    action: 'EVC_REPORT_SUBMITTED',
    entityType: 'INSPECTION',
    entityId: updated.id,
    entityName: updated.institutionName,
    details: `Signed EVC report submitted for ${updated.institutionName}. Summary: ${reportSummary}`,
    previousValue: current.status,
    newValue: 'REPORT_SUBMITTED',
  });

  res.json({
    success: true,
    message: 'EVC report successfully submitted and recorded.',
    data: updated,
  });
});

// POST committee review
inspectionRouter.post('/:id/committee-review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { recommendation, remarks, actorName, actorRole } = req.body;

  const idx = inspections.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }

  const current = inspections[idx];
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

  const updated: EVCInspection = {
    ...current,
    status: 'REVIEW_COMPLETED',
    committeeRecommendation: recommendation || 'RECOMMEND_APPROVAL',
    committeeRemarks: remarks || 'SAC reviewed inspection report and confirms compliance with APH.',
    committeeReviewedAt: timestamp,
  };

  inspections[idx] = updated;

  AuditService.logEvent({
    actorId: actorRole || 'usr_sac_01',
    actorName: actorName || 'Committee Member Secretary',
    actorRole: (actorRole as UserRole) || 'COMMITTEE_MEMBER',
    action: 'COMMITTEE_REVIEW_COMPLETED',
    entityType: 'INSPECTION',
    entityId: updated.id,
    entityName: updated.institutionName,
    details: `SAC / SHC completed review with recommendation: '${updated.committeeRecommendation}'. Remarks: ${remarks}`,
    previousValue: current.status,
    newValue: 'REVIEW_COMPLETED',
  });

  res.json({
    success: true,
    message: 'Committee findings and recommendation recorded.',
    data: updated,
  });
});

// POST /api/inspections/:id/evidence
// Upload on-site live inspection evidence photo with Mapbox geolocation, timestamp, address & voice note
inspectionRouter.post(
  '/:id/evidence',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const idx = inspections.findIndex((i) => i.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Inspection not found' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const photoFile = files?.['photo']?.[0];
      const voiceFile = files?.['voiceNote']?.[0];

      const {
        category,
        title,
        notes,
        severity,
        lat,
        lng,
        address,
        accuracy,
        capturedAt,
        capturedBy,
        mapboxStaticUrl,
        imageUrl: directImageUrl,
        voiceNoteUrl: directVoiceNoteUrl,
      } = req.body;

      let finalImageUrl = directImageUrl || '';
      let fileName = photoFile?.originalname || 'evc_evidence_photo.jpg';
      let fileSize = '';

      if (photoFile) {
        const stored = await StorageService.saveBuffer(
          photoFile.buffer,
          photoFile.originalname,
          photoFile.mimetype
        );
        finalImageUrl = `/api/documents/${stored.storageKey}/download`;
        fileName = stored.sanitizedName;
        fileSize = stored.formattedSize;
      }

      let finalVoiceUrl = directVoiceNoteUrl;
      if (voiceFile) {
        const storedVoice = await StorageService.saveBuffer(
          voiceFile.buffer,
          voiceFile.originalname,
          voiceFile.mimetype
        );
        finalVoiceUrl = `/api/documents/${storedVoice.storageKey}/download`;
      }

      const now = new Date();
      const timestampStr =
        capturedAt ||
        `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN')} IST`;

      const numLat = parseFloat(lat) || 28.6139;
      const numLng = parseFloat(lng) || 77.209;

      const mapboxToken =
        process.env.MAPBOX_ACCESS_TOKEN ||
        'pk.eyJ1Ijoic2loLWFpY3RlIiwiYSI6ImNtMGV2YzBucjAxMGMyanB4bzJ2YzAxbW4ifQ.demo_evc_token';
      const fallbackMapbox = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${numLng},${numLat})/${numLng},${numLat},15/300x300?access_token=${mapboxToken}`;

      const evidenceItem: InspectionEvidenceItem = {
        id: `evc_ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        inspectionId: String(id),
        category: category || 'On-Site Physical Infrastructure',
        title: title || 'Inspection Verification Photo',
        notes: notes || undefined,
        severity: (severity as any) || 'SATISFACTORY',
        imageUrl: finalImageUrl,
        fileName,
        fileSize: fileSize || '1.2 MB',
        geo: {
          lat: numLat,
          lng: numLng,
          address: address || 'Campus Physical Verification Site',
          accuracy: accuracy ? parseFloat(accuracy) : 4.5,
        },
        capturedAt: timestampStr,
        capturedBy: capturedBy || 'Scrutiny Officer / EVC Expert',
        mapboxStaticUrl: mapboxStaticUrl || fallbackMapbox,
        voiceNoteUrl: finalVoiceUrl || undefined,
      };

      const current = inspections[idx];
      const existingEvidence = current.evidencePhotos || [];
      const updatedEvidence = [...existingEvidence, evidenceItem];

      const updated: EVCInspection = {
        ...current,
        evidencePhotos: updatedEvidence,
      };

      inspections[idx] = updated;

      AuditService.logEvent({
        actorId: capturedBy || 'usr_evc',
        actorName: capturedBy || 'Scrutiny Officer / EVC Expert',
        actorRole: (current.leadExpertName ? 'EVC_MEMBER' : 'PROCESSING_OFFICER') as UserRole,
        action: 'EVC_EVIDENCE_RECORDED',
        entityType: 'INSPECTION',
        entityId: updated.id,
        entityName: updated.institutionName,
        details: `Geo-tagged live evidence captured: "${evidenceItem.title}" at coordinates (${evidenceItem.geo.lat.toFixed(5)}, ${evidenceItem.geo.lng.toFixed(5)}) with Mapbox pin verification.`,
        newValue: `${updatedEvidence.length} Evidence Photo(s) Attached`,
      });

      res.status(201).json({
        success: true,
        message: 'Inspection evidence item successfully recorded.',
        data: updated,
        evidenceItem,
      });
    } catch (err: any) {
      console.error('Error saving inspection evidence:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to save evidence.' });
    }
  }
);

// DELETE /api/inspections/:id/evidence/:evidenceId
// Delete a specific evidence item
inspectionRouter.delete('/:id/evidence/:evidenceId', (req: Request, res: Response) => {
  const { id, evidenceId } = req.params;
  const idx = inspections.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Inspection not found' });
  }

  const current = inspections[idx];
  const updatedEvidence = (current.evidencePhotos || []).filter((e) => e.id !== evidenceId);

  const updated: EVCInspection = {
    ...current,
    evidencePhotos: updatedEvidence,
  };

  inspections[idx] = updated;

  AuditService.logEvent({
    actorId: 'usr_evc',
    actorName: 'Scrutiny Officer / EVC Expert',
    actorRole: 'EVC_MEMBER',
    action: 'EVC_EVIDENCE_DELETED',
    entityType: 'INSPECTION',
    entityId: String(id),
    entityName: current.institutionName,
    details: `Evidence item ${evidenceId} removed from inspection docket.`,
    newValue: `${updatedEvidence.length} Evidence Photo(s) Remaining`,
  });

  res.json({
    success: true,
    message: 'Evidence item removed.',
    data: updated,
  });
});
