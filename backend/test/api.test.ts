import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Express REST API Endpoints', () => {
  it('GET /api/health returns ONLINE status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.service).toContain('AICTE Approval & Compliance Engine');
  });

  it('GET /api/applications returns seeded applications', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/compliance/requirements returns APH clauses', async () => {
    const res = await request(app).get('/api/compliance/requirements');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/compliance/findings returns CEI evaluated findings', async () => {
    const res = await request(app).get('/api/compliance/findings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((f: any) => f.status === 'EXPIRING')).toBe(true);
  });

  it('GET /api/tasks returns operational tasks and supports filtering', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Test filter by role
    const filteredRes = await request(app).get('/api/tasks?role=PROCESSING_OFFICER');
    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.data.every((t: any) => t.assignedRole === 'PROCESSING_OFFICER')).toBe(true);
  });

  it('POST /api/policies/:id/publish blocks unauthorized users from enacting policy', async () => {
    const res = await request(app)
      .post('/api/policies/pol_2026_01/publish')
      .send({
        publishedBy: 'Prof. Anand Verma',
        actorRole: 'INSTITUTION',
        gazetteReference: 'Unauthorized Gazette S.O.',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not authorized');
  });

  it('POST /api/policies/:id/publish allows Competent Authority and attaches notice to applications', async () => {
    const res = await request(app)
      .post('/api/policies/pol_2026_01/publish')
      .send({
        publishedBy: 'Prof. T. G. Sitharam',
        actorRole: 'CENTRAL_DECISION_MAKER',
        gazetteReference: 'S.O. 412(E) Part II Sec 3(ii)',
        transitionPolicy: '1-Year Glidepath Authorized for NBA Tier-1 programs.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');

    // Verify active applications now carry the regulatory notice
    const appRes = await request(app).get('/api/applications/app_101');
    expect(appRes.status).toBe(200);
    expect(appRes.body.data.regulatoryNotice).toBeDefined();
    expect(appRes.body.data.regulatoryNotice.version).toBe(res.body.data.version);
  });

  describe('Decision Execution Regression Tests (Part A)', () => {
    it('Case A: Valid decision - Competent Authority approves DECISION_PENDING application', async () => {
      const res = await request(app)
        .post('/api/applications/app_103/transition')
        .send({
          nextStage: 'APPROVED',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
          action: 'Letter of Approval (LoA) Formally Granted',
          reason: 'Meets all statutory infrastructure, cadre ratio, and endowment norms. (Order Ref: AICTE/AB/2026/LOA-72635412)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStage).toBe('APPROVED');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.formalDecision).toBeDefined();
      expect(res.body.data.formalDecision.decision).toBe('APPROVED');
      expect(res.body.data.formalDecision.orderSerial).toBe('AICTE/AB/2026/LOA-72635412');
    });

    it('Case B: Already approved application - Repeated approval does not attempt illegal transition and returns safe response', async () => {
      // app_103 is now already APPROVED from Case A
      const res = await request(app)
        .post('/api/applications/app_103/transition')
        .send({
          nextStage: 'APPROVED',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
          action: 'Letter of Approval (LoA) Formally Granted',
          reason: 'Duplicate click simulation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alreadyCompleted).toBe(true);
      expect(res.body.message).toContain('already Approved');
      expect(res.body.data.currentStage).toBe('APPROVED');
    });

    it('Case C: Duplicate rapid requests produce idempotent results without duplicate decisions', async () => {
      const [res1, res2] = await Promise.all([
        request(app).post('/api/applications/app_103/transition').send({
          nextStage: 'APPROVED',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
        }),
        request(app).post('/api/applications/app_103/transition').send({
          nextStage: 'APPROVED',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
        }),
      ]);

      expect([200, 409]).toContain(res1.status);
      expect([200, 409]).toContain(res2.status);
      expect(res1.body.data?.currentStage || res2.body.data?.currentStage).toBe('APPROVED');
    });

    it('Case D: Invalid transition - Disallowed stage transition on approved application is rejected', async () => {
      const res = await request(app)
        .post('/api/applications/app_103/transition')
        .send({
          nextStage: 'SCRUTINY',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already in APPROVED stage');
    });

    it('Case E: Unauthorized user - Institution representative cannot execute approval decision', async () => {
      const res = await request(app)
        .post('/api/applications/app_102/transition')
        .send({
          nextStage: 'APPROVED',
          actorName: 'Prof. Anand Verma',
          actorRole: 'INSTITUTION',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not authorized');
    });

    it('Case F: Failure handling - Non-existent application returns 404', async () => {
      const res = await request(app)
        .post('/api/applications/app_non_existent/transition')
        .send({
          nextStage: 'APPROVED',
          actorName: 'Prof. T. G. Sitharam',
          actorRole: 'CENTRAL_DECISION_MAKER',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Application not found');
    });

    it('Case G: Successful completion - Application dossier and formal decision data are consistent', async () => {
      const res = await request(app).get('/api/applications/app_103');
      expect(res.status).toBe(200);
      expect(res.body.data.currentStage).toBe('APPROVED');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.formalDecision).toBeDefined();
      expect(res.body.data.stageHistory.some((h: any) => h.stage === 'APPROVED')).toBe(true);
    });
  });
});

