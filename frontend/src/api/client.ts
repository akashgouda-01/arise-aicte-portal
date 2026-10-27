import {
  Application,
  ComplianceRequirement,
  EvidenceDocument,
  EVCInspection,
  InspectionEvidenceItem,
  RegulatoryPolicy,
  SystemAlert,
  AuditEvent,
  User,
  UserRole,
  WorkflowStage,
  PortalTask,
  Institution,
} from '../types';
import { CEIFinding } from '../services/ceiEngine';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Applications
  async getApplications(params?: Record<string, string>): Promise<Application[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/applications${query}`);
    return handleResponse<Application[]>(res);
  },

  async getApplicationById(id: string): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}`);
    return handleResponse<Application>(res);
  },

  async createApplication(data: Record<string, any>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Application>(res);
  },

  async transitionApplication(
    id: string,
    data: { nextStage: WorkflowStage; actorName: string; actorRole: UserRole; action: string; reason?: string }
  ): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Application>(res);
  },

  async requestClarification(
    id: string,
    data: { reason: string; requestedBy: string; deadline?: string }
  ): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}/clarification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Application>(res);
  },

  // Compliance & CEI
  async getRequirements(): Promise<ComplianceRequirement[]> {
    const res = await fetch(`${API_BASE}/compliance/requirements`);
    return handleResponse<ComplianceRequirement[]>(res);
  },

  async getEvidence(params?: Record<string, string>): Promise<EvidenceDocument[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/compliance/evidence${query}`);
    return handleResponse<EvidenceDocument[]>(res);
  },

  async getCEIFindings(): Promise<CEIFinding[]> {
    const res = await fetch(`${API_BASE}/compliance/findings`);
    return handleResponse<CEIFinding[]>(res);
  },

  async submitEvidence(data: {
    requirementId: string;
    fileName: string;
    documentType?: string;
    institutionId?: string;
    applicationId?: string;
    issueDate?: string;
    expiryDate?: string;
    uploadedBy?: string;
  }): Promise<EvidenceDocument> {
    const res = await fetch(`${API_BASE}/compliance/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EvidenceDocument>(res);
  },

  async verifyEvidence(
    id: string,
    data: { verifiedBy: string; actorRole: UserRole; outcome: 'APPROVED' | 'REJECTED'; verificationNotes?: string }
  ): Promise<EvidenceDocument> {
    const res = await fetch(`${API_BASE}/compliance/evidence/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EvidenceDocument>(res);
  },

  // EVC & Inspections
  async getInspections(params?: Record<string, string>): Promise<EVCInspection[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/inspections${query}`);
    return handleResponse<EVCInspection[]>(res);
  },

  async getInspectionById(id: string): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${id}`);
    return handleResponse<EVCInspection>(res);
  },

  async scheduleInspection(
    id: string,
    data: { scheduledDate: string; reportingDeadline: string; leadExpertName?: string; teamMembers?: string[]; actorName: string; actorRole: UserRole }
  ): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EVCInspection>(res);
  },

  async completeInspectionVisit(
    id: string,
    data: { visitOutcome: 'SATISFACTORY' | 'DEFICIENCIES_FOUND' | 'SERIOUS_IRREGULARITIES'; actorName: string; actorRole: UserRole }
  ): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${id}/complete-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EVCInspection>(res);
  },

  async submitInspectionReport(
    id: string,
    data: { reportSummary: string; actorName: string; actorRole: UserRole }
  ): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${id}/submit-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EVCInspection>(res);
  },

  async recordCommitteeReview(
    id: string,
    data: { recommendation: 'RECOMMEND_APPROVAL' | 'RECOMMEND_DEFICIENCY_HEARING' | 'RECOMMEND_REJECTION'; remarks: string; actorName: string; actorRole: UserRole }
  ): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${id}/committee-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<EVCInspection>(res);
  },

  async uploadInspectionEvidence(
    inspectionId: string,
    formData: FormData
  ): Promise<{ success: boolean; data: EVCInspection; evidenceItem: InspectionEvidenceItem }> {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/evidence`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed with HTTP ${res.status}`);
    }
    return res.json();
  },

  async deleteInspectionEvidence(inspectionId: string, evidenceId: string): Promise<EVCInspection> {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
    return handleResponse<EVCInspection>(res);
  },

  // Regulatory Policies
  async getPolicies(): Promise<RegulatoryPolicy[]> {
    const res = await fetch(`${API_BASE}/policies`);
    return handleResponse<RegulatoryPolicy[]>(res);
  },

  async getPolicyById(id: string): Promise<RegulatoryPolicy & { affectedApplications?: any[]; liveAffectedCount?: number }> {
    const res = await fetch(`${API_BASE}/policies/${id}`);
    return handleResponse<RegulatoryPolicy & { affectedApplications?: any[]; liveAffectedCount?: number }>(res);
  },

  async publishPolicy(
    id: string,
    data: { publishedBy: string; actorRole: UserRole; gazetteReference?: string; transitionPolicy?: string }
  ): Promise<RegulatoryPolicy> {
    const res = await fetch(`${API_BASE}/policies/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RegulatoryPolicy>(res);
  },

  // Alerts & Audit
  async getAlerts(params?: Record<string, string>): Promise<SystemAlert[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/alerts${query}`);
    return handleResponse<SystemAlert[]>(res);
  },

  async resolveAlert(id: string, data: { resolvedBy: string; actorRole: UserRole; notes?: string }): Promise<SystemAlert> {
    const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SystemAlert>(res);
  },

  async escalateAlert(id: string, data: { escalatedBy: string; actorRole: UserRole; reason?: string }): Promise<SystemAlert> {
    const res = await fetch(`${API_BASE}/alerts/${id}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SystemAlert>(res);
  },

  async getAuditEvents(params?: Record<string, string>): Promise<AuditEvent[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/audit${query}`);
    return handleResponse<AuditEvent[]>(res);
  },

  // Users & Roles
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`);
    return handleResponse<User[]>(res);
  },

  async getUserByRole(role: UserRole): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/user-by-role/${role}`);
    return handleResponse<User>(res);
  },

  // Shared Tasks Engine
  async getTasks(params?: Record<string, string>): Promise<PortalTask[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/tasks${query}`);
    return handleResponse<PortalTask[]>(res);
  },

  async createTask(data: Partial<PortalTask>): Promise<PortalTask> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<PortalTask>(res);
  },

  async resolveTask(
    id: string,
    data: { resolvedBy: string; actorRole: UserRole; resolutionReason?: string; status?: string }
  ): Promise<PortalTask> {
    const res = await fetch(`${API_BASE}/tasks/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<PortalTask>(res);
  },

  // Institutions Directory
  async getInstitutions(params?: Record<string, string>): Promise<Institution[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/institutions${query}`);
    return handleResponse<Institution[]>(res);
  },

  async getInstitutionById(id: string): Promise<Institution> {
    const res = await fetch(`${API_BASE}/institutions/${id}`);
    return handleResponse<Institution>(res);
  },

  // Secure Document Upload & Management
  async uploadDocument(formData: FormData): Promise<{ document: EvidenceDocument; task?: PortalTask; message: string }> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData, // Browser sets multipart boundary automatically
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    const doc: EvidenceDocument = json.document || json.data || json;
    return {
      document: doc,
      task: json.task,
      message: json.message || 'Document uploaded successfully',
    };
  },

  async getDocuments(params?: Record<string, string>): Promise<EvidenceDocument[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/documents${query}`);
    return handleResponse<EvidenceDocument[]>(res);
  },

  getDocumentDownloadUrl(id: string): string {
    return `${API_BASE}/documents/${id}/download`;
  },
};

