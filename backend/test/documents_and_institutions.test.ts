import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Document Uploads and Institutions API Endpoints', () => {
  let uploadedDocId: string;

  it('GET /api/institutions returns 15 demonstration institutions', async () => {
    const res = await request(app).get('/api/institutions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(15);
    expect(res.body.data.every((i: any) => i.isSyntheticDemo === true)).toBe(true);
  });

  it('GET /api/institutions?region=Western filters by region correctly', async () => {
    const res = await request(app).get('/api/institutions?region=Western');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((i: any) => i.region === 'Western')).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/institutions/:id returns specific institution profile with correlated data', async () => {
    const res = await request(app).get('/api/institutions/inst_01');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('inst_01');
    expect(res.body.data.name).toContain('NITS Bhopal');
    expect(res.body.data.applications).toBeDefined();
    expect(Array.isArray(res.body.data.applications)).toBe(true);
  });

  it('POST /api/documents/upload successfully accepts valid PDF file and returns SHA-256 checksum', async () => {
    // Generate small buffer simulating a PDF
    const dummyPdf = Buffer.from('%PDF-1.4 simulated statutory document for test verification');

    const res = await request(app)
      .post('/api/documents/upload')
      .field('applicationId', 'app_101')
      .field('institutionId', 'inst_01')
      .field('requirementId', 'req_04')
      .field('documentType', 'Endowment Fund Undertaking')
      .field('uploadedBy', 'Prof. Anand Verma')
      .field('actorRole', 'INSTITUTION')
      .field('issueDate', '2026-10-01')
      .field('expiryDate', '2036-09-30')
      .attach('file', dummyPdf, 'Endowment_FDR_Undertaking_2026.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.fileName).toBe('Endowment_FDR_Undertaking_2026.pdf');
    expect(res.body.document.checksum).toBeDefined();
    expect(res.body.document.checksum.length).toBe(64); // SHA-256 hex digest length
    expect(res.body.document.version).toBe(1);
    expect(res.body.document.isCurrentVersion).toBe(true);

    uploadedDocId = res.body.document.id;
  });

  it('POST /api/documents/upload supports version replacement with previousVersionId', async () => {
    const dummyPdfV2 = Buffer.from('%PDF-1.4 updated version 2 of statutory endowment undertaking');

    const res = await request(app)
      .post('/api/documents/upload')
      .field('applicationId', 'app_101')
      .field('institutionId', 'inst_01')
      .field('requirementId', 'req_04')
      .field('documentType', 'Endowment Fund Undertaking')
      .field('uploadedBy', 'Prof. Anand Verma')
      .field('actorRole', 'INSTITUTION')
      .field('previousVersionId', uploadedDocId)
      .attach('file', dummyPdfV2, 'Endowment_FDR_Undertaking_2026_v2.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document.version).toBe(2);
    expect(res.body.document.previousVersionId).toBe(uploadedDocId);
    expect(res.body.document.isCurrentVersion).toBe(true);
  });

  it('POST /api/documents/upload rejects disallowed executable file extension', async () => {
    const maliciousScript = Buffer.from('echo malicious script payload');

    const res = await request(app)
      .post('/api/documents/upload')
      .field('applicationId', 'app_101')
      .field('institutionId', 'inst_01')
      .field('requirementId', 'req_02')
      .field('uploadedBy', 'Attacker')
      .attach('file', maliciousScript, 'unauthorized_script.exe');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('is not permitted');
  });

  it('GET /api/documents/:id/download retrieves stored file with proper headers', async () => {
    const res = await request(app).get(`/api/documents/${uploadedDocId}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('Endowment_FDR_Undertaking_2026.pdf');
  });

  it('POST /api/inspections/:id/evidence records geo-tagged physical evidence with Mapbox metadata', async () => {
    const dummyPhoto = Buffer.from('simulated jpeg image byte stream with geotag watermark');
    const res = await request(app)
      .post('/api/inspections/evc_01/evidence')
      .field('category', 'Computer Centre & Advanced IT Laboratories (Clause 5.2)')
      .field('title', 'AI Supercomputing Cluster Verification')
      .field('notes', 'Verified GPU server racks, dual redundant UPS, and air handling units.')
      .field('severity', 'SATISFACTORY')
      .field('lat', '18.5204')
      .field('lng', '73.8567')
      .field('address', 'Survey No. 42, Senapati Bapat Road, Shivajinagar, Pune, Maharashtra 411016')
      .field('accuracy', '3.5')
      .field('capturedBy', 'Prof. Sunita Kulkarni (Lead Expert)')
      .attach('photo', dummyPhoto, 'EVC_Supercomputing_Cluster.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.evidenceItem).toBeDefined();
    expect(res.body.evidenceItem.geo.lat).toBe(18.5204);
    expect(res.body.evidenceItem.geo.lng).toBe(73.8567);
    expect(res.body.evidenceItem.geo.address).toContain('Pune, Maharashtra');
    expect(res.body.evidenceItem.mapboxStaticUrl).toContain('api.mapbox.com');
    expect(res.body.data.evidencePhotos).toBeDefined();
    expect(res.body.data.evidencePhotos.length).toBeGreaterThan(0);

    const createdEvId = res.body.evidenceItem.id;

    // Verify deletion
    const delRes = await request(app).delete(`/api/inspections/evc_01/evidence/${createdEvId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });
});
