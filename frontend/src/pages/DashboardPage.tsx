import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Application, SystemAlert, EVCInspection } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Building,
  UserCheck,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [inspections, setInspections] = useState<EVCInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, alts, insps] = await Promise.all([
          api.getApplications(),
          api.getAlerts(),
          api.getInspections(),
        ]);
        setApplications(apps);
        setAlerts(alts);
        setInspections(insps);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Approval Operations Overview...
      </div>
    );
  }

  const overdueCount = applications.filter((a) => a.isOverdue).length;
  const inScrutinyCount = applications.filter((a) => a.currentStage === 'SCRUTINY' || a.currentStage === 'CLARIFICATION_REQUIRED').length;
  const evcQueueCount = applications.filter((a) => a.currentStage === 'EVC_REQUIRED' || a.currentStage === 'EVC_SCHEDULED' || a.currentStage === 'REPORT_PENDING').length;
  const decisionPendingCount = applications.filter((a) => a.currentStage === 'DECISION_PENDING').length;
  const approvedCount = applications.filter((a) => a.currentStage === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded border border-[#DFE6E2] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Approval Operations Overview
            </h1>
            <Badge variant="progress" dot>Live Operations</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Real-time multi-regional pendency monitoring, EVC scheduling tracking, institutional compliance and statutory SLA escalations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/processing">
            <Button size="sm" variant="secondary" icon={<Clock className="w-4 h-4" />}>
              Scrutiny Queue
            </Button>
          </Link>
          <Link to="/applications">
            <Button size="sm" variant="primary" icon={<ArrowUpRight className="w-4 h-4" />}>
              All Applications ({applications.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Active</span>
            <FileText className="w-4 h-4 text-[#123B32]" />
          </div>
          <div className="text-2xl font-bold text-[#172B26] mt-2">{applications.length}</div>
          <div className="text-[10px] text-gray-500 mt-1">AY 2026-27 Dossiers</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Scrutiny</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-2">{inScrutinyCount}</div>
          <div className="text-[10px] text-blue-600 mt-1">Digital Evaluation</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">EVC Roster</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">{evcQueueCount}</div>
          <div className="text-[10px] text-amber-600 mt-1">Inspections & Reports</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue SLA</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">{overdueCount}</div>
          <div className="text-[10px] text-red-600 font-medium mt-1">Level 1/2 Escalated</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Decision Due</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800 mt-2">{decisionPendingCount}</div>
          <div className="text-[10px] text-purple-600 mt-1">Executive Committee</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <div className="flex justify-between items-start text-[#61716B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">LoA Issued</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{approvedCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Approved & Closed</div>
        </div>
      </div>

      {/* Main Grid: Priority Action Queue & Upcoming EVC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Priority Action Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <span>Priority Action Queue</span>
                <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                  {alerts.filter((a) => !a.isResolved).length} Pending
                </span>
              </div>
            }
            subtitle="Time-sensitive actions requiring immediate statutory intervention or escalation."
            action={
              <Link to="/alerts" className="text-xs font-semibold text-[#123B32] hover:underline flex items-center">
                View All Alerts <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50/60 border-red-200'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === 'CRITICAL' ? 'error' : alert.severity === 'HIGH' ? 'warning' : 'info'}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs font-bold text-[#172B26]">{alert.title}</span>
                      {alert.isEscalated && (
                        <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                          L{alert.escalationLevel} ESCALATED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#61716B]">{alert.message}</p>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3">
                      <span>Target: <strong className="text-gray-700">{alert.responsibleRole}</strong></span>
                      {alert.deadline && <span>Deadline: <strong className="text-gray-700">{alert.deadline}</strong></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={alert.category === 'EVC' ? '/inspections' : alert.category === 'DOCUMENT_EXPIRY' ? '/compliance' : '/applications'}>
                      <Button size="sm" variant="secondary">
                        Action
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Applications Pendency Table */}
          <Card
            title="Applications Movement & Stage Aging"
            subtitle="Stage duration, responsible officer assignments, and statutory timeline tracking."
            action={
              <Link to="/applications" className="text-xs font-semibold text-[#123B32] hover:underline flex items-center">
                Full Queue <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold">
                    <th className="pb-2.5">Application No.</th>
                    <th className="pb-2.5">Institution</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5">Stage</th>
                    <th className="pb-2.5">Aging</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#123B32]">
                        <Link to={`/applications/${app.id}`} className="hover:underline">
                          {app.applicationNumber}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-gray-900">{app.institutionName}</div>
                        <div className="text-[10px] text-gray-500">{app.district}, {app.state} ({app.region})</div>
                      </td>
                      <td className="py-3 text-gray-600">{app.categoryLabel}</td>
                      <td className="py-3">
                        <Badge variant={app.isOverdue ? 'error' : app.currentStage === 'APPROVED' ? 'success' : 'progress'}>
                          {app.stageLabel}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <span className={`font-semibold ${app.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {app.daysInCurrentStage} days
                        </span>
                        {app.isOverdue && <span className="text-[10px] text-red-500 block">SLA Breached</span>}
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/applications/${app.id}`}>
                          <Button size="sm" variant="ghost">Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): EVC Schedule & Recent Audit */}
        <div className="space-y-6">
          {/* EVC Roster Quick View */}
          <Card
            title="Upcoming EVC Schedule"
            subtitle="Expert Visit Committees assigned for campus inspection."
            action={
              <Link to="/inspections" className="text-xs font-semibold text-[#123B32] hover:underline">
                View Roster
              </Link>
            }
          >
            <div className="space-y-3">
              {inspections.slice(0, 3).map((insp) => (
                <div key={insp.id} className="p-3 rounded border border-gray-200 bg-white hover:border-emerald-600 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-900">{insp.institutionName}</span>
                    <Badge variant={insp.status === 'REPORT_PENDING' ? 'error' : insp.status === 'SCHEDULED' ? 'warning' : 'success'}>
                      {insp.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    Expert: <strong>{insp.leadExpertName || 'To be assigned'}</strong>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                    <span>Region: {insp.region}</span>
                    <span>Date: {insp.scheduledDate || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Compliance & Expiry Notice */}
          <Card
            title="Compliance & Expiry Radar"
            subtitle="CEI deterministic validity tracking."
            action={
              <Link to="/compliance" className="text-xs font-semibold text-[#123B32] hover:underline">
                CEI Register
              </Link>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  NITS Bhopal: Fire NOC
                </div>
                <p className="text-[11px] text-gray-700 mt-1">
                  Expires in 18 days. Scrutiny officer clarification issued.
                </p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  R.K. Pharmacy: Affiliation
                </div>
                <p className="text-[11px] text-gray-700 mt-1">
                  Expired 145 days ago. Non-compliance with Clause 8.3.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
