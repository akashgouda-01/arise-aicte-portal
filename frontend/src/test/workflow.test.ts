import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../services/workflowEngine';
import { Application, UserRole, WorkflowStage } from '../types';
import { mockApplications } from '../data/mockData';

describe('WorkflowEngine State Machine & Access Control', () => {
  it('allows Scrutiny Officer to move application from SUBMITTED to SCRUTINY', () => {
    const result = WorkflowEngine.validateTransition(
      'SUBMITTED',
      'SCRUTINY',
      'PROCESSING_OFFICER',
      'NEW_PROGRAMME'
    );
    expect(result.allowed).toBe(true);
  });

  it('rejects Institution from moving application directly to APPROVED', () => {
    const result = WorkflowEngine.validateTransition(
      'SUBMITTED',
      'APPROVED',
      'INSTITUTION',
      'NEW_PROGRAMME'
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('rejects Scrutiny Officer from granting final approval (reserved for DECISION_MAKER)', () => {
    const result = WorkflowEngine.validateTransition(
      'DECISION_PENDING',
      'APPROVED',
      'PROCESSING_OFFICER',
      'NEW_PROGRAMME'
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("User role 'PROCESSING_OFFICER' is not authorized");
  });

  it('allows Competent DECISION_MAKER to grant final approval on DECISION_PENDING', () => {
    const result = WorkflowEngine.validateTransition(
      'DECISION_PENDING',
      'APPROVED',
      'DECISION_MAKER',
      'EXTENSION_OF_APPROVAL'
    );
    expect(result.allowed).toBe(true);
  });

  it('correctly applies transition and appends immutable stage history', () => {
    const initialApp = { ...mockApplications[0], currentStage: 'DECISION_PENDING' as WorkflowStage };
    const updated = WorkflowEngine.applyTransition(
      initialApp,
      'APPROVED',
      'Prof. T. G. Sitharam',
      'DECISION_MAKER',
      'Letter of Approval (LoA) Issued',
      'Passed all scrutiny and statutory criteria.'
    );

    expect(updated.currentStage).toBe('APPROVED');
    expect(updated.status).toBe('COMPLETED');
    expect(updated.stageHistory.length).toBe(initialApp.stageHistory.length + 1);
    const lastHistory = updated.stageHistory[updated.stageHistory.length - 1];
    expect(lastHistory.actorName).toBe('Prof. T. G. Sitharam');
    expect(lastHistory.stage).toBe('APPROVED');
  });
});
