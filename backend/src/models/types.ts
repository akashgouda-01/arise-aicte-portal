export type UserRole =
  | 'INSTITUTION'
  | 'PROCESSING_OFFICER'
  | 'EVC_COMMITTEE_MEMBER'
  | 'REGIONAL_OFFICER'
  | 'CENTRAL_DECISION_MAKER'
  // Legacy aliases
  | 'EVC_MEMBER'
  | 'COMMITTEE_MEMBER'
  | 'CENTRAL_OFFICER'
  | 'DECISION_MAKER'
  | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  organization: string;
  institutionId?: string;
  region?: string;
  avatarInitials: string;
}

export type ApplicationCategory =
  | 'NEW_INSTITUTION'
  | 'NEW_PROGRAMME'
  | 'EXTENSION_OF_APPROVAL'
  | 'CHANGE_MODIFICATION';

export type WorkflowStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCRUTINY'
  | 'CLARIFICATION_REQUIRED'
  | 'RESUBMITTED'
  | 'EVC_REQUIRED'
  | 'EVC_SCHEDULED'
  | 'EVC_VISIT_COMPLETED'
  | 'REPORT_PENDING'
  | 'COMMITTEE_REVIEW'
  | 'DECISION_PENDING'
  | 'APPROVED'
  | 'DEFICIENCY_COMMUNICATED'
  | 'REJECTED'
  | 'CLOSED';

export interface StageHistoryItem {
  id: string;
  stage: WorkflowStage;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  reason?: string;
  durationDays?: number;
}

export interface Application {
  id: string;
  applicationNumber: string;
  institutionId: string;
  institutionName: string;
  category: ApplicationCategory;
  categoryLabel: string;
  academicYear: string;
  region: string;
  state: string;
  district: string;
  currentStage: WorkflowStage;
  stageLabel: string;
  status: 'IN_PROGRESS' | 'ACTION_REQUIRED' | 'UNDER_REVIEW' | 'DECISION_PENDING' | 'COMPLETED' | 'REJECTED';
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  submissionDate: string;
  targetCompletionDate: string;
  daysInCurrentStage: number;
  isOverdue: boolean;
  requiresEVC: boolean;
  programmeName?: string;
  intakeProposed?: number;
  stageHistory: StageHistoryItem[];
  pendingClarification?: {
    requestedBy: string;
    requestedAt: string;
    reason: string;
    deadline: string;
    responseReceived?: string;
  };
  regulatoryNotice?: {
    policyId: string;
    version: string;
    title: string;
    effectiveDate: string;
    impactSummary: string;
    status: 'ACTIVE_AMENDMENT' | 'GRANDFATHERED';
    enactedAt: string;
  };
  formalDecision?: FormalDecisionRecord;
}

export interface FormalDecisionRecord {
  orderSerial: string;
  decision: 'APPROVED' | 'REJECTED' | 'REMANDED';
  decidedBy: string;
  decidedRole: UserRole;
  decidedAt: string;
  statutoryRationale: string;
  letterOfApprovalUrl?: string;
}

export type ComplianceStatus =
  | 'MISSING'
  | 'RECEIVED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'NOT_APPLICABLE';

export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  clauseReference: string;
  description: string;
  applicableCategory: ApplicationCategory | 'ALL';
  evidenceType: string;
  validityMonths?: number;
  verificationRequiredBy: UserRole;
  ruleVersion?: string;
}

export type TaskType =
  | 'EVIDENCE_VERIFICATION'
  | 'CLARIFICATION_REVIEW'
  | 'CLARIFICATION_RESPONSE'
  | 'EXPIRY_REVIEW'
  | 'EVC_SCHEDULING'
  | 'INSPECTION_REPORT_REVIEW'
  | 'POLICY_IMPACT_REVIEW'
  | 'RULE_PUBLICATION_APPROVAL';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED' | 'ESCALATED';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PortalTask {
  id: string;
  taskType: TaskType;
  title: string;
  applicationId?: string;
  applicationNumber?: string;
  institutionId?: string;
  institutionName?: string;
  category?: string;
  currentStage?: string;
  requirementId?: string;
  requirementCode?: string;
  relatedPolicyId?: string;
  policyVersion?: string;
  assignedRole: UserRole;
  assignedToName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  completedAt?: string;
  sourceEvent: string;
  allowedActions: string[];
  resolutionReason?: string;
  targetSection?: string;
}

export interface Institution {
  id: string;
  name: string;
  institutionType: 'ENGINEERING_AND_TECH' | 'POLYTECHNIC' | 'MANAGEMENT' | 'PHARMACY' | 'ALLIED';
  institutionTypeLabel: string;
  state: string;
  district: string;
  city: string;
  region: string;
  assignedRegionalOffice: string;
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  status: 'ACTIVE' | 'UNDER_SCRUTINY' | 'SANCTIONED' | 'DEFICIENT' | 'SUSPENDED';
  academicYear: string;
  applicationCount: number;
  complianceScore: number;
  pendingTasksCount: number;
  isSyntheticDemo: boolean;
}

export interface InspectionAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: string;
  storageKey?: string;
  checksum?: string;
}

export interface EvidenceDocument {
  id: string;
  requirementId: string;
  institutionId: string;
  applicationId?: string;
  fileName: string;
  fileSize: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storageKey?: string;
  checksum?: string;
  version?: number;
  previousVersionId?: string;
  isCurrentVersion?: boolean;
  downloadUrl?: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy: string;
  issueDate?: string;
  expiryDate?: string;
  status: ComplianceStatus;
  verificationNotes?: string;
  internalOfficerNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  reviewStatus?: 'PENDING_REVIEW' | 'VERIFIED' | 'DEFICIENT' | 'REJECTED';
  automatedCheck: {
    passed: boolean;
    ruleCode: string;
    message: string;
    requiresHumanReview: boolean;
    suggestedAction: string;
  };
}

export type InspectionStatus =
  | 'AWAITING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'SCHEDULING_PENDING'
  | 'SCHEDULED'
  | 'VISIT_COMPLETED'
  | 'REPORT_PENDING'
  | 'REPORT_SUBMITTED'
  | 'REVIEW_COMPLETED';

export interface InspectionEvidenceItem {
  id: string;
  inspectionId: string;
  category: string;
  title: string;
  notes?: string;
  severity?: 'SATISFACTORY' | 'DEFICIENT' | 'CRITICAL';
  imageUrl: string;
  fileName?: string;
  fileSize?: string;
  geo: {
    lat: number;
    lng: number;
    address: string;
    accuracy?: number;
  };
  capturedAt: string;
  capturedBy: string;
  mapboxStaticUrl?: string;
  voiceNoteUrl?: string;
}

export interface EVCInspection {
  id: string;
  inspectionNumber: string;
  applicationId: string;
  institutionId: string;
  institutionName: string;
  category: ApplicationCategory;
  region: string;
  scheduledDate?: string;
  reportingDeadline?: string;
  status: InspectionStatus;
  leadExpertName?: string;
  leadExpertOrganization?: string;
  teamMembers: string[];
  inspectionType: 'PHYSICAL_ON_SITE' | 'ONLINE_VIRTUAL' | 'SURPRISE_VIGILANCE';
  visitOutcome?: 'SATISFACTORY' | 'DEFICIENCIES_FOUND' | 'SERIOUS_IRREGULARITIES';
  reportSummary?: string;
  reportSubmittedAt?: string;
  committeeRecommendation?: 'RECOMMEND_APPROVAL' | 'RECOMMEND_DEFICIENCY_HEARING' | 'RECOMMEND_REJECTION';
  committeeReviewedAt?: string;
  committeeRemarks?: string;
  attachedReports?: InspectionAttachment[];
  evidencePhotos?: InspectionEvidenceItem[];
  voiceNotes?: { id: string; url: string; duration?: string; capturedAt: string; title?: string }[];
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category: 'DEADLINE' | 'EVC' | 'DOCUMENT_EXPIRY' | 'ESCALATION' | 'POLICY' | 'SYSTEM';
  applicationId?: string;
  institutionId?: string;
  institutionName?: string;
  region?: string;
  responsibleRole: UserRole;
  deadline?: string;
  isEscalated: boolean;
  escalationLevel?: number;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  recommendedAction: string;
}

export type RegulatoryStatus =
  | 'DRAFT'
  | 'COMPARISON_READY'
  | 'IMPACT_ASSESSED'
  | 'UNDER_HUMAN_REVIEW'
  | 'APPROVED_FOR_PUBLICATION'
  | 'PUBLISHED';

export interface RegulatoryPolicy {
  id: string;
  version: string;
  title: string;
  handbookYear: string;
  gazetteReference: string;
  effectiveDate: string;
  status: RegulatoryStatus;
  sourceUrl?: string;
  clausesChangedCount: number;
  affectedRequirementsCount: number;
  affectedApplicationsCount: number;
  summaryOfChanges: string;
  previousVersion: string;
  differences: {
    clauseNumber: string;
    sectionTitle: string;
    changeType: 'ADDITION' | 'DELETION' | 'AMENDMENT';
    oldText?: string;
    newText: string;
    impactLevel: 'CRITICAL' | 'MODERATE' | 'LOW';
    affectedRequirementCodes: string[];
  }[];
  transitionPolicy: string;
  publishedBy?: string;
  publishedAt?: string;
  auditTrailNotes: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'APPLICATION' | 'EVIDENCE' | 'INSPECTION' | 'POLICY' | 'ALERT' | 'USER_CONFIG';
  entityId: string;
  entityName: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
}
