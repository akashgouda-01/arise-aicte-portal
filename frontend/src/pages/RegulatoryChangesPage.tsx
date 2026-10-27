import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RegulatoryPolicy } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FileUploadModal } from '../components/ui/FileUploadModal';
import {
  Scale,
  Sparkles,
  CheckCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Send,
  Building,
  Gavel,
  History,
  ShieldAlert,
  Save,
  Download,
  RefreshCw,
  Radio,
  FileCheck2,
  CheckCircle2,
  Lock,
  UploadCloud,
} from 'lucide-react';

export const RegulatoryChangesPage: React.FC = () => {
  const { currentUser, isDecisionMaker, isAdmin, isInstitution, isEVCMember, isProcessingOfficer } = useAuth();
  const { showToast } = useToast();

  const [policies, setPolicies] = useState<RegulatoryPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<(RegulatoryPolicy & { affectedApplications?: any[]; liveAffectedCount?: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Disposition choices for application categories
  const [dispUG, setDispUG] = useState<'grandfather' | 'apply'>('grandfather');
  const [dispMgmt, setDispMgmt] = useState<'grandfather' | 'apply'>('apply');
  const [dispPharm, setDispPharm] = useState<'grandfather' | 'apply'>('grandfather');

  // Publish modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [gazetteRef, setGazetteRef] = useState('S.O. 412(E) — Gazette of India Extraordinary Part II, Sec 3(ii)');
  const [transitionNotes, setTransitionNotes] = useState(
    'Existing in-flight applications granted 1 academic session glidepath (Annexure IX-B) for adjunct faculty compliance.'
  );
  const [publishing, setPublishing] = useState(false);
  const [isPolicyUploadModalOpen, setIsPolicyUploadModalOpen] = useState(false);

  // Authorization check for policy administration
  const isAuthorizedPolicyAdmin = isDecisionMaker || isAdmin;

  useEffect(() => {
    async function loadPolicies() {
      try {
        const list = await api.getPolicies();
        setPolicies(list);
        if (list.length > 0) {
          const detail = await api.getPolicyById(list[0].id);
          setSelectedPolicy(detail);
          if (detail.gazetteReference) setGazetteRef(detail.gazetteReference);
          if (detail.transitionPolicy) setTransitionNotes(detail.transitionPolicy);
        }
      } catch (err) {
        console.error('Failed to load policies', err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const handleSelectPolicy = async (p: RegulatoryPolicy) => {
    try {
      const detail = await api.getPolicyById(p.id);
      setSelectedPolicy(detail);
      if (detail.gazetteReference) setGazetteRef(detail.gazetteReference);
      if (detail.transitionPolicy) setTransitionNotes(detail.transitionPolicy);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmPublish = async () => {
    if (!selectedPolicy) return;
    setPublishing(true);
    try {
      const updated = await api.publishPolicy(selectedPolicy.id, {
        publishedBy: currentUser.name,
        actorRole: currentUser.role,
        gazetteReference: gazetteRef,
        transitionPolicy: transitionNotes,
      });

      setSelectedPolicy({ ...selectedPolicy, ...updated, status: 'PUBLISHED' });
      setPolicies((prev) => prev.map((p) => (p.id === updated.id ? { ...p, status: 'PUBLISHED' } : p)));
      showToast(
        'success',
        'Regulatory Policy Enacted',
        `${updated.version} published into Gazette of India. Impacted live dossiers updated with transition tasks.`
      );
      setIsPublishModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Publication Denied', err.message);
    } finally {
      setPublishing(false);
    }
  };

  // If user is non-authorized (e.g. Institution or EVC member), show restricted governance notice
  if (!isAuthorizedPolicyAdmin && (isInstitution || isEVCMember)) {
    return (
      <div className="bg-white p-8 rounded-lg border border-[#DFE6E2] shadow-sm text-center max-w-2xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#101E1A]">Restricted Policy Administration Workspace</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          The Regulatory Change Impact Engine (RCIE) is a restricted statutory capability reserved exclusively for the <strong>Competent Decision-Making Authority</strong> and <strong>Policy Administrators</strong>.
        </p>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 font-mono">
          Your active persona: {currentUser.name} ({currentUser.role})
        </div>
        <p className="text-xs text-gray-500">
          To test this capability, switch to <strong>Prof. T. G. Sitharam (Central Oversight & Decision Authority)</strong> via the Role Switcher in the top navigation bar.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-[#123B32] border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Regulatory Change Impact Engine...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header (Matches Stitch RCIE Masthead) */}
      <div className="bg-white p-4 rounded-lg border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#101E1A]">
              Regulatory Change Impact Engine (RCIE)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#123B32] text-white">
              CENTRAL POLICY REGISTRY
            </span>
          </div>
          <p className="text-xs text-[#414846] mt-0.5">
            Turn handbook amendments, circulars, and gazetted notifications into traceable, reviewable impact assessments across active institutional approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthorizedPolicyAdmin && (
            <button
              onClick={() => setIsPolicyUploadModalOpen(true)}
              className="bg-white hover:bg-gray-50 text-[#123B32] border border-[#DFE6E2] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload Policy / Gazette Doc
            </button>
          )}
          <button
            onClick={() => showToast('info', 'Simulation Refreshed', 'RCIE algorithmic run re-computed across all regional databases.')}
            className="bg-white hover:bg-gray-50 text-[#123B32] border border-[#DFE6E2] px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Compute Simulation
          </button>
          {selectedPolicy?.status !== 'PUBLISHED' && (
            <Button
              size="sm"
              variant="primary"
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={() => setIsPublishModalOpen(true)}
            >
              Enact & Publish Policy
            </Button>
          )}
        </div>
      </div>

      {/* Controlled Progression Stepper (Matches Stitch Lines 308-356) */}
      <section aria-label="Progression Steps" className="bg-white border border-[#DFE6E2] rounded-lg p-3 shadow-xs">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Statutory Enactment & System Integration Lifecycle
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          {/* Step 1 */}
          <div className="flex flex-col border-t-2 border-emerald-600 pt-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> Step 1
            </span>
            <span className="font-semibold text-gray-900 mt-0.5">Draft Regulation</span>
            <span className="text-[10px] text-gray-500">Gazetted 14 Oct 2026</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col border-t-2 border-emerald-600 pt-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> Step 2
            </span>
            <span className="font-semibold text-gray-900 mt-0.5">Version Comparison</span>
            <span className="text-[10px] text-gray-500">Diff syntax validated</span>
          </div>

          {/* Step 3 */}
          <div className={`flex flex-col border-t-4 pt-1 p-1.5 rounded-b ${selectedPolicy?.status === 'PUBLISHED' ? 'border-emerald-600 bg-emerald-50' : 'border-[#123B32] bg-[#EAF5EF]'}`}>
            <span className="text-[10px] font-bold text-[#123B32] uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#123B32]" /> Step 3 (Active)
            </span>
            <span className="font-bold text-[#123B32] mt-0.5">Impact Assessment</span>
            <span className="text-[10px] text-emerald-800 font-medium">Algorithmic run complete</span>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col border-t-2 border-[#DFE6E2] pt-1 opacity-75">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Step 4</span>
            <span className="font-semibold text-gray-900 mt-0.5">Human Legal Review</span>
            <span className="text-[10px] text-gray-500">Policy Committee Desk</span>
          </div>

          {/* Step 5 */}
          <div className="flex flex-col border-t-2 border-[#DFE6E2] pt-1 opacity-75">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Step 5</span>
            <span className="font-semibold text-gray-900 mt-0.5">Member Secretary Sign-off</span>
            <span className="text-[10px] text-gray-500">Approved for Gazette</span>
          </div>

          {/* Step 6 */}
          <div className={`flex flex-col border-t-2 pt-1 ${selectedPolicy?.status === 'PUBLISHED' ? 'border-emerald-600 bg-emerald-50' : 'border-[#DFE6E2] opacity-75'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Step 6</span>
            <span className="font-semibold text-gray-900 mt-0.5">Published & Enforced</span>
            <span className="text-[10px] text-gray-500">{selectedPolicy?.status === 'PUBLISHED' ? 'Active Production Lock' : 'Pending Sign-off'}</span>
          </div>
        </div>
      </section>

      {/* Policy Source Metadata Header Card (Matches Stitch Lines 358-404) */}
      <section aria-labelledby="policy-metadata" className="bg-white border border-[#DFE6E2] rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DFE6E2] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-[#123B32]" />
            <h3 className="text-sm font-bold text-[#101E1A]" id="policy-metadata">
              Policy Source & Enactment Metadata
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Statutory ID:</span>
            <code className="font-mono bg-[#F5F7F6] px-2 py-0.5 rounded border border-[#DFE6E2] text-[#123B32] font-semibold">
              SO-412E-AY2026-REG-09
            </code>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Source Document</span>
            <p className="font-semibold text-[#101E1A] leading-snug">
              AICTE Approval Process Handbook (APH) Amendment 2026-27 (Gazette Notification S.O. 412(E))
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Version</span>
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#0B2924] bg-[#EAF5EF] px-2 py-0.5 rounded border border-[#C1E4D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Draft v2.4 (Proposed AY 2026-27)
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Previous Reference</span>
            <p className="text-gray-800">
              APH 2025-26 <span className="text-gray-500">(Gazetted 18 Jan 2025)</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Status</span>
            <span className="inline-block bg-[#FFF5D6] text-[#B7791F] border border-[#F3DA93] rounded px-2 py-0.5 text-[11px] font-bold uppercase">
              {selectedPolicy?.status.replace(/_/g, ' ') || 'IMPACT COMPUTED'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Responsible Legal Scrutineer</span>
            <p className="text-gray-800 font-medium">Dr. P. C. Joshi, Joint Director (Policy)</p>
          </div>
        </div>
      </section>

      {/* 4 Summary Impact Overview Cards (Matches Stitch Lines 405-475) */}
      <section aria-label="Impact Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#DFE6E2] rounded-lg p-3.5 shadow-xs">
          <div className="flex justify-between items-center text-gray-500 text-[10px] font-bold uppercase">
            <span>Requirements Affected</span>
            <Gavel className="w-4 h-4 text-[#123B32]" />
          </div>
          <div className="text-2xl font-bold text-[#101E1A] mt-1">7 Norms</div>
          <div className="text-xs font-medium text-[#123B32] mt-0.5">7 Norms Modified (2 New, 5 Amended)</div>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">+2 Governance Directives</span>
            <span className="text-gray-500">Cadre & Ingress</span>
          </div>
        </div>

        <div className="bg-white border border-[#DFE6E2] rounded-lg p-3.5 shadow-xs">
          <div className="flex justify-between items-center text-gray-500 text-[10px] font-bold uppercase">
            <span>Workflow Templates Impacted</span>
            <BookOpen className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-2xl font-bold text-[#101E1A] mt-1">3 Tracks</div>
          <div className="text-xs font-medium text-emerald-800 mt-0.5">EoA, Intake Variation, New Campus</div>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between text-[11px]">
            <span className="text-gray-500">V-Routing Modified</span>
            <span className="bg-blue-50 text-blue-800 text-[10px] px-1 rounded font-semibold">AY 2026-27</span>
          </div>
        </div>

        <div className="bg-white border border-[#DFE6E2] rounded-lg p-3.5 shadow-xs border-l-4 border-l-red-600">
          <div className="flex justify-between items-center text-red-700 text-[10px] font-bold uppercase">
            <span>Active Cases in Queue Impacted</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">184 Apps</div>
          <div className="text-xs font-semibold text-red-700 mt-0.5">Immediate Action / Transition Required</div>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between text-[11px]">
            <span className="text-red-700 font-bold">142 In-Flight EoA</span>
            <span className="text-gray-500">Scrutiny Stage</span>
          </div>
        </div>

        <div className="bg-white border border-[#DFE6E2] rounded-lg p-3.5 shadow-xs">
          <div className="flex justify-between items-center text-amber-700 text-[10px] font-bold uppercase">
            <span>Existing Institution Exemption</span>
            <Scale className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="text-2xl font-bold text-[#101E1A] mt-1">2 Clauses</div>
          <div className="text-xs font-semibold text-amber-800 mt-0.5">1-Year Grace Period Authorized</div>
          <div className="mt-2 pt-1.5 border-t border-gray-100 flex justify-between text-[11px]">
            <span className="text-amber-800 font-medium">Statutory Safeguard</span>
            <span className="text-gray-500">Annexure IX-B</span>
          </div>
        </div>
      </section>

      {/* Side-by-Side Version Diff & Clause Analysis Table (Matches Stitch Lines 476-586) */}
      <section aria-labelledby="diff-heading" className="bg-white border border-[#DFE6E2] rounded-lg overflow-hidden shadow-xs">
        <div className="bg-[#F5F7F6] px-4 py-3 border-b border-[#DFE6E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#101E1A] flex items-center gap-2" id="diff-heading">
              <Scale className="w-4 h-4 text-[#123B32]" />
              <span>Side-by-Side Version Diff & Clause Legal Scrutiny</span>
            </h3>
            <p className="text-[11px] text-[#414846]">
              Visualizing textual, operational, and numerical cadence changes between gazetted revisions.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 bg-[#FCEBEB] border border-[#F5C2C2] rounded-xs inline-block"></span>
              <span>Repealed / Deleted</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 bg-[#EAF5EF] border border-[#C1E4D0] rounded-xs inline-block"></span>
              <span>Amended / Inserted</span>
            </span>
          </div>
        </div>

        {/* Diff Comparison Blocks */}
        <div className="p-4 space-y-4 text-xs">
          {/* Diff Block 1: Cadre Ratio */}
          <div className="border border-[#DFE6E2] rounded overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DFE6E2] bg-[#F5F7F6] border-b border-[#DFE6E2]">
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-gray-500" />
                  <span>Previous Provision (APH 2025-26 Clause 7.1.3)</span>
                </span>
                <span className="text-[10px] bg-gray-200 px-1.5 py-0.2 rounded font-mono text-gray-700">
                  Legally Superseded
                </span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between bg-[#EAF5EF]/50">
                <span className="font-bold text-[#123B32] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Proposed Amendment (APH 2026-27 Amendment Clause 7.1.3)</span>
                </span>
                <span className="text-[10px] bg-[#EAF5EF] border border-[#C1E4D0] text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                  Active Simulation Model
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DFE6E2] p-4 text-xs leading-relaxed">
              <div className="text-gray-700 space-y-2">
                <div className="text-[10px] uppercase font-bold text-gray-500">
                  Subject: Mandatory Cadre Ratio & Faculty Regularity
                </div>
                <p>
                  <span className="bg-[#FCEBEB] text-[#C23B3B] line-through decoration-[#C23B3B] px-1 py-0.5 rounded">
                    Faculty to Student ratio in UG Engineering degree shall be maintained strictly at 1:20 with minimum 80% regular faculty.
                  </span>
                  {' '}Institutions failing to furnish physical biometric records shall be marked deficient at the preliminary scrutiny level itself.
                </p>
                <div className="text-[10px] text-gray-400 font-mono pt-2 border-t border-gray-100">
                  Enforced via Regulation 4(2)/AICTE/Statutory/2025
                </div>
              </div>

              <div className="text-[#101E1A] space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#123B32]">
                  Subject: Tier-Graded Cadre Ratio & Industry Adjunct Ingress
                </div>
                <p>
                  <span className="bg-[#EAF5EF] text-[#123B32] font-semibold border-b-2 border-[#238354] px-1 py-0.5 rounded">
                    Faculty to Student ratio in UG Engineering degree shall be maintained at 1:15 for NBA-accredited Tier-1 programs, and 1:20 for non-accredited courses, permitting up to 20% adjunct professors of practice from industry.
                  </span>
                  {' '}Institutional affidavits must carry verified Industry Experience Credentials verified through Council Industry Registry (CIR).
                </p>
                <div className="text-[10px] text-emerald-800 font-mono pt-2 border-t border-gray-100 flex justify-between">
                  <span>Clause Parser Engine: Syntactic Match (100%)</span>
                  <span>Impact: Cadre, Payroll, NBA Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clause Impact Summary Callout */}
          <div className="bg-[#EBF3FA] border-l-4 border-[#2767A8] p-3 rounded-r text-xs">
            <strong className="text-[#0B2924]">Clause Impact Summary:</strong> Impacts 142 active Extension of Approval applications currently in Scrutiny stage. Transition Rule: Institutions granted 1 academic year glidepath to induct adjunct faculty.
          </div>
        </div>
      </section>

      {/* Application Program Mapping & Active Case Disposition Panel (Matches Stitch Lines 589-722) */}
      <section aria-labelledby="disposition-heading" className="bg-white border border-[#DFE6E2] rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#DFE6E2] pb-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#101E1A] flex items-center gap-2" id="disposition-heading">
              <FileCheck2 className="w-4 h-4 text-[#123B32]" />
              <span>Application Program Mapping & Active Case Disposition</span>
            </h3>
            <p className="text-[11px] text-[#414846]">
              Configure enforcement policies, intake cycle applicability, and transitional grace period parameters across impacted domains.
            </p>
          </div>
          <button
            onClick={() => {
              setDispUG('grandfather');
              setDispMgmt('grandfather');
              setDispPharm('grandfather');
              showToast('info', 'Batch Disposition', 'All academic programs granted 1-year transitional exemption with Annexure IX-B.');
            }}
            className="text-xs bg-[#F5F7F6] hover:bg-gray-200 text-[#123B32] px-3 py-1 rounded border border-[#DFE6E2] font-semibold"
          >
            Apply 1-Year Exemption to All
          </button>
        </div>

        <div className="overflow-x-auto border border-[#DFE6E2] rounded">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5F7F6] text-[#101E1A] text-[10px] uppercase font-bold border-b border-[#DFE6E2]">
                <th className="py-2.5 px-3">Discipline</th>
                <th className="py-2.5 px-3">Sub-Programs</th>
                <th className="py-2.5 px-3 text-right">In-Queue Apps</th>
                <th className="py-2.5 px-3 text-right">Faculty Delta</th>
                <th className="py-2.5 px-4 text-center">Statutory Disposition Directive</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6E2]">
              {/* Row 1: UG Engineering */}
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-semibold text-[#123B32]">UG Engineering & Technology</td>
                <td className="py-2.5 px-3 text-gray-600">B.Tech, B.E. (Tier 1 & Tier 2)</td>
                <td className="py-2.5 px-3 text-right font-bold">142</td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">+1,240 Adjunct Ingress</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="disp-ug"
                        value="apply"
                        checked={dispUG === 'apply'}
                        onChange={() => setDispUG('apply')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Apply Immediately to AY 26-27</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#123B32] font-semibold">
                      <input
                        type="radio"
                        name="disp-ug"
                        value="grandfather"
                        checked={dispUG === 'grandfather'}
                        onChange={() => setDispUG('grandfather')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Exempt In-Flight Cases (1-Year Grace Period)</span>
                    </label>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-[#EAF5EF] text-[#238354] border border-[#C1E4D0] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    Assessed & Cleared
                  </span>
                </td>
              </tr>

              {/* Row 2: Management */}
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-semibold text-[#123B32]">Management Studies</td>
                <td className="py-2.5 px-3 text-gray-600">MBA, PGDM (Executive & Dual)</td>
                <td className="py-2.5 px-3 text-right font-bold">26</td>
                <td className="py-2.5 px-3 text-right text-gray-500 font-medium">Neutral (1:20 Retained)</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#123B32] font-semibold">
                      <input
                        type="radio"
                        name="disp-mgmt"
                        value="apply"
                        checked={dispMgmt === 'apply'}
                        onChange={() => setDispMgmt('apply')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Apply Immediately to AY 26-27</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="disp-mgmt"
                        value="grandfather"
                        checked={dispMgmt === 'grandfather'}
                        onChange={() => setDispMgmt('grandfather')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Exempt In-Flight Cases (1-Year Grace Period)</span>
                    </label>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-[#EBF3FA] text-[#2767A8] border border-[#C2DCF2] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    Policy Aligned
                  </span>
                </td>
              </tr>

              {/* Row 3: Pharmacy */}
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-semibold text-[#123B32]">Pharmacy & Applied Health</td>
                <td className="py-2.5 px-3 text-gray-600">B.Pharm, M.Pharm (PCI Joint)</td>
                <td className="py-2.5 px-3 text-right font-bold">16</td>
                <td className="py-2.5 px-3 text-right text-red-600 font-semibold">+48 Lab Specs Modified</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="disp-pharm"
                        value="apply"
                        checked={dispPharm === 'apply'}
                        onChange={() => setDispPharm('apply')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Apply Immediately to AY 26-27</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#123B32] font-semibold">
                      <input
                        type="radio"
                        name="disp-pharm"
                        value="grandfather"
                        checked={dispPharm === 'grandfather'}
                        onChange={() => setDispPharm('grandfather')}
                        className="text-[#123B32] focus:ring-[#123B32]"
                      />
                      <span>Exempt In-Flight Cases (1-Year Grace Period)</span>
                    </label>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="bg-[#FFF5D6] text-[#B7791F] border border-[#F3DA93] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    PCI Harmonization Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Executive Action Footer (Matches Stitch Lines 726-754) */}
      <footer className="bg-white border border-[#DFE6E2] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-gray-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>Simulation Hash: <code className="font-bold text-gray-800">9d08-a14f-e22c</code></span>
          <span>|</span>
          <span>Generated: 24 Oct 2026, 14:15 IST</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('success', 'Assessment Draft Saved', 'Draft configuration saved to regulatory session.')}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#123B32] border border-[#DFE6E2] rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" /> Save Assessment Draft
          </button>
          <button
            onClick={() => showToast('info', 'Report Generated', 'Exported Official Legal Impact Assessment Report (PDF).')}
            className="px-3 py-1.5 bg-[#F5F7F6] hover:bg-gray-200 text-gray-800 border border-[#DFE6E2] rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" /> Export Impact Report (PDF)
          </button>
          {selectedPolicy?.status !== 'PUBLISHED' ? (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-1.5 bg-[#123B32] hover:bg-[#0B2924] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Submit to Member Secretary for Approval
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Formally Enacted into Law
            </span>
          )}
        </div>
      </footer>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Formally Enact & Publish Regulatory Policy"
        subtitle={`Enact ${selectedPolicy?.version} into Gazette of India Legal Repository`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Gazette Notification Reference *</label>
            <input
              type="text"
              value={gazetteRef}
              onChange={(e) => setGazetteRef(e.target.value)}
              className="w-full p-2 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Transition Handling & Grace Period Policy *</label>
            <textarea
              rows={3}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              className="w-full p-2.5 border border-[#DFE6E2] rounded text-xs focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 leading-relaxed">
            <strong>Statutory Governance Safeguard:</strong> Publication updates the active legal baseline. An official notification will be attached to 184 active dossiers, and follow-up review tasks will be automatically dispatched to assigned scrutiny officers. Historical decisions remain protected from retroactive invalidation.
          </div>

          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-700 font-mono text-[11px]">
            Signing Authority: <strong>{currentUser.name}</strong> ({currentUser.designation})
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={publishing}
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={handleConfirmPublish}
            >
              Confirm Official Publication
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Official Policy / Gazette Draft Modal */}
      <FileUploadModal
        isOpen={isPolicyUploadModalOpen}
        onClose={() => setIsPolicyUploadModalOpen(false)}
        onSuccess={(doc) => {
          showToast('success', 'Policy Draft Registered', `${doc.fileName} recorded as draft amendment. Stored in AICTE vault.`);
        }}
        applicationId="policy-admin"
        institutionId="aicte-hq"
        requirementId="req_policy"
        requirementTitle={selectedPolicy?.title || 'AICTE Approval Process Handbook (APH) Amendment'}
        requirementCode="APH-2026-DRAFT"
        clauseReference="AICTE Act 1987, Section 10 / APH Regulations"
        title="Upload Official Gazette / Regulatory Policy Document"
        documentType="Official Gazette / Regulatory Draft"
        actorName={currentUser.name}
        actorRole={currentUser.role}
      />
    </div>
  );
};
