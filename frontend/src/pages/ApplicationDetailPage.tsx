import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Application, EvidenceDocument, ComplianceRequirement, WorkflowStage } from '../types';
import { CEIFinding } from '../services/ceiEngine';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FileUploadModal } from '../components/ui/FileUploadModal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  UserCheck,
  Shield,
  FileCheck2,
  Building,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Filter,
  Search,
  Scale,
  Send,
  Download,
  Camera,
  MapPin,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isInstitution, isProcessingOfficer, isDecisionMaker, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [application, setApplication] = useState<Application | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceDocument[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [ceiFindings, setCeiFindings] = useState<CEIFinding[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected requirement for deep-dive CEI panel
  const [selectedReqId, setSelectedReqId] = useState<string>('req_01');

  // Filter state for requirement table
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<WorkflowStage | null>(null);
  const [transitionAction, setTransitionAction] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [submittingTransition, setSubmittingTransition] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Clarification / deficiency modal
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [clarificationReason, setClarificationReason] = useState('');
  const [clarificationDeadline, setClarificationDeadline] = useState('');

  // Upload modal for institution
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetReq, setUploadTargetReq] = useState<ComplianceRequirement | null>(null);
  const [uploadExistingDoc, setUploadExistingDoc] = useState<EvidenceDocument | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const [app, evis, reqs, fnds] = await Promise.all([
          api.getApplicationById(id),
          api.getEvidence({ applicationId: id }),
          api.getRequirements(),
          api.getCEIFindings(),
        ]);
        setApplication(app);
        setEvidenceList(evis);
        setRequirements(reqs);
        setCeiFindings(fnds);
      } catch (err) {
        console.error('Failed to load application dossier', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  // Selected requirement and linked evidence
  const selectedReq = requirements.find((r) => r.id === selectedReqId) || requirements[0];
  const selectedEvidence = evidenceList.find((e) => e.requirementId === selectedReq?.id);
  const selectedFinding = ceiFindings.find((f) => f.requirementCode === selectedReq?.code);

  // Calculations for KPI cards
  const totalNormsCount = requirements.length;
  const verifiedCount = evidenceList.filter((e) => e.status === 'VERIFIED').length;
  const awaitingReviewCount = evidenceList.filter((e) => e.status === 'RECEIVED' || e.status === 'NEEDS_REVIEW').length;
  const missingCount = requirements.filter((r) => !evidenceList.some((e) => e.requirementId === r.id)).length;
  const expiringCount = evidenceList.filter((e) => e.status === 'EXPIRING' || e.isExpiringSoon).length;
  const deficientCount = ceiFindings.filter((f) => f.status === 'NEEDS_REVIEW' || f.issueType === 'CADRE_DEFICIENCY').length;

  // Filtered requirements
  const filteredRequirements = requirements.filter((req) => {
    const linkedDoc = evidenceList.find((e) => e.requirementId === req.id);
    const docStatus = linkedDoc ? linkedDoc.status : 'MISSING';

    if (filterCategory !== 'ALL' && req.applicableCategory !== filterCategory && req.applicableCategory !== 'ALL') {
      return false;
    }
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'VERIFIED' && docStatus !== 'VERIFIED') return false;
      if (filterStatus === 'DEFICIENT' && docStatus !== 'NEEDS_REVIEW' && !linkedDoc?.automatedCheck?.passed) return false;
      if (filterStatus === 'MISSING' && docStatus !== 'MISSING') return false;
      if (filterStatus === 'EXPIRING' && docStatus !== 'EXPIRING' && !linkedDoc?.isExpiringSoon) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.code.toLowerCase().includes(q) ||
        req.title.toLowerCase().includes(q) ||
        req.clauseReference.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action Handlers
  const handleVerifyEvidence = async (docId: string, outcome: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await api.verifyEvidence(docId, {
        verifiedBy: currentUser.name,
        actorRole: currentUser.role,
        outcome,
        verificationNotes:
          outcome === 'APPROVED'
            ? 'Scrutiny Officer verified all statutory clauses and attachments compliant with APH 2026-27.'
            : 'Deficiency noted during scrutiny review. Returned to institution.',
      });

      setEvidenceList((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast('success', 'Verification Saved', `Evidence status updated to ${updated.status}`);
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.message);
    }
  };

  const handleOpenClarificationModal = () => {
    setClarificationReason(
      selectedFinding?.explanation?.whatWasDetected ||
        'Deficiencies identified during scrutiny of statutory evidence. Please provide formal rectification.'
    );
    setClarificationDeadline(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setIsClarificationModalOpen(true);
  };

  const handleConfirmClarification = async () => {
    if (!application || !clarificationReason) return;
    try {
      const updated = await api.requestClarification(application.id, {
        reason: clarificationReason,
        requestedBy: currentUser.name,
        deadline: clarificationDeadline,
      });

      setApplication(updated);
      showToast('warning', 'Clarification Communicated', `Deficiency notice sent to ${updated.institutionName}`);
      setIsClarificationModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleOpenUploadModal = (reqId: string) => {
    const req = requirements.find((r) => r.id === reqId) || null;
    const existing = evidenceList.find((e) => e.requirementId === reqId) || null;
    setUploadTargetReq(req);
    setUploadExistingDoc(existing);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (newDoc: EvidenceDocument) => {
    setEvidenceList((prev) => [newDoc, ...prev.filter((d) => d.requirementId !== newDoc.requirementId)]);
    showToast('success', 'Document Stored & Recorded', `${newDoc.fileName} registered in application dossier.`);
  };

  const openTransitionModal = (stage: WorkflowStage, actionName: string) => {
    setTargetStage(stage);
    setTransitionAction(actionName);
    setTransitionReason('');
    setIsTransitionModalOpen(true);
  };

  const handleConfirmTransition = async () => {
    if (!application || !targetStage) return;
    setSubmittingTransition(true);
    try {
      const updated = await api.transitionApplication(application.id, {
        nextStage: targetStage,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: transitionAction,
        reason: transitionReason || 'Statutory stage milestone completed per APH regulations.',
      });

      setApplication(updated);
      showToast('success', 'Workflow Stage Advanced', `Application moved to: ${updated.stageLabel}`);
      setIsTransitionModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Transition Error', err.message);
    } finally {
      setSubmittingTransition(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-[#123B32] border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading statutory scrutiny dossier...
      </div>
    );
  }

  // Institutional privacy restriction: college representative cannot view other colleges' confidential dossiers
  const targetInstId = currentUser.institutionId || (isInstitution ? 'inst_01' : undefined);
  if (isInstitution && application && targetInstId && application.institutionId !== targetInstId) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-lg border border-red-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access Restricted — Confidential Institutional Application</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          This application record belongs to another institution (<span className="font-semibold text-gray-800">{application.institutionName}</span>). Under AICTE statutory data protection regulations, institutional representatives may only access and view applications filed by their own institution.
        </p>
        <div className="pt-2">
          <Link to="/applications">
            <Button variant="primary" className="bg-[#123B32] text-white text-xs">
              Return to My Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DFE6E2] pb-3">
        <div className="flex items-center gap-2 text-xs text-[#414846]">
          <Link to="/applications" className="hover:text-[#123B32] flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> {isInstitution ? 'My Applications' : 'Applications Directory'}
          </Link>
          <span>/</span>
          <span>{application.region} Regional Office</span>
          <span>/</span>
          <span className="font-bold text-[#101E1A] font-mono">{application.applicationNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 bg-[#FFF5D6] text-[#B7791F] border border-[#F3DA93] rounded text-xs font-bold uppercase tracking-wider">
            {application.stageLabel}
          </span>
          <span className="text-xs text-gray-500 font-mono">AY {application.academicYear}</span>
        </div>
      </div>

      {/* Contextual Regulatory Change Impact Banner (RCIE Output) */}
      {application.regulatoryNotice && (
        <div className="bg-[#FFF8E7] border-2 border-[#E5A900] rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#E5A900]/20 border border-[#E5A900] text-[#0B2924] flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-5 h-5 text-[#B7791F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B7791F]">
                  Regulatory Change Impact Notice — APH Enactment
                </span>
                <span className="bg-[#E5A900] text-[#0B2924] text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                  {application.regulatoryNotice.version}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#0B2924] mt-0.5">
                {application.regulatoryNotice.title}
              </h4>
              <p className="text-xs text-[#414846] mt-1 leading-relaxed">
                {application.regulatoryNotice.impactSummary}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-white border border-[#DFE6E2] rounded font-bold text-[#123B32]">
              1-Year Glidepath Authorized
            </span>
            <Link
              to="/regulatory-changes"
              className="px-3 py-1 bg-[#123B32] text-white rounded font-semibold hover:bg-[#0B2924] transition-colors"
            >
              Examine Gazette Diff
            </Link>
          </div>
        </div>
      )}

      {/* Deficiency / Clarification Notice Banner if pending */}
      {application.pendingClarification && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                  Statutory Deficiency Notice Issued
                </span>
                <span className="text-[11px] font-mono text-red-700">
                  Deadline: <strong>{application.pendingClarification.deadline}</strong>
                </span>
              </div>
              <p className="text-xs text-red-950 mt-1">
                <strong>Officer Observation:</strong> {application.pendingClarification.reason}
              </p>
            </div>
          </div>
          {isInstitution && (
            <Button
              size="sm"
              variant="primary"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => handleOpenUploadModal(selectedReqId)}
            >
              Upload Rectification Evidence
            </Button>
          )}
        </div>
      )}

      {/* Institutional Dossier Master Card */}
      <div className="bg-white rounded-lg border border-[#DFE6E2] shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFE6E2] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-[#F5F7F6] text-[#123B32] px-2.5 py-0.5 rounded border border-[#DFE6E2]">
                PID: {application.institutionId}
              </span>
              <span className="font-mono text-xs font-bold text-gray-500">
                {application.applicationNumber}
              </span>
              <Badge variant={application.isOverdue ? 'error' : 'progress'}>
                {application.stageLabel}
              </Badge>
              {application.isOverdue && (
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                  SLA Breached ({application.daysInCurrentStage}d in stage)
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#101E1A] mt-1.5">{application.institutionName}</h1>
            <p className="text-xs text-[#414846] mt-0.5">
              Category: <strong>{application.categoryLabel}</strong> • State: {application.state} ({application.district}) • Proposed Intake: {application.intakeProposed || 240} Seats
            </p>
          </div>

          {/* Master Workflow Transition Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scrutiny commencement */}
            {['SUBMITTED', 'RESUBMITTED'].includes(application.currentStage) && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => openTransitionModal('SCRUTINY', 'Commence Digital Scrutiny')}
              >
                Start Scrutiny
              </Button>
            )}

            {/* In Scrutiny Actions */}
            {application.currentStage === 'SCRUTINY' && (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleOpenClarificationModal}
                >
                  Issue Deficiency Notice
                </Button>
                {application.requiresEVC ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openTransitionModal('EVC_REQUIRED', 'Clear Scrutiny & Recommend Physical EVC')}
                  >
                    Clear Scrutiny & Route EVC
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => openTransitionModal('DECISION_PENDING', 'Clear Scrutiny & Forward for Approval')}
                  >
                    Clear Scrutiny & Forward for Approval
                  </Button>
                )}
              </>
            )}

            {/* EVC Actions */}
            {application.currentStage === 'EVC_REQUIRED' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => openTransitionModal('EVC_SCHEDULED', 'Assign Inspection Team & Schedule Physical Visit')}
              >
                Schedule EVC Inspection
              </Button>
            )}

            {(application.requiresEVC || application.currentStage === 'EVC_REQUIRED' || application.currentStage === 'EVC_SCHEDULED') && (
              <Link to="/inspections">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#123B32] text-[#123B32] hover:bg-[#EAF5EF]"
                  icon={<Camera className="w-3.5 h-3.5" />}
                >
                  Live EVC Geo-Evidence
                </Button>
              </Link>
            )}

            {/* Decision Maker Actions */}
            {application.currentStage === 'DECISION_PENDING' && (isDecisionMaker || isAdmin) && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => openTransitionModal('APPROVED', 'Grant Formal Statutory Approval (Letter of Approval)')}
                >
                  Grant Approval (LoA)
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openTransitionModal('REJECTED', 'Issue Speaking Order of Rejection')}
                >
                  Reject Application
                </Button>
              </>
            )}

            {/* Export application docket */}
            <Button
              size="sm"
              variant="outline"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => showToast('info', 'Record Export', 'Generated digitally signed scrutiny docket (PDF/A).')}
            >
              Export Scrutiny Records
            </Button>
          </div>
        </div>

        {/* Demographics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-4">
          <div className="p-2.5 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Assigned Scrutiny Officer</div>
            <div className="font-bold text-[#101E1A] mt-0.5">{application.assignedOfficerName || 'Central Scrutiny Cell'}</div>
            <div className="text-[11px] text-[#414846]">{application.region} Zone Desk</div>
          </div>
          <div className="p-2.5 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Submission Date</div>
            <div className="font-bold text-[#101E1A] mt-0.5">{application.submissionDate}</div>
            <div className="text-[11px] text-emerald-700 font-semibold">NIC eSign Timestamped</div>
          </div>
          <div className="p-2.5 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Statutory SLA Target</div>
            <div className="font-bold text-[#101E1A] mt-0.5">{application.targetCompletionDate}</div>
            <div className="text-[11px] text-gray-600">Standard 45-day cycle</div>
          </div>
          <div className="p-2.5 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Physical EVC Requirement</div>
            <div className="font-bold text-[#123B32] mt-0.5">{application.requiresEVC ? 'Mandatory (New Course/Campus)' : 'Exempt (EoA Regular)'}</div>
            <div className="text-[11px] text-gray-600">Per APH 2026-27 Norms</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTEGRATED CEI MODULE: Compliance Requirements & Evidence                */}
      {/* ========================================================================= */}
      <section aria-label="Compliance Evidence Intelligence" className="space-y-4">
        {/* CEI Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <h2 className="text-lg font-bold text-[#123B32]">
                Compliance Requirements & Evidence (CEI)
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#123B32] text-white">
                {verifiedCount} / {totalNormsCount} COMPLIANT
              </span>
            </div>
            <p className="text-xs text-[#414846] mt-0.5">
              Requirement-centred statutory audit: inspect uploaded records against APH clauses, examine automated checks, and record concurrence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('info', 'CEI Re-run', 'Compliance rule engine re-evaluated against latest APH 2026-27 norms.')}
              className="bg-white text-[#123B32] border border-[#DFE6E2] hover:border-[#123B32] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              Re-run Rule Engine
            </button>
            {isInstitution && (
              <Button
                size="sm"
                variant="primary"
                icon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => handleOpenUploadModal(selectedReqId)}
              >
                Upload Required Evidence
              </Button>
            )}
          </div>
        </div>

        {/* 6 Bento Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs">
            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Norms</div>
            <div className="text-2xl font-bold text-[#101E1A] mt-1 tabular-nums">{totalNormsCount}</div>
            <div className="text-[11px] text-gray-500 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Mandatory</span>
              <span className="font-semibold text-[#123B32]">100% Mapped</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs">
            <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Verified Compliant</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{verifiedCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Ratio</span>
              <span className="font-bold">{Math.round((verifiedCount / (totalNormsCount || 1)) * 100)}%</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs">
            <div className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Awaiting Review</div>
            <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{awaitingReviewCount}</div>
            <div className="text-[11px] text-gray-500 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Officer Queue</span>
              <span className="font-semibold text-amber-700">Active Desk</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs">
            <div className="text-red-700 text-[10px] font-bold uppercase tracking-wider">Missing Evidence</div>
            <div className="text-2xl font-bold text-red-700 mt-1 tabular-nums">{missingCount}</div>
            <div className="text-[11px] text-red-700 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Prerequisite</span>
              <span className="font-bold">Pending Upload</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs">
            <div className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">Expiring Documents</div>
            <div className="text-2xl font-bold text-blue-700 mt-1 tabular-nums">{expiringCount}</div>
            <div className="text-[11px] text-blue-700 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Window</span>
              <span className="font-semibold">&lt; 30 Days</span>
            </div>
          </div>
          <div className="bg-white border border-[#DFE6E2] p-3 rounded-lg shadow-xs border-l-4 border-l-red-600">
            <div className="text-red-700 text-[10px] font-bold uppercase tracking-wider">Deficiency Flags</div>
            <div className="text-2xl font-bold text-red-700 mt-1 tabular-nums">{deficientCount}</div>
            <div className="text-[11px] text-red-700 mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span>Hearing Stage</span>
              <span className="font-bold">Action Needed</span>
            </div>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="bg-white border border-[#DFE6E2] p-2.5 rounded-lg flex flex-wrap items-center gap-2 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clause (e.g., Clause 7.4, Cadre, Land, Fire Safety)..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-[#DFE6E2] rounded focus:border-[#123B32] focus:ring-1 focus:ring-[#123B32]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 uppercase text-[10px] font-bold">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8 px-2 text-xs border border-[#DFE6E2] rounded bg-white text-[#101E1A]"
            >
              <option value="ALL">All Disciplines</option>
              <option value="NEW_INSTITUTION">New Institution</option>
              <option value="NEW_PROGRAMME">New Programme</option>
              <option value="EXTENSION_OF_APPROVAL">Extension of Approval</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 uppercase text-[10px] font-bold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2 text-xs border border-[#DFE6E2] rounded bg-white text-[#101E1A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Compliant</option>
              <option value="DEFICIENT">Deficient / Flags Only</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="MISSING">Missing Evidence</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFilterCategory('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="h-8 px-3 text-gray-600 hover:text-[#101E1A] border border-[#DFE6E2] rounded hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* 2-Column Split: Requirements Table (7 cols) + Deep-Dive Intelligence Side Panel (5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Requirements Verification Table */}
          <div className="xl:col-span-7 bg-white border border-[#DFE6E2] rounded-lg overflow-hidden shadow-xs">
            <div className="p-3 bg-[#F5F7F6] border-b border-[#DFE6E2] flex items-center justify-between text-xs">
              <span className="font-bold text-[#123B32]">Mandatory Statutory Clauses Verification Table</span>
              <span className="text-[11px] text-gray-500">Click any row to examine intelligence audit</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAEFE9] text-[#101E1A] text-[10px] uppercase font-bold tracking-wider border-b border-[#DFE6E2]">
                    <th className="py-2.5 px-3">APH Clause & Title</th>
                    <th className="py-2.5 px-2">Evidence Document</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE6E2]">
                  {filteredRequirements.map((req) => {
                    const linkedDoc = evidenceList.find((e) => e.requirementId === req.id);
                    const isSelected = req.id === selectedReqId;
                    const docStatus = linkedDoc ? linkedDoc.status : 'MISSING';

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedReqId(req.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EAF5EF] border-l-4 border-l-[#123B32] font-medium'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#101E1A]">{req.title}</div>
                          <div className="text-[11px] text-[#414846] font-mono mt-0.5">
                            {req.clauseReference} • {req.code}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {linkedDoc ? (
                            <div className="space-y-0.5">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDoc(linkedDoc);
                                }}
                                className="font-semibold text-[#123B32] hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[170px]"
                                title="Click to preview file"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#123B32] shrink-0" />
                                {linkedDoc.fileName}
                              </span>
                              <div className="text-[10px] text-gray-500">
                                {linkedDoc.expiryDate ? `Exp: ${linkedDoc.expiryDate}` : 'Permanent Order'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-red-600 font-semibold italic">
                              No evidence uploaded
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {docStatus === 'VERIFIED' && (
                            <span className="px-2 py-0.5 bg-[#EAF5EF] text-[#238354] border border-[#C1E4D0] rounded text-[10px] font-bold uppercase">
                              VERIFIED
                            </span>
                          )}
                          {docStatus === 'NEEDS_REVIEW' && (
                            <span className="px-2 py-0.5 bg-[#FCEBEB] text-[#C23B3B] border border-[#F5C2C2] rounded text-[10px] font-bold uppercase">
                              DEFICIENT
                            </span>
                          )}
                          {docStatus === 'RECEIVED' && (
                            <span className="px-2 py-0.5 bg-[#FFF5D6] text-[#B7791F] border border-[#F3DA93] rounded text-[10px] font-bold uppercase">
                              AWAITING REVIEW
                            </span>
                          )}
                          {docStatus === 'EXPIRING' && (
                            <span className="px-2 py-0.5 bg-[#EBF3FA] text-[#2767A8] border border-[#C2DCF2] rounded text-[10px] font-bold uppercase">
                              EXPIRING SOON
                            </span>
                          )}
                          {docStatus === 'MISSING' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-bold uppercase">
                              MISSING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReqId(req.id);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#123B32] border border-[#DFE6E2] rounded text-[11px] font-bold shadow-2xs"
                          >
                            Examine
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Deep-Dive CEI Detail Side Panel (Matches Stitch Lines 634-750) */}
          <div className="xl:col-span-5 bg-white border-2 border-[#123B32] rounded-lg shadow-sm overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="bg-[#123B32] text-white p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#E5A900] tracking-wider block">
                  CEI Intelligent Scrutiny Audit
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedReq.title}</h3>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white rounded text-[10px] font-mono font-bold">
                {selectedReq.code}
              </span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Appendix & Mandate Metadata */}
              <div className="bg-[#F5F7F6] border border-[#DFE6E2] p-3 rounded">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 font-medium block">Regulatory Clause:</span>
                    <span className="font-semibold text-[#123B32] font-mono">{selectedReq.clauseReference}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Prescribed Evidence:</span>
                    <span className="font-semibold text-[#101E1A]">{selectedReq.evidenceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Responsible Authority:</span>
                    <span className="font-semibold text-[#101E1A]">Registrar & Scrutiny Officer</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Governing Rule Version:</span>
                    <span className="font-semibold text-[#123B32] font-mono">APH 2026-27 v2.4</span>
                  </div>
                </div>
              </div>

              {/* Linked Evidence Document Card */}
              <div className="border border-[#DFE6E2] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    Linked Evidence Document
                  </span>
                  {selectedEvidence && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> NIC eSign Verified
                    </span>
                  )}
                </div>

                {selectedEvidence ? (
                  <div className="bg-[#F5F7F6] p-2.5 rounded border border-[#DFE6E2] flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <FileText className="w-8 h-8 text-[#123B32] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[#123B32]">{selectedEvidence.fileName}</div>
                        <div className="text-[10px] text-gray-500">
                          Uploaded: {selectedEvidence.uploadedAt} • Size: {selectedEvidence.fileSize}
                        </div>
                        {selectedEvidence.expiryDate && (
                          <div className="text-[10px] text-gray-700 mt-0.5">
                            Validity Expiry: <strong className="text-[#101E1A]">{selectedEvidence.expiryDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewDoc(selectedEvidence)}
                      className="px-2 py-1 bg-white hover:bg-gray-100 text-[#123B32] border border-[#DFE6E2] rounded text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 text-center">
                    <p className="font-bold">No evidence has been uploaded for this mandatory norm.</p>
                    {isInstitution && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="mt-2"
                        onClick={() => handleOpenUploadModal(selectedReq.id)}
                      >
                        Upload Evidence Now
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Automated Validation Findings (Explainability Engine) */}
              <div className="border-2 border-red-200 bg-red-50/50 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-800 font-bold">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span>Explainable Rule Engine Flag</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold">
                    CONFIDENCE: 98.4%
                  </span>
                </div>

                <p className="text-gray-800 text-[11px] leading-relaxed">
                  {selectedFinding?.explanation?.whatWasDetected ||
                    (selectedEvidence?.automatedCheck?.message ??
                      'Automated compliance rules executed against submitted institutional records.')}
                </p>

                {/* Analytical Quantitative Breakdown */}
                {selectedReq.code === 'APH-CL-7.4' && (
                  <div className="bg-white p-2.5 rounded border border-[#DFE6E2] text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Approved Student Intake:</span>
                      <span className="font-bold tabular-nums">480 Students</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mandated Full-Time Faculty (1:20):</span>
                      <span className="font-bold tabular-nums">24 Faculty Members</span>
                    </div>
                    <div className="flex justify-between text-red-700 font-semibold">
                      <span>Valid TDS-Verified Faculty:</span>
                      <span className="tabular-nums">20 Faculty Members (Deficit of 4)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-[#123B32]">
                      <span>Current Actual Ratio:</span>
                      <span className="tabular-nums text-red-700">1:24 (Non-Compliant)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Human-in-the-Loop Statutory Safeguard */}
              <div className="bg-[#EAF5EF] border-l-4 border-l-[#123B32] p-2.5 rounded text-[11px] text-[#123B32]">
                <div className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#123B32]" /> Human-in-the-Loop Statutory Safeguard
                </div>
                <p className="text-gray-700 mt-0.5">
                  Automated checks serve strictly as operational scrutiny cues. Final deficiency determination and statutory approval require explicit sign-off by the authorized officer.
                </p>
              </div>

              {/* Permitted Action Buttons */}
              <div className="pt-2 border-t border-[#DFE6E2] space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Permitted Operational Actions
                </span>

                {/* For Scrutiny Officers */}
                {selectedEvidence && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<CheckCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleVerifyEvidence(selectedEvidence.id, 'APPROVED')}
                    >
                      Verify Evidence
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      icon={<XCircle className="w-3.5 h-3.5" />}
                      onClick={() => handleVerifyEvidence(selectedEvidence.id, 'REJECTED')}
                    >
                      Flag Deficiency
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenClarificationModal}
                    className="w-full bg-white hover:bg-gray-100 text-[#123B32] border border-[#DFE6E2] py-1.5 px-2 rounded text-xs font-semibold transition-colors"
                  >
                    Request Clarification
                  </button>
                  {isInstitution ? (
                    <button
                      onClick={() => handleOpenUploadModal(selectedReq.id)}
                      className="w-full bg-[#123B32] hover:bg-[#0B2924] text-white py-1.5 px-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Resubmit Evidence
                    </button>
                  ) : (
                    <button
                      onClick={() => showToast('info', 'Observation Logged', 'Scrutiny observation permanently saved to case log.')}
                      className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-[#DFE6E2] py-1.5 px-2 rounded text-xs font-semibold transition-colors"
                    >
                      Record Review Comment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chronological Stage Progression & Audit Trail */}
      <Card
        title="Chronological Stage Movement & Digital Audit Trail"
        subtitle="Permanent tamper-evident ledger of application milestones, responsible actors, and statutory decisions."
      >
        <div className="relative border-l-2 border-[#123B32]/30 ml-4 pl-6 space-y-5 py-2 text-xs">
          {application.stageHistory.map((item, index) => {
            const isLatest = index === application.stageHistory.length - 1;
            return (
              <div key={item.id} className="relative">
                <div
                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${
                    isLatest
                      ? 'bg-[#123B32] border-white ring-4 ring-emerald-100'
                      : 'bg-white border-[#123B32]'
                  }`}
                />
                <div className="bg-[#F5F7F6] p-3.5 rounded border border-[#DFE6E2]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-[#101E1A] text-sm">{item.action}</span>
                    <span className="text-gray-500 text-[11px] font-medium">{item.timestamp}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                    <span>
                      Actor: <strong>{item.actorName}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-[#123B32] font-semibold">{item.actorRole.replace('_', ' ')}</span>
                  </div>
                  {item.reason && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                      <strong>Statutory Reason:</strong> {item.reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Document Preview Modal (Simulated Digital Evidence Viewer) */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? `Statutory Evidence Preview: ${previewDoc.fileName}` : 'Document Preview'}
        subtitle="Simulated NIC Digital Locker & National Regulatory Repository Viewer"
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            {/* Document Verification Seal */}
            <div className="bg-[#EAF5EF] border border-[#C1E4D0] p-3 rounded flex items-center justify-between text-xs text-[#123B32]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold">Cryptographically Validated Document (SHA-256)</div>
                  <div className="text-[10px] text-gray-600 font-mono">Cert-ID: #DL-NIC-2026-X8 • Issuing Auth: Municipal Corp / PWD</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[10px] font-bold">
                VALID DIGITAL SEAL
              </span>
            </div>

            {/* Simulated PDF Viewer Paper Canvas */}
            <div className="bg-[#F5F7F6] border border-[#DFE6E2] rounded p-6 min-h-[220px] flex flex-col justify-between shadow-inner font-serif text-[#101E1A]">
              <div className="text-center border-b border-gray-300 pb-3">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-gray-500">
                  Government of India • Ministry of Education
                </div>
                <div className="text-sm font-bold font-sans text-[#123B32] mt-0.5">
                  AICTE REGULATORY STATUTORY COMPLIANCE SUBMISSION
                </div>
                <div className="text-[11px] text-gray-600 font-sans mt-0.5">
                  Institution: {application.institutionName} (PID: {application.institutionId})
                </div>
              </div>

              <div className="py-4 text-xs leading-relaxed space-y-2">
                <p>
                  <strong>Document Title:</strong> {previewDoc.fileName}
                </p>
                <p>
                  <strong>Document Classification:</strong> {previewDoc.documentType}
                </p>
                <p>
                  <strong>Uploaded By:</strong> {previewDoc.uploadedBy} on {previewDoc.uploadedAt}
                </p>
                {previewDoc.expiryDate && (
                  <p>
                    <strong>Validity Period:</strong> Valid through <strong>{previewDoc.expiryDate}</strong>
                  </p>
                )}
                <div className="p-2.5 bg-white border border-gray-200 rounded font-mono text-[10px] text-gray-600">
                  Automated Intake Audit: {previewDoc.automatedCheck?.message || 'Validated against APH schema.'}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-300 flex justify-between text-[10px] font-sans text-gray-500">
                <span>File Size: {previewDoc.fileSize}</span>
                <span>Page 1 of 4 • Digitally Signed by Principal</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
              {isProcessingOfficer && previewDoc.status !== 'VERIFIED' && (
                <Button
                  variant="primary"
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  onClick={() => {
                    handleVerifyEvidence(previewDoc.id, 'APPROVED');
                    setPreviewDoc(null);
                  }}
                >
                  Verify & Approve Evidence
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 2. Clarification / Deficiency Modal */}
      <Modal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        title="Issue Formal Statutory Deficiency Notice"
        subtitle={`Application: ${application.applicationNumber} — Deficiencies will be communicated to ${application.institutionName}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Deficiency Description & Specific Rectification Required *
            </label>
            <textarea
              rows={4}
              value={clarificationReason}
              onChange={(e) => setClarificationReason(e.target.value)}
              className="w-full p-2.5 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              placeholder="State clear regulatory finding, clause reference, and what documents must be furnished..."
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Statutory Deadline for Response (Standard 14 Days) *
            </label>
            <input
              type="date"
              value={clarificationDeadline}
              onChange={(e) => setClarificationDeadline(e.target.value)}
              className="w-full p-2 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
            <strong>Citizen Charter Safeguard:</strong> Once issued, the application clock is placed on hold pending institutional resubmission.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsClarificationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClarification}>
              Issue Formal Notice
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Reusable Secure Document Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        applicationId={application.id}
        institutionId={application.institutionId}
        requirementId={uploadTargetReq?.id || 'req_01'}
        requirementTitle={uploadTargetReq?.title || 'Statutory Compliance Requirement'}
        requirementCode={uploadTargetReq?.code || 'APH-CL'}
        clauseReference={uploadTargetReq?.clauseReference}
        existingDoc={uploadExistingDoc || undefined}
        documentType={uploadTargetReq?.evidenceType || 'Compliance Record'}
        actorName={currentUser.name}
        actorRole={currentUser.role}
      />

      {/* 4. Workflow Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title={`Confirm Workflow Action: ${transitionAction}`}
        subtitle={`Target Stage: ${targetStage} — Will be recorded in the National Scrutiny Audit Trail`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Statutory Justification / Committee Resolution Remarks *
            </label>
            <textarea
              rows={3}
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
              placeholder="Record official justification, committee meeting date, or statutory basis for decision..."
              className="w-full p-2.5 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div className="p-2.5 bg-gray-50 rounded border border-gray-200 text-[11px] text-gray-600">
            <strong>Signing Officer:</strong> {currentUser.name} ({currentUser.designation})
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={submittingTransition}
              onClick={handleConfirmTransition}
            >
              Confirm & Execute Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
