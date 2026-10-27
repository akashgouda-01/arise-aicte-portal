import { Router, Request, Response } from 'express';
import { mockInstitutions } from '../data/mockData';
import { Institution } from '../models/types';
import { mockApplications } from '../data/mockData';
import { storedDocuments } from './documentRoutes';

export const institutionRouter = Router();

// In-memory state for institutions
let institutions: Institution[] = [...mockInstitutions];

/**
 * GET /api/institutions
 * List institutions with optional filters (region, state, type, status, search)
 */
institutionRouter.get('/', (req: Request, res: Response) => {
  const { region, state, type, status, search } = req.query;
  let result = [...institutions];

  if (region) {
    result = result.filter((i) => i.region.toLowerCase() === String(region).toLowerCase());
  }
  if (state) {
    result = result.filter((i) => i.state.toLowerCase() === String(state).toLowerCase());
  }
  if (type) {
    result = result.filter((i) => i.institutionType === type);
  }
  if (status) {
    result = result.filter((i) => i.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.city.toLowerCase().includes(q) ||
        i.district.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

/**
 * GET /api/institutions/:id
 * Retrieve a specific institution profile
 */
institutionRouter.get('/:id', (req: Request, res: Response) => {
  const inst = institutions.find((i) => i.id === req.params.id);
  if (!inst) {
    return res.status(404).json({ success: false, error: 'Institution not found.' });
  }

  // Correlate live applications and evidence
  const apps = mockApplications.filter((a) => a.institutionId === inst.id);
  const evis = storedDocuments.filter((e) => e.institutionId === inst.id && e.isCurrentVersion !== false);

  res.json({
    success: true,
    data: {
      ...inst,
      applications: apps,
      evidenceSummary: {
        total: evis.length,
        verified: evis.filter((e) => e.status === 'VERIFIED').length,
        pendingReview: evis.filter((e) => e.status === 'RECEIVED' || e.status === 'NEEDS_REVIEW').length,
        expiring: evis.filter((e) => e.isExpiringSoon || e.status === 'EXPIRING').length,
        expired: evis.filter((e) => e.isExpired || e.status === 'EXPIRED').length,
      },
    },
  });
});

/**
 * GET /api/institutions/:id/applications
 */
institutionRouter.get('/:id/applications', (req: Request, res: Response) => {
  const apps = mockApplications.filter((a) => a.institutionId === req.params.id);
  res.json({
    success: true,
    count: apps.length,
    data: apps,
  });
});
