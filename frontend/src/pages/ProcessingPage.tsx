import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Application, EvidenceDocument, ComplianceRequirement, PortalTask } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Send,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Calendar,
  Sparkles,
  Inbox,
  UserCheck,
  ArrowUpRight,
  Save,
  Edit3,
} from 'lucide-react';

export const ProcessingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'SCRUTINY' | 'TASKS'>('SCRUTINY');

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceDocument[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [tasks, setTasks] = useState<PortalTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter inside active queue
  const [queueSearch, setQueueSearch] = useState('');

  // Task Queue Filters
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ASSIGNED_ME' | 'EVIDENCE' | 'CLARIFICATION' | 'OVERDUE' | 'POLICY'>('ALL');

  // Clarification modal
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [clarificationReason, setClarificationReason] = useState('');
  const [clarificationDeadline, setClarificationDeadline] = useState('');

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState<EvidenceDocument | null>(null);

  // Scrutiny note draft
  const [scrutinyNote, setScrutinyNote] = useState(
    'Uploaded Form 16 Part-B does not reflect 24Q TDS filing with Income Tax Portal for Q3 AY 2025-26. Recommended for formal statutory defect notice under APH Clause 7.12.'
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, reqs, tks] = await Promise.all([
          api.getApplications(),
          api.getRequirements(),
          api.getTasks(),
        ]);
        setApplications(apps);
        setRequirements(reqs);
        setTasks(tks);

        if (apps.length > 0) {
          setSelectedApp(apps[0]);
          const evis = await api.getEvidence({ applicationId: apps[0].id });
          setEvidenceList(evis);
        }
      } catch (err) {
        console.error('Failed to load processing workspace', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectApp = async (app: Application) => {
    setSelectedApp(app);
    try {
      const evis = await api.getEvidence({ applicationId: app.id });
      setEvidenceList(evis);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyDoc = async (docId: string, outcome: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await api.verifyEvidence(docId, {
        verifiedBy: currentUser.name,
        actorRole: currentUser.role,
        outcome,
        verificationNotes:
          outcome === 'APPROVED'
            ? 'Scrutiny Officer verified compliant with APH 2026-27 norms.'
            : 'Deficiency identified during scrutiny: required Form 16 / TDS records missing.',
      });

      setEvidenceList((prev) => prev.map((d) => (d.id === docId ? updated : d)));
      showToast('success', 'Verification Recorded', `Document marked as ${updated.status}`);
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.message);
    }
  };

  const handleIssueClarification = async () => {
    if (!selectedApp || !clarificationReason) return;
    try {
      const updated = await api.requestClarification(selectedApp.id, {
        reason: clarificationReason,
        requestedBy: currentUser.name,
        deadline: clarificationDeadline,
      });

      setSelectedApp(updated);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('warning', 'Clarification Issued', `Deficiencies communicated to ${updated.institutionName}`);
      setIsClarificationModalOpen(false);
      setClarificationReason('');
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleClearScrutiny = async () => {
    if (!selectedApp) return;
    const nextStage = selectedApp.requiresEVC ? 'EVC_REQUIRED' : 'DECISION_PENDING';
    const action = selectedApp.requiresEVC
      ? 'Digital Scrutiny Cleared — Recommended for Physical EVC'
      : 'Digital Scrutiny Cleared — Forwarded for Executive Decision';

    try {
      const updated = await api.transitionApplication(selectedApp.id, {
        nextStage,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action,
        reason: 'All statutory requirements and evidence verified compliant.',
      });

      setSelectedApp(updated);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('success', 'Scrutiny Completed', `Application forwarded to ${updated.stageLabel}`);
    } catch (err: any) {
      showToast('error', 'Transition Failed', err.message);
    }
  };

  const handleResolveTask = async (taskId: string) => {
    try {
      const updated = await api.resolveTask(taskId, {
        resolvedBy: currentUser.name,
        actorRole: currentUser.role,
        resolutionReason: 'Resolved by Scrutiny Officer following case verification.',
        status: 'COMPLETED',
      });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast('success', 'Task Completed', 'Operational task marked as resolved.');
    } catch (err: any) {
      showToast('error', 'Failed to resolve task', err.message);
    }
  };

  // Filtered queue of applications
  const filteredApps = applications.filter((app) => {
    if (!queueSearch.trim()) return true;
    const q = queueSearch.toLowerCase();
    return (
      app.applicationNumber.toLowerCase().includes(q) ||
      app.institutionName.toLowerCase().includes(q) ||
      app.institutionId.toLowerCase().includes(q)
    );
  });

  // Filtered tasks in work queue
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'ASSIGNED_ME') {
      return t.assignedToName?.toLowerCase().includes('ramesh') || t.assignedRole === 'PROCESSING_OFFICER';
    }
    if (taskFilter === 'EVIDENCE') return t.taskType === 'EVIDENCE_VERIFICATION';
    if (taskFilter === 'CLARIFICATION') return t.taskType === 'CLARIFICATION_REVIEW' || t.taskType === 'CLARIFICATION_RESPONSE';
    if (taskFilter === 'OVERDUE') return t.isOverdue;
    if (taskFilter === 'POLICY') return t.taskType === 'POLICY_IMPACT_REVIEW';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-[#123B32] border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Scrutiny & Tasks Workbench...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Workspace Header */}
      <div className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#101E1A]">
              Application Processing & Scrutiny Workbench
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#123B32] text-white">
              SCRUTINY OFFICER DESK
            </span>
          </div>
          <p className="text-xs text-[#414846] mt-0.5">
            Operational desk for Dr. Rajesh Sharma / Dr. Ramesh Chandra (CRO/NRO) — Examine live dossiers, verify documents against APH norms, and manage your operational queue.
          </p>
        </div>

        {/* Tab Switcher: Scrutiny vs My Tasks */}
        <div className="flex items-center bg-[#F5F7F6] p-1 rounded-lg border border-[#DFE6E2] shrink-0">
          <button
            onClick={() => setActiveTab('SCRUTINY')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SCRUTINY'
                ? 'bg-[#123B32] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#101E1A]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Active Case Scrutiny</span>
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TASKS'
                ? 'bg-[#123B32] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#101E1A]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>My Tasks & Queue</span>
            <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
              {tasks.filter((t) => t.status !== 'COMPLETED').length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: ACTIVE CASE SCRUTINY (Stitch 2-Column Scrutiny Layout)             */}
      {/* ========================================================================= */}
      {activeTab === 'SCRUTINY' && (
        <div className="space-y-4">
          {/* Fast Switcher Queue Bar (Matches Stitch Lines 345-375) */}
          <div className="bg-[#EAEFE9] border border-[#DFE6E2] rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Active Desk Queue:
              </span>
              {applications.slice(0, 4).map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white border-t-2 border-[#123B32] text-[#123B32] shadow-xs'
                        : 'bg-[#F5F7F6] text-gray-700 hover:bg-white border border-[#DFE6E2]'
                    }`}
                  >
                    {app.isOverdue && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>}
                    <span>{app.applicationNumber.split('/').pop() || app.id}</span>
                    <span className="text-[10px] font-normal text-gray-500 truncate max-w-[100px]">
                      ({app.institutionName.split(' ')[0]})
                    </span>
                    {app.isOverdue && (
                      <span className="text-[9px] font-mono bg-red-100 text-red-800 px-1 rounded">
                        SLA+{app.daysInCurrentStage}d
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Jump Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Jump to Application ID / PID..."
                  className="h-8 pl-8 pr-3 text-xs bg-white border border-[#DFE6E2] rounded focus:border-[#123B32] w-52"
                />
              </div>
            </div>
          </div>

          {/* Master Scrutiny Action Strip */}
          {selectedApp && (
            <div className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#101E1A] truncate max-w-md">
                    {selectedApp.institutionName}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#123B32] bg-[#EAF5EF] px-2.5 py-0.5 rounded border border-[#DFE6E2]">
                    {selectedApp.applicationNumber}
                  </span>
                  <Badge variant={selectedApp.isOverdue ? 'error' : 'progress'}>
                    {selectedApp.stageLabel}
                  </Badge>
                </div>
                {selectedApp.isOverdue && (
                  <div className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Statutory SLA Breached by {Math.max(1, selectedApp.daysInCurrentStage - 21)} Days (Citizen Charter Norms)</span>
                  </div>
                )}
              </div>

              {/* Action Buttons — Clean 4-Button Row (Desktop) / Balanced 2x2 Grid (Mobile) */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-100 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => showToast('success', 'Draft Saved', 'Scrutiny observations and checks saved locally.')}
                  className="h-9 px-3 bg-white hover:bg-gray-50 text-[#123B32] border border-[#DFE6E2] rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[#123B32]" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsClarificationModalOpen(true)}
                  className="h-9 px-3 bg-[#FFF5D6] hover:bg-[#fae7b2] text-[#B7791F] border border-[#F3DA93] rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Return for Clarification</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearScrutiny}
                  className="h-9 px-3.5 bg-[#123B32] hover:bg-[#0B2924] text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Clear Scrutiny & Route</span>
                </button>
                <Link
                  to={`/applications/${selectedApp.id}`}
                  className="h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-colors"
                >
                  <span>Full Dossier</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* 2-Column Processing Workspace */}
          {selectedApp && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (7 cols): Demographics, Stepper, Submitted Documents Repository */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Profile Summary */}
                <div className="bg-white border border-[#DFE6E2] rounded-lg p-4">
                  <div className="flex justify-between items-start border-b border-[#DFE6E2] pb-3 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500">
                        Institution Profile & Demographics
                      </span>
                      <h3 className="text-sm font-bold text-[#101E1A] mt-0.5">{selectedApp.institutionName}</h3>
                      <p className="text-xs text-gray-600">{selectedApp.district}, {selectedApp.state} ({selectedApp.region} Zone)</p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-[#F5F7F6] text-gray-700 px-2 py-0.5 rounded border border-[#DFE6E2]">
                      PID: {selectedApp.institutionId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Category</div>
                      <div className="font-bold text-[#101E1A] mt-0.5">{selectedApp.categoryLabel}</div>
                    </div>
                    <div className="p-2 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Accreditation</div>
                      <div className="font-bold text-emerald-700 mt-0.5">NBA Tier-1 (3 Progs)</div>
                      <div className="text-[10px] text-gray-500">NAAC A+ (3.42)</div>
                    </div>
                    <div className="p-2 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Campus Land</div>
                      <div className="font-bold text-[#101E1A] mt-0.5">10.40 Acres</div>
                      <div className="text-[10px] text-gray-500">Reg. Deed #4419</div>
                    </div>
                    <div className="p-2 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
                      <div className="text-[10px] text-gray-500 uppercase font-semibold">Built-Up Area</div>
                      <div className="font-bold text-emerald-700 mt-0.5">24,500 sq.m</div>
                      <div className="text-[10px] text-emerald-600">Surplus +2,700m²</div>
                    </div>
                  </div>
                </div>

                {/* 2. Submitted Evidence Documents Table */}
                <div className="bg-white border border-[#DFE6E2] rounded-lg p-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#DFE6E2] pb-3 mb-3">
                    <div>
                      <h3 className="text-xs font-bold text-[#123B32] uppercase tracking-wider">
                        Submitted Statutory Evidence Repository
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Institutional uploads verified against NIC Digital Locker & Certifying Authorities
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {evidenceList.length} Uploaded Files
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#DFE6E2] rounded">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5F7F6] text-[#101E1A] text-[10px] uppercase font-bold tracking-wider border-b border-[#DFE6E2]">
                          <th className="p-2.5">Document Title & Source</th>
                          <th className="p-2.5">Validity</th>
                          <th className="p-2.5">eSign Status</th>
                          <th className="p-2.5">Officer Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFE6E2]">
                        {evidenceList.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="p-2.5">
                              <div className="font-bold text-[#101E1A] flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#123B32]" />
                                <span>{doc.fileName}</span>
                              </div>
                              <div className="text-[10px] text-gray-500">{doc.documentType}</div>
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {doc.expiryDate ? (
                                <span className={doc.isExpiringSoon ? 'text-amber-700 font-bold' : ''}>
                                  {doc.expiryDate}
                                </span>
                              ) : (
                                'Permanent'
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> NIC Valid
                              </span>
                            </td>
                            <td className="p-2.5">
                              <Badge variant={doc.status === 'VERIFIED' ? 'success' : doc.status === 'EXPIRING' ? 'warning' : doc.status === 'NEEDS_REVIEW' ? 'error' : 'neutral'}>
                                {doc.status}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-right space-x-1.5">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="text-[#123B32] hover:underline font-semibold text-xs"
                              >
                                Preview
                              </button>
                              {doc.status !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleVerifyDoc(doc.id, 'APPROVED')}
                                  className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Communication & Observation History */}
                <div className="bg-white border border-[#DFE6E2] rounded-lg p-4 shadow-xs">
                  <div className="border-b border-[#DFE6E2] pb-2 mb-3">
                    <h3 className="text-xs font-bold text-[#123B32] uppercase tracking-wider">
                      Deficiency & Communication History (Audit Trail)
                    </h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-[#F5F7F6] rounded border border-[#DFE6E2]">
                      <div className="flex justify-between font-mono text-[10px] text-gray-500">
                        <span className="font-bold text-[#123B32]">AICTE Automated Audit Notice</span>
                        <span>14 Feb 2026</span>
                      </div>
                      <p className="text-gray-800 mt-1">
                        Rule Engine alert: Faculty Form 16 mismatch in Department of Artificial Intelligence & Data Science.
                      </p>
                    </div>
                    <div className="p-2.5 bg-red-50/70 border-l-4 border-l-red-600 border border-red-200 rounded">
                      <div className="flex justify-between font-mono text-[10px] text-red-800">
                        <span className="font-bold">Scrutiny Officer Observation (Dr. Rajesh Sharma)</span>
                        <span>18 Feb 2026</span>
                      </div>
                      <p className="text-red-950 mt-1">
                        "Uploaded Form 16 Part-B does not reflect 24Q TDS filing with Income Tax Portal for Q3 AY 2025-26. Recommended for formal statutory defect notice under APH Clause 7.12."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Live CEI Checklist & Scrutiny Determination Actions */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. Live CEI Checklist */}
                <div className="bg-white border-2 border-[#123B32] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#DFE6E2] pb-3 mb-3">
                    <div>
                      <h3 className="text-xs font-bold text-[#123B32] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Compliance Evidence Intelligence (CEI)</span>
                      </h3>
                      <p className="text-[11px] text-gray-500">Live Regulatory Checklist per APH 2026-27 Norms</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#123B32] text-white">
                      3 / 5 PASS
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Item A */}
                    <div className="p-3 rounded border border-red-200 bg-red-50/70">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-red-800 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Clause 7.4: Faculty Cadre Ratio & Pay</span>
                        </div>
                        <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px] font-bold">
                          DEFICIENT
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 mt-1">
                        Automated Check: 3 Assistant Professors missing Form 16 / TDS match. Ratio 1:24 vs mandated 1:20 norm.
                      </p>
                      <div className="mt-2 pt-2 border-t border-red-200 flex justify-end gap-2">
                        <button
                          onClick={() => setIsClarificationModalOpen(true)}
                          className="text-[11px] font-bold text-red-700 hover:underline"
                        >
                          Issue Defect Letter &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Item B */}
                    <div className="p-3 rounded border border-[#C1E4D0] bg-[#EAF5EF]/70">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Clause 6.8: Barrier-free Physical Infrastructure</span>
                        </div>
                        <span className="px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[10px] font-bold">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 mt-1">
                        Ramps, tactile pathways, and Divyangjan compliant restrooms validated with GIS geo-tagged photos.
                      </p>
                    </div>

                    {/* Item C */}
                    <div className="p-3 rounded border border-[#C1E4D0] bg-[#EAF5EF]/70">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Clause 5.1: Lab Equipment & Software</span>
                        </div>
                        <span className="px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[10px] font-bold">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 mt-1">
                        Model curriculum compliance at 98.4% with original perpetual license certificates verified.
                      </p>
                    </div>

                    {/* Item D */}
                    <div className="p-3 rounded border border-[#C2DCF2] bg-[#EBF3FA]/70">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-blue-900 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Clause 8.2: Fire Safety NOC Renewal</span>
                        </div>
                        <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-bold">
                          EXPIRING IN 18D
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 mt-1">
                        State Fire Service NOC expires 20 Mar 2026. Renewal acknowledgement submitted; final order awaited.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Official Scrutiny Notes & Action Panel */}
                <div className="bg-white border border-[#DFE6E2] rounded-lg p-4 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#101E1A] uppercase tracking-wider">
                    Official Scrutiny Determination
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      Scrutiny Officer Observations (Recorded in Case File)
                    </label>
                    <textarea
                      rows={4}
                      value={scrutinyNote}
                      onChange={(e) => setScrutinyNote(e.target.value)}
                      className="w-full p-2.5 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsClarificationModalOpen(true)}
                    >
                      Confirm Non-Compliance & Issue Deficiency Memo
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => showToast('info', 'Observation Saved', 'Draft observation logged to case.')}
                      >
                        Save Observation
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleClearScrutiny}
                      >
                        Forward Case
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: MY TASKS & CROSS-APPLICATION EVIDENCE QUEUE                       */}
      {/* ========================================================================= */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          {/* Task Filter Strip */}
          <div className="bg-white p-3 rounded-lg border border-[#DFE6E2] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-500 font-bold uppercase text-[10px] mr-1">Filter Queue:</span>
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'ALL' ? 'bg-[#123B32] text-white' : 'bg-[#F5F7F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('ASSIGNED_ME')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'ASSIGNED_ME' ? 'bg-[#123B32] text-white' : 'bg-[#F5F7F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assigned to My Desk
              </button>
              <button
                onClick={() => setTaskFilter('EVIDENCE')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'EVIDENCE' ? 'bg-[#123B32] text-white' : 'bg-[#F5F7F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                Evidence Verification
              </button>
              <button
                onClick={() => setTaskFilter('CLARIFICATION')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'CLARIFICATION' ? 'bg-[#123B32] text-white' : 'bg-[#F5F7F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clarification Reviews
              </button>
              <button
                onClick={() => setTaskFilter('POLICY')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'POLICY' ? 'bg-[#123B32] text-white' : 'bg-[#F5F7F6] text-gray-700 hover:bg-gray-200'
                }`}
              >
                Policy Impact Reviews
              </button>
              <button
                onClick={() => setTaskFilter('OVERDUE')}
                className={`px-2.5 py-1 rounded font-bold ${
                  taskFilter === 'OVERDUE' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Overdue SLA ({tasks.filter((t) => t.isOverdue).length})
              </button>
            </div>
            <div className="text-gray-500 font-mono text-[11px]">
              Displaying {filteredTasks.length} operational tasks
            </div>
          </div>

          {/* Task Queue Table */}
          <div className="bg-white border border-[#DFE6E2] rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAEFE9] text-[#101E1A] text-[10px] uppercase font-bold tracking-wider border-b border-[#DFE6E2]">
                    <th className="py-2.5 px-3">Task Details & Subject</th>
                    <th className="py-2.5 px-3">Related Application / Case</th>
                    <th className="py-2.5 px-2">Task Type</th>
                    <th className="py-2.5 px-2">Assigned To</th>
                    <th className="py-2.5 px-2">Due Date & SLA</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE6E2]">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#101E1A]">{t.title}</div>
                        <div className="text-[11px] text-gray-600 mt-0.5 line-clamp-1">{t.sourceEvent}</div>
                      </td>
                      <td className="py-3 px-3">
                        {t.applicationNumber ? (
                          <div>
                            <span className="font-semibold text-[#123B32]">{t.applicationNumber}</span>
                            <div className="text-[11px] text-gray-600 truncate max-w-[180px]">{t.institutionName}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 font-semibold">{t.policyVersion || 'Regulatory Source'}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-[10px]">
                          {t.taskType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium text-[#101E1A]">{t.assignedToName || 'Unassigned'}</div>
                        <div className="text-[10px] text-gray-500">{t.assignedRole.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={t.isOverdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                          {t.dueDate}
                        </span>
                        {t.isOverdue && (
                          <span className="block text-[9px] text-red-600 uppercase font-bold">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={t.status === 'COMPLETED' ? 'success' : t.isOverdue ? 'error' : 'progress'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {t.applicationId ? (
                            <Link
                              to={`/applications/${t.applicationId}`}
                              className="h-7 px-2.5 bg-white hover:bg-gray-100 text-[#123B32] border border-[#DFE6E2] rounded text-[11px] font-semibold inline-flex items-center justify-center transition-colors shadow-2xs"
                            >
                              Open Case &rarr;
                            </Link>
                          ) : (
                            <Link
                              to="/regulatory-changes"
                              className="h-7 px-2.5 bg-white hover:bg-gray-100 text-[#123B32] border border-[#DFE6E2] rounded text-[11px] font-semibold inline-flex items-center justify-center transition-colors shadow-2xs"
                            >
                              Examine Diff &rarr;
                            </Link>
                          )}
                          {t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleResolveTask(t.id)}
                              className="h-7 px-2.5 bg-[#123B32] hover:bg-[#0B2924] text-white rounded text-[11px] font-semibold inline-flex items-center justify-center transition-colors shadow-2xs"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? `Evidence Document Preview: ${previewDoc.fileName}` : 'Preview'}
        subtitle="Digital Signature Validated Evidence Docket"
      >
        {previewDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#EAF5EF] border border-[#C1E4D0] rounded flex items-center justify-between text-[#123B32]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold">Cryptographically Validated Document (SHA-256)</div>
                  <div className="text-[10px] text-gray-600 font-mono">CCA eSign 3.2.0 • Digital Certificate Verified</div>
                </div>
              </div>
            </div>

            <div className="bg-[#F5F7F6] border border-[#DFE6E2] rounded p-5 space-y-2 text-[#101E1A]">
              <p>
                <strong>File Name:</strong> {previewDoc.fileName}
              </p>
              <p>
                <strong>Document Type:</strong> {previewDoc.documentType}
              </p>
              <p>
                <strong>Uploaded On:</strong> {previewDoc.uploadedAt} by {previewDoc.uploadedBy}
              </p>
              {previewDoc.expiryDate && (
                <p>
                  <strong>Validity Expiration:</strong> {previewDoc.expiryDate}
                </p>
              )}
              <div className="p-2 bg-white rounded border border-gray-200 font-mono text-[10px] text-gray-700">
                Automated Verification Result: {previewDoc.automatedCheck?.message}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
              {previewDoc.status !== 'VERIFIED' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleVerifyDoc(previewDoc.id, 'APPROVED');
                    setPreviewDoc(null);
                  }}
                >
                  Verify & Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Clarification Modal */}
      <Modal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        title="Issue Deficiency Notice / Clarification"
        subtitle={`Dossier: ${selectedApp?.applicationNumber || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Deficiency Description *</label>
            <textarea
              rows={4}
              value={clarificationReason}
              onChange={(e) => setClarificationReason(e.target.value)}
              className="w-full p-2.5 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              placeholder="State precise deficiency observed during scrutiny..."
            />
          </div>
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Response Deadline (Standard 14 Days)</label>
            <input
              type="date"
              value={clarificationDeadline}
              onChange={(e) => setClarificationDeadline(e.target.value)}
              className="w-full p-2 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsClarificationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleIssueClarification}>
              Issue Formal Notice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
