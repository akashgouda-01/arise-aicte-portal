import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  LayoutDashboard,
  FileText,
  School,
  FileCheck2,
  ClipboardCheck,
  Globe2,
  Building2,
  Scale,
  ShieldCheck,
  FolderKanban,
  AlertTriangle,
  BarChart2,
  History,
  PlusCircle,
  Settings,
  Terminal,
  Activity,
  CheckCircle2,
  LogOut,
  X,
} from 'lucide-react';

interface SideNavBarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    currentUser,
    signOut,
    isInstitution,
    isProcessingOfficer,
    isEVCMember,
    isCommitteeMember,
    isRegionalOfficer,
    isCentralOfficer,
    isDecisionMaker,
    isAdmin,
  } = useAuth();

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Form state for Log New Defect modal
  const [defectApp, setDefectApp] = useState('app_101');
  const [defectClause, setDefectClause] = useState('Clause 7.4 - Faculty Cadre Ratio & Cadre Distribution');
  const [defectSeverity, setDefectSeverity] = useState('MAJOR');
  const [defectDetails, setDefectDetails] = useState('');
  const [defectAction, setDefectAction] = useState('ISSUE_DEFICIENCY_NOTICE');

  const handleLogDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectDetails.trim()) {
      showToast('error', 'Missing Information', 'Please provide details for the statutory defect.');
      return;
    }

    showToast(
      'success',
      'Defect Logged Successfully',
      `Deficiency notice dispatched to institution for ${defectClause.split(' - ')[0]} with 7-day SLA.`
    );
    setIsDefectModalOpen(false);
    setDefectDetails('');
  };

  // Construct role-specific navigation without redundant D1-D5 dashboard identifiers
  const getNavItems = () => {
    // 1. Central Oversight / Competent Decision Authority Navigation
    if (isCentralOfficer || isDecisionMaker) {
      return [
        {
          to: '/central-oversight',
          label: 'Central Oversight & Decisions',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/applications',
          label: 'Applications & Pendency',
          icon: <FileText className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/alerts',
          label: 'Compliance & Escalations',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: '1',
          badgeClass: 'bg-red-100 text-red-700',
          visible: true,
        },
        {
          to: '/regional-oversight',
          label: 'Reports & Analytics',
          icon: <BarChart2 className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/audit-trail',
          label: 'Audit Trail',
          icon: <History className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/regulatory-changes',
          label: 'Policy & Rules Administration',
          icon: <Scale className="w-4 h-4" />,
          visible: isDecisionMaker || isAdmin,
        },
      ];
    }

    // 2. Institution Representative Navigation
    if (isInstitution) {
      return [
        {
          to: '/institution',
          label: 'My Institution',
          icon: <School className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/applications',
          label: 'Applications',
          icon: <FileText className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/compliance',
          label: 'Compliance & Evidence',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/alerts',
          label: 'Alerts & Notices',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: '1',
          badgeClass: 'bg-red-100 text-red-700',
          visible: true,
        },
      ];
    }

    // 3. Scrutiny / Processing Officer Navigation
    if (isProcessingOfficer) {
      return [
        {
          to: '/dashboard',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/processing',
          label: 'Processing Workspace',
          icon: <FileCheck2 className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/applications',
          label: 'Applications',
          icon: <FileText className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/compliance',
          label: 'Evidence Review Queue',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/alerts',
          label: 'Alerts & Escalations',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: '1',
          badgeClass: 'bg-red-100 text-red-700',
          visible: true,
        },
        {
          to: '/audit-trail',
          label: 'Audit Trail',
          icon: <History className="w-4 h-4" />,
          visible: true,
        },
      ];
    }

    // 4. EVC & Committee Member Navigation
    if (isEVCMember || isCommitteeMember) {
      return [
        {
          to: '/dashboard',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/inspections',
          label: 'EVC & Committee Workspace',
          icon: <ClipboardCheck className="w-4 h-4" />,
          badge: '5',
          badgeClass: 'bg-[#123B32] text-white',
          visible: true,
        },
        {
          to: '/applications',
          label: 'Applications',
          icon: <FileText className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/alerts',
          label: 'Alerts & Escalations',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: '1',
          badgeClass: 'bg-red-100 text-red-700',
          visible: true,
        },
        {
          to: '/audit-trail',
          label: 'Audit Trail',
          icon: <History className="w-4 h-4" />,
          visible: true,
        },
      ];
    }

    // 5. Regional Officer Navigation
    if (isRegionalOfficer) {
      return [
        {
          to: '/dashboard',
          label: 'Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/regional-management',
          label: 'Regional Management',
          icon: <Globe2 className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/applications',
          label: 'Applications',
          icon: <FileText className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/compliance',
          label: 'Evidence Review Queue',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/regional-oversight',
          label: 'Regional Performance',
          icon: <BarChart2 className="w-4 h-4" />,
          visible: true,
        },
        {
          to: '/alerts',
          label: 'Alerts & Escalations',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: '1',
          badgeClass: 'bg-red-100 text-red-700',
          visible: true,
        },
        {
          to: '/audit-trail',
          label: 'Audit Trail',
          icon: <History className="w-4 h-4" />,
          visible: true,
        },
      ];
    }

    // 6. System Administrator Default
    return [
      {
        to: '/central-oversight',
        label: 'Central Oversight & Decisions',
        icon: <LayoutDashboard className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/applications',
        label: 'Applications Directory',
        icon: <FileText className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/processing',
        label: 'Processing Workspace',
        icon: <FileCheck2 className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/inspections',
        label: 'Inspection Workspace',
        icon: <ClipboardCheck className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/regional-management',
        label: 'Regional Management',
        icon: <Globe2 className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/regulatory-changes',
        label: 'Policy & Rules Administration',
        icon: <Scale className="w-4 h-4" />,
        visible: true,
      },
      {
        to: '/audit-trail',
        label: 'Audit Trail',
        icon: <History className="w-4 h-4" />,
        visible: true,
      },
    ];
  };

  const navItems = getNavItems();

  const renderNavContent = (onItemClick?: () => void) => (
    <div className="flex flex-col justify-between h-full overflow-y-auto select-none">
      <div className="py-3 px-2 flex flex-col gap-1">
        {/* Council / Statutory Authority Branding */}
        <div className="px-3 pb-3 pt-1 border-b border-gray-200 mb-2">
          <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            {isInstitution ? 'Institution Portal' : 'Statutory Authority'}
          </div>
          <div className="text-sm font-bold text-[#123B32] truncate">
            {isInstitution
              ? (currentUser.organization || 'Chennai Institute of Technology & Engineering (CITE Chennai)')
              : 'AICTE Regulatory Portal'}
          </div>
          <div className="text-[11px] text-gray-500 truncate">
            {isInstitution
              ? `${currentUser.region || 'Southern'} Region (${currentUser.region === 'Southern' ? 'SRO Chennai' : 'RO'})`
              : 'Ministry of Education, Government of India'}
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="space-y-1">
          {navItems
            .filter((item) => item.visible)
            .map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs rounded-r-lg transition-all font-medium ${
                    isActive
                      ? 'bg-[#E1F3EB] text-[#123B32] font-bold border-l-4 border-[#123B32]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-[#123B32]' : 'text-gray-500'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${item.badgeClass || 'bg-[#123B32] text-white'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </nav>

        {/* Action CTA Button: [ + Log New Defect ] */}
        <div className="mt-4 px-2">
          <button
            onClick={() => {
              setIsDefectModalOpen(true);
              onItemClick?.();
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#0B2924] hover:bg-[#123B32] text-white text-xs font-semibold py-2 px-3 rounded shadow-sm transition-all border border-[#0B2924]"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Log New Defect</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation & System Diagnostics */}
      <div className="border-t border-gray-200 pt-2 px-2 space-y-1 bg-[#F9FBFA] -mx-0 mt-auto pb-3">
        <NavLink
          to="/settings"
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-1.5 text-xs rounded transition-all ${
              isActive
                ? 'bg-[#E1F3EB] text-[#123B32] font-bold border-l-4 border-[#123B32]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`
          }
        >
          <Settings className="w-4 h-4 text-gray-500" />
          <span>Statutory Settings</span>
        </NavLink>
        <button
          onClick={() => {
            setIsDiagnosticsOpen(true);
            onItemClick?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all text-left"
        >
          <Terminal className="w-4 h-4 text-gray-500" />
          <span>System Diagnostics</span>
        </button>
        <button
          onClick={() => {
            onItemClick?.();
            signOut();
            navigate('/');
          }}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded transition-all text-left font-medium"
          title="Sign out to home page"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Sign Out</span>
        </button>
        <div className="px-3 pt-2 text-[10px] text-gray-400 font-mono">
          AICTE Engine v4.8.2.1 • build_rel26
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        aria-label="Portal Navigation"
        className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col justify-between hidden md:flex h-full overflow-y-auto select-none"
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Navigation (Sheet Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-out Menu */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full z-10 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-[#123B32] text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#E5A900]" />
                <span className="font-bold text-xs">AICTE Portal Navigation</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavContent(onCloseMobile)}
          </aside>
        </div>
      )}

      {/* 1. Modal: Log New Defect / Deficiency */}
      <Modal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        title="Log Statutory Defect & Record Deficiency Notice"
        subtitle="Record on-site inspection or scrutiny deficit for formal institutional clarification"
        maxWidth="lg"
      >
        <form onSubmit={handleLogDefect} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Target Application
              </label>
              <select
                value={defectApp}
                onChange={(e) => setDefectApp(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#123B32]"
              >
                <option value="app_101">AICTE/2026/CR/1-92837101 — NITS Bhopal (Central)</option>
                <option value="app_102">AICTE/2026/NEW/1-84729102 — Surya College of Engg (West)</option>
                <option value="app_103">AICTE/2026/EOA/1-99881122 — Apex Institute of Tech (North)</option>
                <option value="app_104">AICTE/2026/NEW/1-77332211 — Pragati Inst of Technology (Central)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Defect Severity
              </label>
              <select
                value={defectSeverity}
                onChange={(e) => setDefectSeverity(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#123B32]"
              >
                <option value="CRITICAL">CRITICAL — Statutory Violation (Immediate Bar)</option>
                <option value="MAJOR">MAJOR — Regulatory Deficit (Mandatory Rectification)</option>
                <option value="MINOR">MINOR — Observation / Administrative Clarification</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Applicable Regulatory Clause
            </label>
            <select
              value={defectClause}
              onChange={(e) => setDefectClause(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#123B32]"
            >
              <option value="Clause 7.4 - Faculty Cadre Ratio & Cadre Distribution">
                Clause 7.4 — Faculty Cadre Ratio 1:20 & Cadre Norms (Prof : Assoc : Asst)
              </option>
              <option value="Clause 4.2 - Occupancy & Building Fire Safety Certificate">
                Clause 4.2 — Building Safety & Fire Department NOC (Validity Deficit)
              </option>
              <option value="Clause 2.1 - Land Ownership / Registered Long-Term Lease">
                Clause 2.1 — Land Area, Title Deeds & Minimum 30-Year Lease Registration
              </option>
              <option value="Clause 5.1 - AICTE Endowment Fund & Fixed Deposit Receipt">
                Clause 5.1 — Financial Security & Joint Endowment Deposit Norms
              </option>
              <option value="Clause 9.1 - Sustainable Campus & Rooftop Solar Mandatory Norms">
                Clause 9.1 — Green Campus, Solar & Effluent Treatment Undertaking
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Specific Defect Details & Committee Observations
            </label>
            <textarea
              rows={3}
              value={defectDetails}
              onChange={(e) => setDefectDetails(e.target.value)}
              placeholder="State the factual non-compliance observed (e.g. Form 16 / TDS mismatch in Assistant Professor cadre; Fire Safety NOC expired without renewal acknowledgement)..."
              className="w-full text-xs border border-gray-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-[#123B32]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Statutory Action to Dispatch
            </label>
            <select
              value={defectAction}
              onChange={(e) => setDefectAction(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#123B32]"
            >
              <option value="ISSUE_DEFICIENCY_NOTICE">Issue Deficiency Notice to Institution (7-Day SLA)</option>
              <option value="DISPATCH_TASK_OFFICER">Dispatch Investigation Task to Scrutiny Officer</option>
              <option value="SCHEDULE_SPECIAL_EVC">Mandate Special Physical EVC Re-Inspection</option>
            </select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Statutory Record Impact:</strong> Logging this defect creates an immutable entry in the National Digital Audit Trail and dispatches a deficiency notice to the applicant institution.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDefectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-[#123B32] hover:bg-[#0B2924] text-white"
            >
              Record Defect & Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: System Diagnostics */}
      <Modal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        title="AICTE Regulatory Platform — System Diagnostics"
        subtitle="Real-time operational health of statutory rule engines and cryptographic services"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-[#E1F3EB] rounded border border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-[#123B32]">All Core Regulatory Services Operational</span>
            </div>
            <span className="text-[10px] bg-[#123B32] text-white px-2 py-0.5 rounded font-mono">100% HEALTHY</span>
          </div>

          <div className="border border-gray-200 rounded divide-y divide-gray-200">
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">Statutory Rule Engine:</span>
              <span className="font-mono font-bold text-gray-900">v4.8.2.1 • build_rel26</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">Active Academic Session:</span>
              <span className="font-bold text-[#123B32]">AY 2026-27 (APH v2.4 Active)</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">Cluster Node:</span>
              <span className="font-mono text-gray-900">CENTRAL-SANDBOX-MP-04 (CRO Bhopal)</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">DSC Service:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                e-Mudhra PKI Class 3 Online
              </span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">API Gateway Latency:</span>
              <span className="font-mono font-bold text-gray-900">14ms (Optimal)</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">Database Engine:</span>
              <span className="text-gray-900 font-medium">PostgreSQL / In-Memory State Sync</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-gray-600">Active Tasks in Queue:</span>
              <span className="font-bold text-[#123B32]">4 Dispatched</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDiagnosticsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
