import { describe, it, expect } from 'vitest';
import { CEIEngine } from '../services/ceiEngine';
import { mockRequirements, mockEvidenceDocuments } from '../data/mockData';
import { ComplianceRequirement, EvidenceDocument } from '../types';

describe('Compliance Evidence Intelligence (CEI) Deterministic Checks', () => {
  it('correctly flags missing evidence for unlinked mandatory requirements', () => {
    // Pass requirement with no linked evidence
    const singleReq: ComplianceRequirement[] = [mockRequirements[0]];
    const emptyEvidence: EvidenceDocument[] = [];

    const findings = CEIEngine.evaluateCompliance(singleReq, emptyEvidence);
    expect(findings.length).toBe(1);
    expect(findings[0].status).toBe('MISSING');
    expect(findings[0].issueType).toBe('MISSING_EVIDENCE');
    expect(findings[0].explanation.whoMustActNext).toBe('INSTITUTION');
  });

  it('correctly flags expired document', () => {
    const expiredDoc: EvidenceDocument = {
      ...mockEvidenceDocuments[0],
      id: 'test_exp_01',
      requirementId: 'req_01',
      expiryDate: '2020-01-01',
      status: 'RECEIVED',
    };

    const findings = CEIEngine.evaluateCompliance([mockRequirements[0]], [expiredDoc]);
    expect(findings.length).toBe(1);
    expect(findings[0].status).toBe('EXPIRED');
    expect(findings[0].issueType).toBe('DOCUMENT_EXPIRED');
    expect(findings[0].severity).toBe('CRITICAL');
  });

  it('correctly flags expiring soon document (within 30 days)', () => {
    const in15Days = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const expiringDoc: EvidenceDocument = {
      ...mockEvidenceDocuments[0],
      id: 'test_exp_soon',
      requirementId: 'req_01',
      expiryDate: in15Days,
      status: 'RECEIVED',
    };

    const findings = CEIEngine.evaluateCompliance([mockRequirements[0]], [expiringDoc]);
    expect(findings.length).toBe(1);
    expect(findings[0].status).toBe('EXPIRING');
    expect(findings[0].issueType).toBe('EXPIRING_SOON');
    expect(findings[0].explanation.whatWasDetected).toContain('expires in');
  });

  it('identifies verified compliance when evidence has been formally approved', () => {
    const verifiedDoc: EvidenceDocument = {
      ...mockEvidenceDocuments[0],
      status: 'VERIFIED',
      verifiedBy: 'Dr. Ramesh Chandra',
      expiryDate: '2045-01-01',
    };

    const findings = CEIEngine.evaluateCompliance([mockRequirements[0]], [verifiedDoc]);
    expect(findings.length).toBe(1);
    expect(findings[0].status).toBe('VERIFIED');
    expect(findings[0].issueType).toBe('COMPLIANT');
  });
});
