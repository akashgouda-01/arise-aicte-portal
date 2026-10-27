import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Application, EvidenceDocument, ComplianceRequirement } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FileUploadModal } from '../components/ui/FileUploadModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  FileCheck,
  Shield,
  HelpCircle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

export const InstitutionPortalPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceDocument[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetReq, setUploadTargetReq] = useState<ComplianceRequirement | null>(null);
  const [uploadExistingDoc, setUploadExistingDoc] = useState<EvidenceDocument | null>(null);

  // Resubmit clarification state
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [clarificationNotes, setClarificationNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const targetInstId = currentUser.institutionId || 'inst_03';
        const [apps, evis, reqs] = await Promise.all([
          api.getApplications({ institutionId: targetInstId }),
          api.getEvidence({ institutionId: targetInstId }),
          api.getRequirements(),
        ]);
        let loadedApps = apps;
        if (loadedApps.length === 0) {
          const allApps = await api.getApplications();
          const matchApp = allApps.find((a) => a.institutionId === targetInstId) || allApps[0];
          if (matchApp) loadedApps = [matchApp];
        }
        setAllApplications(loadedApps);
        if (loadedApps.length > 0) setApplication(loadedApps[0]);
        setEvidenceList(evis);
        setRequirements(reqs);
      } catch (err) {
        console.error('Failed to load institution data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser.institutionId]);

  const handleUploadSuccess = (newDoc: EvidenceDocument) => {
    if (!newDoc || typeof newDoc !== 'object' || !newDoc.id) {
      console.warn('handleUploadSuccess received invalid document payload', newDoc);
      return;
    }
    setEvidenceList((prev) => [newDoc, ...prev.filter((d) => d && d.id !== newDoc.id)]);
    showToast('success', 'Document Stored & Verified', `${newDoc.fileName || 'Document'} registered in national repository.`);
  };

  const handleResubmitApplication = async () => {
    if (!application) return;
    try {
      const updated = await api.transitionApplication(application.id, {
        nextStage: 'RESUBMITTED',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: 'Application & Clarification Evidence Resubmitted by Institution',
        reason: clarificationNotes || 'Uploaded Fire Safety renewal challan receipt and revised faculty appointment roster.',
      });

      setApplication(updated);
      showToast('success', 'Resubmitted', 'Application successfully resubmitted to Regional Scrutiny Officer.');
      setIsResubmitModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Resubmission Error', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading My Institution Portal...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white p-8 rounded-lg border border-neutral-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">No Active Applications Found</h2>
        <p className="text-xs text-neutral-600">
          Your institution has no active approval applications for AY 2026-27. Click below to begin a new statutory filing.
        </p>
        <div className="pt-2">
          <Button
            size="md"
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/institution/applications/new')}
            className="bg-[#123B32] text-white hover:bg-[#0B2924]"
          >
            Create New Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institution Masthead */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded bg-[#0B2924] flex items-center justify-center text-amber-400 font-bold flex-shrink-0 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#172B26]">{application.institutionName}</h1>
              <Badge variant="success">AICTE Approved</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
              <span>Permanent ID (PID): <strong>{application.institutionId === 'inst_03' ? '1-94821033' : '1-92837101'}</strong></span>
              <span>•</span>
              <span>Region: <strong>{application.region}</strong></span>
              <span>•</span>
              <span>District: <strong>{application.district}, {application.state}</strong></span>
              <span>•</span>
              <span>Academic Year: <strong>{application.academicYear}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/institution/applications/new')}
            className="bg-[#123B32] text-white hover:bg-[#0B2924]"
          >
            Create New Application
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* Multiple Applications Switcher Bar if > 1 */}
      {allApplications.length > 1 && (
        <div className="bg-white p-3 rounded border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-700">Institution Filings ({allApplications.length}):</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {allApplications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setApplication(app)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    application.id === app.id
                      ? 'bg-[#123B32] text-white font-bold'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {app.applicationNumber} ({app.currentStage})
                </button>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            icon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={() => navigate('/institution/applications/new')}
          >
            New Filing
          </Button>
        </div>
      )}

      {/* Active Application Details Card */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span>Active Application Details</span>
              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {application.applicationNumber}
              </span>
            </div>
            <Badge variant={application.currentStage === 'CLARIFICATION_REQUIRED' ? 'warning' : 'progress'}>
              {application.stageLabel}
            </Badge>
          </div>
        }
        subtitle={`${application.categoryLabel} — Target Academic Session: ${application.academicYear}`}
      >
        <div className="space-y-6">
          {/* Deficiencies Alert Banner using UX4G Alert */}
          {application.pendingClarification && application.currentStage === 'CLARIFICATION_REQUIRED' && (
            <div className="ux4g-alert ux4g-alert-warning flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">
                    Deficiency / Clarification Required from Scrutiny Committee
                  </h4>
                  <p className="text-xs mt-1">
                    {application.pendingClarification.reason}
                  </p>
                  <div className="text-[11px] font-semibold mt-1.5 flex gap-4">
                    <span>Issued By: {application.pendingClarification.requestedBy}</span>
                    <span>Submission Deadline: <strong>{application.pendingClarification.deadline}</strong></span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={<Send className="w-4 h-4" />}
                onClick={() => setIsResubmitModalOpen(true)}
              >
                Resubmit Response
              </Button>
            </div>
          )}

          {/* Workflow Stage Progression Stepper */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Application Movement & Stage Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="p-3 rounded border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>1. Submission</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-[11px] text-gray-600 mt-1">Submitted: {application.submissionDate}</div>
              </div>

              <div className={`p-3 rounded border ${application.currentStage === 'CLARIFICATION_REQUIRED' ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>2. Scrutiny</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-[11px] text-gray-600 mt-1">{application.stageLabel}</div>
              </div>

              <div className="p-3 rounded border border-gray-200 bg-gray-50 opacity-70">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>3. EVC Inspection</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Mandatory for New Programme</div>
              </div>

              <div className="p-3 rounded border border-gray-200 bg-gray-50 opacity-70">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>4. Formal Decision</span>
                  <Shield className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Executive Committee LoA</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mandatory Compliance Documents & Expiry Register */}
      <Card
        title="Institutional Statutory Requirements & Evidence Register"
        subtitle="Live compliance checklist: view required documents, expiry dates, verification outcomes, and submit evidence directly."
      >
        <div className="overflow-x-auto">
          <table className="ux4g-table ux4g-table-m ux4g-table-zebra-rows ux4g-table-column-dividers w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold text-[10px] uppercase tracking-wider bg-[#F5F7F6]">
                <th className="py-2.5 px-3">Statutory Requirement / APH Clause</th>
                <th className="py-2.5 px-3">Submitted Evidence</th>
                <th className="py-2.5 px-3">Validity / Period</th>
                <th className="py-2.5 px-3">Compliance Status</th>
                <th className="py-2.5 px-3 text-right">Permitted Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requirements.map((req) => {
                const linkedEvi = evidenceList.find((e) => e && (e.requirementId === req.id || e.id === req.id));
                return (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#101E1A]">{req.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {req.clauseReference} • {req.code}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {linkedEvi ? (
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary-600" />
                            {linkedEvi.fileName}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Size: {linkedEvi.fileSize} • Uploaded: {linkedEvi.uploadedAt}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-red-600 font-semibold italic">
                          Mandatory Evidence Not Yet Furnished
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {linkedEvi?.expiryDate ? (
                        <div>
                          <span className={`font-semibold ${linkedEvi.isExpired ? 'text-red-600 font-bold' : linkedEvi.isExpiringSoon ? 'text-amber-600 font-bold' : 'text-gray-700'}`}>
                            {linkedEvi.expiryDate}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            {linkedEvi.daysUntilExpiry && linkedEvi.daysUntilExpiry > 0 ? `${linkedEvi.daysUntilExpiry} days left` : 'Expired'}
                          </span>
                        </div>
                      ) : linkedEvi ? (
                        <span className="text-gray-500 font-medium">Permanent Record</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {linkedEvi ? (
                        <div>
                          <Badge
                            variant={
                              linkedEvi.status === 'VERIFIED'
                                ? 'success'
                                : linkedEvi.status === 'EXPIRING'
                                ? 'warning'
                                : linkedEvi.status === 'EXPIRED' || linkedEvi.status === 'NEEDS_REVIEW'
                                ? 'error'
                                : 'neutral'
                            }
                          >
                            {linkedEvi.status === 'NEEDS_REVIEW' ? 'DEFICIENCY NOTED' : linkedEvi.status}
                          </Badge>
                          {linkedEvi.status === 'NEEDS_REVIEW' && (
                            <p className="text-[10px] text-red-700 mt-1 max-w-xs font-medium">
                              Attention needed: Form 16 / TDS records discrepancy flagged.
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="error">MISSING</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={linkedEvi ? 'secondary' : 'primary'}
                        icon={<Upload className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setUploadTargetReq(req);
                          setUploadExistingDoc(linkedEvi || null);
                          setIsUploadModalOpen(true);
                        }}
                      >
                        {linkedEvi ? 'Renew / Replace' : 'Upload Evidence'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Secure Reusable Document Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        applicationId={application?.id || 'app_101'}
        institutionId={application?.institutionId || 'inst_01'}
        requirementId={uploadTargetReq?.id || 'req_01'}
        requirementTitle={uploadTargetReq?.title || 'Statutory Compliance Requirement'}
        requirementCode={uploadTargetReq?.code || 'APH-CL'}
        clauseReference={uploadTargetReq?.clauseReference}
        existingDoc={uploadExistingDoc || undefined}
        documentType={uploadTargetReq?.evidenceType || 'Compliance Record'}
        actorName={currentUser.name}
        actorRole={currentUser.role}
      />

      {/* Resubmit Clarification Response Modal */}
      <Modal
        isOpen={isResubmitModalOpen}
        onClose={() => setIsResubmitModalOpen(false)}
        title="Resubmit Application with Clarifications"
        subtitle="Transmit updated evidence and explanatory notes to Scrutiny Officer Dr. Ramesh Chandra."
      >
        <div className="space-y-4 text-xs">
          <div className="ux4g-alert ux4g-alert-info">
            <strong>Original Deficiency Notice:</strong>
            <p className="mt-1 text-[11px]">{application.pendingClarification?.reason}</p>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Institutional Response & Compliance Remarks *</label>
            <textarea
              rows={4}
              value={clarificationNotes}
              onChange={(e) => setClarificationNotes(e.target.value)}
              placeholder="Detail the steps taken, such as uploaded renewal receipts, cadre adjustments, and affidavit confirmations..."
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsResubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={handleResubmitApplication}>
              Confirm & Submit to AICTE
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
