import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Application, SystemAlert, UserRole, WorkflowStage } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  Clock,
  Stamp,
  Award,
  ChevronRight,
  FileText,
  Building,
  Filter,
  ExternalLink,
  Layers,
  Activity,
  History,
  AlertCircle,
} from 'lucide-react';

interface RegionalMetric {
  region: string;
  office: string;
  total: number;
  inScrutiny: number;
  inEVC: number;
  decisionPending: number;
  overdue: number;
  avgDays: number;
  complianceRate: number;
}

const NATIONAL_REGIONAL_METRICS: RegionalMetric[] = [
  { region: 'Central', office: 'CRO Bhopal', total: 1840, inScrutiny: 240, inEVC: 95, decisionPending: 42, overdue: 8, avgDays: 14.2, complianceRate: 94.2 },
  { region: 'Western', office: 'WRO Mumbai', total: 2450, inScrutiny: 310, inEVC: 140, decisionPending: 68, overdue: 14, avgDays: 16.8, complianceRate: 91.5 },
  { region: 'Southern', office: 'SRO Chennai', total: 3120, inScrutiny: 420, inEVC: 180, decisionPending: 85, overdue: 19, avgDays: 18.1, complianceRate: 89.8 },
  { region: 'North-West', office: 'NWRO Chandigarh', total: 1280, inScrutiny: 160, inEVC: 72, decisionPending: 28, overdue: 6, avgDays: 12.9, complianceRate: 95.8 },
  { region: 'Northern', office: 'NRO Kanpur', total: 1950, inScrutiny: 280, inEVC: 110, decisionPending: 54, overdue: 12, avgDays: 15.4, complianceRate: 92.1 },
  { region: 'Eastern', office: 'ERO Kolkata', total: 980, inScrutiny: 120, inEVC: 48, decisionPending: 20, overdue: 4, avgDays: 13.5, complianceRate: 96.0 },
];

export const CentralOversightPage: React.FC = () => {
  const { currentUser, isDecisionMaker, isCentralOfficer, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | 'REMAND'>('APPROVE');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [orderSerial, setOrderSerial] = useState(`AICTE/AB/2026/ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Tab State synced with URL query parameter
  type TabType = 'decisions' | 'pendency' | 'national_matrix' | 'bottlenecks' | 'recent_decisions';
  const urlTab = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(
    urlTab && ['decisions', 'pendency', 'national_matrix', 'bottlenecks', 'recent_decisions'].includes(urlTab)
      ? urlTab
      : 'decisions'
  );

  // Selected stage filter for the national pendency view
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>('ALL');

  // Filter for decision roster
  const [decisionFilter, setDecisionFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');

  useEffect(() => {
    if (urlTab && ['decisions', 'pendency', 'national_matrix', 'bottlenecks', 'recent_decisions'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, alts] = await Promise.all([
          api.getApplications(),
          api.getAlerts({ isResolved: 'false' }),
        ]);
        setApplications(apps);
        setAlerts(alts);
      } catch (err) {
        console.error('Failed to load Central Oversight data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics from authoritative shared applications
  const pendingDecisions = applications.filter(
    (a) => a.currentStage === 'DECISION_PENDING' || a.currentStage === 'COMMITTEE_REVIEW'
  );
  const approvedList = applications.filter((a) => a.currentStage === 'APPROVED');
  const overdueCount = applications.filter((a) => a.isOverdue).length;
  const pipelineCount = applications.filter((a) => a.currentStage !== 'APPROVED' && a.currentStage !== 'CLOSED').length;

  // Filtered decisions list based on toggle
  const filteredDecisions = applications.filter((a) => {
    if (decisionFilter === 'PENDING') {
      return a.currentStage === 'DECISION_PENDING' || a.currentStage === 'COMMITTEE_REVIEW';
    }
    if (decisionFilter === 'APPROVED') {
      return a.currentStage === 'APPROVED';
    }
    return true;
  });

  // Safe, idempotent decision execution handler
  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    // Guard against duplicate in-flight submissions
    if (isSubmittingDecision) return;

    // Guard against invalid transition if already decided
    if (selectedApp.currentStage === 'APPROVED') {
      showToast(
        'warning',
        'Decision Already Finalized',
        `${selectedApp.institutionName} is already APPROVED with an issued Letter of Approval (LoA).`
      );
      setIsDecisionModalOpen(false);
      return;
    }

    setIsSubmittingDecision(true);

    try {
      const nextStage: WorkflowStage =
        decisionAction === 'APPROVE' ? 'APPROVED' : decisionAction === 'REJECT' ? 'REJECTED' : 'COMMITTEE_REVIEW';

      const actionLabel =
        decisionAction === 'APPROVE'
          ? 'Letter of Approval (LoA) Formally Granted'
          : decisionAction === 'REJECT'
          ? 'Letter of Rejection (LoR) Issued on Statutory Grounds'
          : 'Remanded to Standing Hearing Committee for Special Review';

      const updated = await api.transitionApplication(selectedApp.id, {
        nextStage,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: actionLabel,
        reason: `${decisionRemarks} (Order Ref: ${orderSerial})`,
      });

      // Update state authoritatively
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

      // If already processed, show clean informational message without duplicate transition error
      if ((updated as any).alreadyCompleted) {
        showToast(
          'info',
          'Decision Already Recorded',
          `Application ${updated.applicationNumber} is already in Approved status with an active Letter of Approval.`
        );
      } else {
        // Emit exactly one success toast on true successful transition
        showToast(
          decisionAction === 'APPROVE' ? 'success' : decisionAction === 'REJECT' ? 'error' : 'warning',
          'Formal Decision Recorded',
          `${actionLabel} for ${updated.institutionName}`
        );
      }

      setIsDecisionModalOpen(false);
      setDecisionRemarks('');
    } catch (err: any) {
      // Emit exactly one error toast on failure, NEVER with a success toast
      showToast('error', 'Decision Execution Failed', err.message);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-[#123B32] border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Central Oversight & Decision Authority Workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Executive Masthead (Clean, balanced hierarchy) */}
      <div className="bg-white p-5 rounded-lg border border-[#DFE6E2] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-[#123B32] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              Central Headquarters
            </span>
            <span className="bg-[#E1F3EB] text-[#123B32] border border-[#A3D9C4] text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
              Consolidated Operational Workspace
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#172B26] tracking-tight leading-snug">
            Central Oversight & Decision Authority
          </h1>
          <p className="text-xs text-[#61716B] max-w-3xl leading-relaxed">
            Unified national governance, statutory application decisions, multi-regional pendency monitoring, and executive escalations under the AICTE Act & Regulations.
          </p>
        </div>

        {/* Persona Indicator Banner */}
        <div className="flex items-center gap-2.5 text-xs flex-shrink-0 self-start lg:self-center">
          <div className="px-3 py-1.5 rounded-md bg-[#E1F3EB] border border-[#A3D9C4] text-[#123B32] font-semibold flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#123B32]" />
            <span>
              {isDecisionMaker
                ? 'Mode: Competent Decision Authority'
                : isCentralOfficer
                ? 'Mode: Regulation Bureau Central Officer'
                : 'Mode: System Administrator'}
            </span>
          </div>
          <div className="px-2.5 py-1.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs">
            AY 2026-27 (APH v2.4)
          </div>
        </div>
      </div>

      {/* 2. Bento Action Summary Cards (Computed from Authoritative Live Records) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div
          onClick={() => handleTabChange('decisions')}
          className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-[#123B32] cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Decisions Awaiting Action</span>
          <div className="text-2xl font-bold text-blue-900 mt-1">{pendingDecisions.length} Cases</div>
          <div className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Competent Order
          </div>
        </div>

        <div
          onClick={() => handleTabChange('pendency')}
          className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-[#123B32] cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Applications in Pipeline</span>
          <div className="text-2xl font-bold text-[#172B26] mt-1">{pipelineCount} Cases</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Under Scrutiny / EVC</div>
        </div>

        <div
          onClick={() => {
            setDecisionFilter('APPROVED');
            handleTabChange('decisions');
          }}
          className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-[#123B32] cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">LoA Issued (Approved)</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{approvedList.length} Dossiers</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
            <Award className="w-3 h-3" /> Formal Sanctions Granted
          </div>
        </div>

        <div
          onClick={() => handleTabChange('bottlenecks')}
          className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-red-400 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">Overdue Statutory SLAs</span>
          <div className="text-2xl font-bold text-red-700 mt-1">{overdueCount} Cases</div>
          <div className="text-[10px] text-red-600 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Level 1/2 Escalations
          </div>
        </div>

        <div
          onClick={() => handleTabChange('national_matrix')}
          className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm hover:border-purple-400 cursor-pointer transition-all"
        >
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">National Compliance</span>
          <div className="text-2xl font-bold text-purple-800 mt-1">93.2%</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Norms Verification Index</div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="border-b border-gray-200 flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => handleTabChange('decisions')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'decisions'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Stamp className="w-4 h-4" />
          <span>My Decisions ({pendingDecisions.length})</span>
          {pendingDecisions.length > 0 && isDecisionMaker && (
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
              Action Required
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('pendency')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'pendency'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>National Pendency Pipeline</span>
        </button>

        <button
          onClick={() => handleTabChange('national_matrix')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'national_matrix'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Regional Performance Matrix</span>
        </button>

        <button
          onClick={() => handleTabChange('bottlenecks')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'bottlenecks'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Bottlenecks & Escalations ({alerts.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('recent_decisions')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'recent_decisions'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Recent Decisions & Audit Log</span>
        </button>
      </div>

      {/* TAB 1: MY DECISIONS — PRIMARY OPERATIONAL WORKBENCH */}
      {activeTab === 'decisions' && (
        <Card
          title="Competent Authority Statutory Decision Roster"
          subtitle="Formally grant Letter of Approval (LoA), issue Speaking Orders of Rejection, or remand cases for Appellate hearing."
          action={
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Filter:</span>
              <button
                onClick={() => setDecisionFilter('PENDING')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  decisionFilter === 'PENDING'
                    ? 'bg-[#123B32] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending ({pendingDecisions.length})
              </button>
              <button
                onClick={() => setDecisionFilter('APPROVED')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  decisionFilter === 'APPROVED'
                    ? 'bg-[#123B32] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Approved LoA ({approvedList.length})
              </button>
              <button
                onClick={() => setDecisionFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  decisionFilter === 'ALL'
                    ? 'bg-[#123B32] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Dossiers
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {filteredDecisions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-gray-700">No applications currently matching this filter.</p>
                <p className="text-gray-500 mt-1">All active institutional dossiers have been disposed or are in earlier scrutiny stages.</p>
              </div>
            ) : (
              filteredDecisions.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white hover:border-[#123B32] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/applications/${app.id}`}
                        className="font-mono text-xs font-bold text-[#123B32] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:underline flex items-center gap-1"
                      >
                        {app.applicationNumber}
                        <ExternalLink className="w-3 h-3 text-[#123B32]" />
                      </Link>
                      <Badge
                        variant={
                          app.currentStage === 'APPROVED'
                            ? 'success'
                            : app.currentStage === 'DECISION_PENDING'
                            ? 'warning'
                            : 'progress'
                        }
                      >
                        {app.stageLabel}
                      </Badge>
                      <span className="text-xs text-gray-500">• {app.categoryLabel}</span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900">{app.institutionName}</h3>
                    <div className="text-xs text-gray-600 flex flex-wrap gap-4">
                      <span>Region: <strong>{app.region}</strong> ({app.district}, {app.state})</span>
                      <span>Processing Ageing: <strong>{app.daysInCurrentStage} days</strong></span>
                      <span>Target SLA: <strong>15 days</strong></span>
                      {app.programmeName && (
                        <span>Programme: <strong>{app.programmeName}</strong></span>
                      )}
                    </div>

                    {/* Case Highlights & Formal Record */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1.5">
                      {app.currentStage === 'APPROVED' && app.formalDecision ? (
                        <div className="text-emerald-800 space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Formal Letter of Approval (LoA) Formally Issued
                          </div>
                          <div className="text-[11px] text-gray-600">
                            Sanction Order Ref: <strong>{app.formalDecision.orderSerial}</strong> • Decided By: <strong>{app.formalDecision.decidedBy}</strong>
                          </div>
                          <div className="text-[11px] text-gray-600 italic">
                            Rationale: "{app.formalDecision.statutoryRationale}"
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-gray-700">
                            <strong>Scrutiny Officer Finding:</strong> Infrastructure, built-up area and Fire Safety compliance verified without deficiencies.
                          </div>
                          <div className="text-emerald-800">
                            <strong>SAC Committee Recommendation:</strong> Recommend Formal Approval (LoA) for AY 2026-27 under Clause 1.4 of APH.
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/applications/${app.id}`}>
                      <Button size="sm" variant="outline">
                        View Dossier
                      </Button>
                    </Link>

                    {app.currentStage === 'DECISION_PENDING' && (isDecisionMaker || isAdmin) && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Stamp className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedApp(app);
                          setDecisionAction('APPROVE');
                          setOrderSerial(`AICTE/AB/2026/LOA-${app.applicationNumber.split('/').pop()}`);
                          setDecisionRemarks(`Granted formal Letter of Approval (LoA) for academic year 2026-27 in accordance with Approval Process Handbook norms.`);
                          setIsDecisionModalOpen(true);
                        }}
                      >
                        Record Formal Decision
                      </Button>
                    )}

                    {app.currentStage === 'APPROVED' && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        LoA Granted
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 2: NATIONAL PENDENCY PIPELINE */}
      {activeTab === 'pendency' && (
        <div className="space-y-6">
          <Card
            title="National Stage-Wise Application Pipeline"
            subtitle="Track cross-regional case distribution across all statutory lifecycle stages."
          >
            {/* Stage Pipeline Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { stage: 'ALL', label: 'All Cases', count: applications.length, color: 'border-gray-300' },
                { stage: 'SUBMITTED', label: '1. Submitted', count: applications.filter((a) => a.currentStage === 'SUBMITTED').length, color: 'border-blue-300' },
                { stage: 'SCRUTINY', label: '2. Scrutiny', count: applications.filter((a) => a.currentStage === 'SCRUTINY').length, color: 'border-cyan-300' },
                { stage: 'CLARIFICATION_REQUIRED', label: '3. Clarification', count: applications.filter((a) => a.currentStage === 'CLARIFICATION_REQUIRED').length, color: 'border-amber-300' },
                { stage: 'EVC_SCHEDULED', label: '4. EVC Scheduled', count: applications.filter((a) => a.currentStage === 'EVC_SCHEDULED' || a.currentStage === 'EVC_REQUIRED').length, color: 'border-orange-300' },
                { stage: 'COMMITTEE_REVIEW', label: '5. Committee', count: applications.filter((a) => a.currentStage === 'COMMITTEE_REVIEW' || a.currentStage === 'REPORT_PENDING').length, color: 'border-indigo-300' },
                { stage: 'DECISION_PENDING', label: '6. Decision Pending', count: applications.filter((a) => a.currentStage === 'DECISION_PENDING').length, color: 'border-purple-300' },
                { stage: 'APPROVED', label: '7. Approved (LoA)', count: applications.filter((a) => a.currentStage === 'APPROVED').length, color: 'border-emerald-300' },
              ].map((item) => (
                <div
                  key={item.stage}
                  onClick={() => setSelectedPipelineStage(item.stage)}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                    selectedPipelineStage === item.stage
                      ? 'bg-[#E1F3EB] border-[#123B32] shadow-sm font-bold text-[#123B32]'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-[11px] truncate uppercase font-semibold text-gray-500">{item.label}</div>
                  <div className="text-xl font-bold mt-1">{item.count}</div>
                </div>
              ))}
            </div>

            {/* Application List in Selected Stage */}
            <div className="mt-6 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-50 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Applications in Selected View ({selectedPipelineStage})</span>
                <span className="text-gray-500 font-normal">Click any application to view full dossier</span>
              </div>
              {applications
                .filter((a) => selectedPipelineStage === 'ALL' || a.currentStage === selectedPipelineStage || (selectedPipelineStage === 'EVC_SCHEDULED' && (a.currentStage === 'EVC_REQUIRED' || a.currentStage === 'EVC_SCHEDULED')))
                .map((app) => (
                  <div key={app.id} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/applications/${app.id}`} className="font-mono font-bold text-[#123B32] hover:underline">
                          {app.applicationNumber}
                        </Link>
                        <Badge variant="progress">{app.stageLabel}</Badge>
                        <span className="text-gray-500">• {app.categoryLabel}</span>
                      </div>
                      <div className="font-semibold text-gray-900 mt-0.5">{app.institutionName}</div>
                      <div className="text-gray-500 text-[11px]">
                        Region: {app.region} • Submitted: {app.submissionDate} • Ageing: {app.daysInCurrentStage} days
                      </div>
                    </div>
                    <Link to={`/applications/${app.id}`}>
                      <Button size="sm" variant="outline">
                        Open Dossier
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: REGIONAL PERFORMANCE MATRIX */}
      {activeTab === 'national_matrix' && (
        <Card
          title="Consolidated Regional Performance & Pendency Matrix"
          subtitle="Cross-regional intake, disposal rates, and statutory SLA compliance across all 6 Regional Offices."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-2.5 px-3">Regional Office</th>
                  <th className="py-2.5 px-3">Total Intake</th>
                  <th className="py-2.5 px-3">Digital Scrutiny</th>
                  <th className="py-2.5 px-3">EVC Roster</th>
                  <th className="py-2.5 px-3">Decision Pending</th>
                  <th className="py-2.5 px-3">Overdue SLA</th>
                  <th className="py-2.5 px-3">Avg Disposal</th>
                  <th className="py-2.5 px-3 text-right">Compliance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {NATIONAL_REGIONAL_METRICS.map((stat) => (
                  <tr key={stat.region} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#123B32]">{stat.region} Region</div>
                      <div className="text-[10px] text-gray-500">{stat.office}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{stat.total}</td>
                    <td className="py-3 px-3 text-blue-700 font-medium">{stat.inScrutiny}</td>
                    <td className="py-3 px-3 text-amber-700 font-medium">{stat.inEVC}</td>
                    <td className="py-3 px-3 text-purple-700 font-medium">{stat.decisionPending}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${stat.overdue > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {stat.overdue} cases
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700">{stat.avgDays} days</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-800">{stat.complianceRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PROCESSING BOTTLENECKS & ESCALATIONS RADAR */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              title="Statutory SLA Escalations"
              subtitle="Active Level 1 and Level 2 escalations requiring central administrative intervention."
            >
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-red-200 bg-red-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-red-950">{alert.title}</div>
                        <div className="text-gray-700 mt-0.5">{alert.message}</div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          Escalation: <strong>{alert.severity}</strong> • Due: {alert.deadline || 'Immediate'}
                        </div>
                      </div>
                    </div>
                    {alert.applicationId && (
                      <Link to={`/applications/${alert.applicationId}`} className="flex-shrink-0">
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card
              title="Regional Bottleneck Analysis"
              subtitle="Identified stage clustering and delay factors across regional processing cells."
            >
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="font-bold text-amber-950">Southern Region (SRO Chennai) — EVC Roster Bottleneck</div>
                  <div className="text-gray-700 mt-1">
                    180 inspections scheduled; committee nomination backlog averaging 18.1 days vs 14-day SLA.
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold mt-1">
                    Recommended Action: Remand secondary EVC panels to affiliated State Directorate experts.
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="font-bold text-blue-950">Western Region (WRO Mumbai) — Scrutiny Clarification Delay</div>
                  <div className="text-gray-700 mt-1">
                    310 dossiers awaiting institution response to Fire Safety NOC and Faculty cadre ratios.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: RECENT DECISIONS & AUDIT ACTIVITY */}
      {activeTab === 'recent_decisions' && (
        <Card
          title="Recent Decisions & Statutory Sanction Ledger"
          subtitle="Immutable record of formal Letters of Approval (LoA) and Speaking Orders granted by the Competent Authority."
        >
          <div className="divide-y divide-gray-100">
            {approvedList.map((app) => (
              <div key={app.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#123B32]">{app.applicationNumber}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      FORMAL APPROVAL (LoA)
                    </span>
                    <span className="text-gray-500">• {app.categoryLabel}</span>
                  </div>
                  <div className="font-bold text-gray-900 mt-1">{app.institutionName}</div>
                  <div className="text-gray-500 text-[11px]">
                    Sanction Order Ref: <strong>{app.formalDecision?.orderSerial || `AICTE/LOA/2026/${app.id}`}</strong> • Decided By: {app.formalDecision?.decidedBy || 'Prof. T. G. Sitharam (Chairman)'}
                  </div>
                </div>
                <Link to={`/applications/${app.id}`}>
                  <Button size="sm" variant="outline">
                    View Sanction Dossier
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Decision Recording Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          if (!isSubmittingDecision) setIsDecisionModalOpen(false);
        }}
        title="Execute Statutory Approval Decision"
        subtitle={`Case: ${selectedApp?.applicationNumber} — ${selectedApp?.institutionName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleRecordDecision} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[10px]">
              Statutory Decision Action *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecisionAction('APPROVE')}
                className={`p-2.5 rounded border text-left flex items-center gap-2 transition-all ${
                  decisionAction === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Formal Approval (LoA)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecisionAction('REJECT')}
                className={`p-2.5 rounded border text-left flex items-center gap-2 transition-all ${
                  decisionAction === 'REJECT'
                    ? 'border-red-600 bg-red-50 text-red-900 font-bold shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Speaking Order (LoR)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecisionAction('REMAND')}
                className={`p-2.5 rounded border text-left flex items-center gap-2 transition-all ${
                  decisionAction === 'REMAND'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-sm'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Remand to Hearing (SAC)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[10px]">
              Official Sanction Order Reference *
            </label>
            <input
              type="text"
              value={orderSerial}
              onChange={(e) => setOrderSerial(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1 uppercase tracking-wider text-[10px]">
              Statutory Rationale & Sanction Terms *
            </label>
            <textarea
              rows={3}
              value={decisionRemarks}
              onChange={(e) => setDecisionRemarks(e.target.value)}
              placeholder="Record formal statutory grounds citing Approval Process Handbook 2026-27 norms, scrutiny verification, and SAC recommendations..."
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-[#123B32] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Digital DSC Seal attached automatically to approval order.</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              DSC: e-Sign Certified (e-Mudhra PKI)
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmittingDecision}
              onClick={() => setIsDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingDecision}
              className="bg-[#123B32] hover:bg-[#0B2924] text-white flex items-center gap-1.5"
            >
              {isSubmittingDecision ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Executing Order...</span>
                </>
              ) : (
                <span>Issue Official Order</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
