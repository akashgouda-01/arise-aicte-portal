import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Application, SystemAlert, EVCInspection } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Globe2,
  Users,
  CalendarCheck,
  AlertTriangle,
  Building,
  TrendingUp,
  Clock,
  ShieldAlert,
  Send,
  Filter,
} from 'lucide-react';

interface OfficerWorkload {
  id: string;
  name: string;
  designation: string;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  avgDisposalDays: number;
}

const REGIONAL_OFFICER_WORKLOADS: Record<string, OfficerWorkload[]> = {
  Central: [
    { id: 'off_01', name: 'Dr. Rajesh Sharma', designation: 'Senior Scrutiny Officer', assignedCount: 14, completedCount: 52, overdueCount: 1, avgDisposalDays: 8.4 },
    { id: 'off_02', name: 'Dr. Anita Joshi', designation: 'Scrutiny Officer (Tech)', assignedCount: 18, completedCount: 44, overdueCount: 2, avgDisposalDays: 9.1 },
    { id: 'off_03', name: 'Er. Suresh Verma', designation: 'EVC Coordinator', assignedCount: 8, completedCount: 31, overdueCount: 0, avgDisposalDays: 6.2 },
  ],
  Western: [
    { id: 'off_04', name: 'Dr. Priya Deshmukh', designation: 'Scrutiny Officer', assignedCount: 22, completedCount: 65, overdueCount: 3, avgDisposalDays: 9.8 },
    { id: 'off_05', name: 'Er. Milind Patil', designation: 'Inspection Coordinator', assignedCount: 12, completedCount: 41, overdueCount: 1, avgDisposalDays: 7.5 },
  ],
  Southern: [
    { id: 'off_06', name: 'Dr. K. Swaminathan', designation: 'Scrutiny Officer', assignedCount: 26, completedCount: 78, overdueCount: 4, avgDisposalDays: 10.2 },
    { id: 'off_07', name: 'Dr. V. Lakshmi', designation: 'Compliance Officer', assignedCount: 19, completedCount: 58, overdueCount: 1, avgDisposalDays: 8.9 },
  ],
  Eastern: [
    { id: 'off_08', name: 'Prof. Soumitra Das', designation: 'Senior Scrutiny Officer (ERO)', assignedCount: 16, completedCount: 48, overdueCount: 1, avgDisposalDays: 8.7 },
    { id: 'off_09', name: 'Dr. Debabrata Roy', designation: 'Inspection Coordinator', assignedCount: 10, completedCount: 35, overdueCount: 0, avgDisposalDays: 7.1 },
  ],
  Northern: [
    { id: 'off_10', name: 'Dr. Amit Tripathi', designation: 'Scrutiny Officer (NRO)', assignedCount: 20, completedCount: 55, overdueCount: 2, avgDisposalDays: 9.3 },
    { id: 'off_11', name: 'Er. Ritu Saxena', designation: 'Compliance Officer', assignedCount: 14, completedCount: 42, overdueCount: 1, avgDisposalDays: 8.0 },
  ],
  'North-West': [
    { id: 'off_12', name: 'Dr. Harpreet Singh', designation: 'Lead Scrutiny Officer (NWRO)', assignedCount: 18, completedCount: 50, overdueCount: 2, avgDisposalDays: 9.0 },
    { id: 'off_13', name: 'Dr. Neha Sharma', designation: 'EVC Coordinator', assignedCount: 11, completedCount: 38, overdueCount: 1, avgDisposalDays: 7.8 },
  ],
};

export const RegionalManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedRegion, setSelectedRegion] = useState<string>('Central');
  const [applications, setApplications] = useState<Application[]>([]);
  const [inspections, setInspections] = useState<EVCInspection[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, insps, alts] = await Promise.all([
          api.getApplications(),
          api.getInspections(),
          api.getAlerts({ isResolved: 'false' }),
        ]);
        setApplications(apps);
        setInspections(insps);
        setAlerts(alts);
      } catch (err) {
        console.error('Failed to load regional data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const regionalApps = applications.filter(
    (a) => a.region.toLowerCase() === selectedRegion.toLowerCase() || selectedRegion === 'All'
  );

  const regionalInsps = inspections.filter(
    (i) => i.region.toLowerCase() === selectedRegion.toLowerCase() || selectedRegion === 'All'
  );

  const regionalAlerts = alerts.filter(
    (a) => a.region?.toLowerCase() === selectedRegion.toLowerCase() || !a.region || selectedRegion === 'All'
  );

  const workloads = REGIONAL_OFFICER_WORKLOADS[selectedRegion] || REGIONAL_OFFICER_WORKLOADS['Central'];

  const handleDispatchEscalation = (alertTitle: string) => {
    showToast('info', 'Escalation Dispatched', `Statutory warning notice dispatched for: ${alertTitle}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Regional Management Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard 4 Masthead */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#123B32] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
              DASHBOARD 4
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Regional Management Dashboard
            </h1>
            <Badge variant="progress">Regional Oversight</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Used by Regional Officers to monitor regional pendency, officer workload distribution, EVC rosters, application ageing timelines, and statutory escalations within their authorized jurisdiction.
          </p>
        </div>

        {/* Region Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Select Region:</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="p-1.5 border border-gray-300 rounded text-xs font-bold text-[#123B32] bg-gray-50 focus:ring-1 focus:ring-emerald-600"
          >
            <option value="Central">Central (CRO Bhopal)</option>
            <option value="Western">Western (WRO Mumbai)</option>
            <option value="Southern">Southern (SRO Chennai)</option>
            <option value="Eastern">Eastern (ERO Kolkata)</option>
            <option value="Northern">Northern (NRO Kanpur)</option>
            <option value="North-West">North-West (NWRO Chandigarh)</option>
            <option value="All">All Regions (National View)</option>
          </select>
        </div>
      </div>

      {/* Regional Status KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Regional Intake</span>
          <div className="text-2xl font-bold text-[#172B26] mt-1">{regionalApps.length} Cases</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{selectedRegion} Regional Office</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">In Scrutiny</span>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {regionalApps.filter((a) => a.currentStage === 'SCRUTINY' || a.currentStage === 'CLARIFICATION_REQUIRED').length}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">Assigned to Officers</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">EVC Roster</span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{regionalInsps.length} Visits</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Physical Campus Audits</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">Overdue SLA</span>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {regionalApps.filter((a) => a.isOverdue).length} Cases
          </div>
          <div className="text-[10px] text-red-600 mt-0.5">Requires Intervention</div>
        </div>

        <div className="bg-white p-4 rounded border border-[#DFE6E2] shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Avg Duration</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">14.2 Days</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Vs. 21d Target SLA</div>
        </div>
      </div>

      {/* Grid: Officer Workload Distribution & Regional EVC Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Officer Workload Distribution Matrix */}
        <Card
          title="Regional Officer Workload Distribution"
          subtitle={`Active case allocation and performance across officers in ${selectedRegion} Office.`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-2.5 px-3">Officer Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Disposed</th>
                  <th className="py-2.5 px-3">Overdue</th>
                  <th className="py-2.5 px-3 text-right">Avg SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workloads.map((off) => (
                  <tr key={off.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{off.name}</td>
                    <td className="py-2.5 px-3 text-gray-600">{off.designation}</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{off.assignedCount}</td>
                    <td className="py-2.5 px-3 text-emerald-700">{off.completedCount}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${off.overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {off.overdueCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-700">
                      {off.avgDisposalDays}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Regional EVC Inspection Queue */}
        <Card
          title="Regional EVC Inspection Queue"
          subtitle={`On-site committee visits assigned in ${selectedRegion} jurisdiction.`}
        >
          <div className="space-y-3">
            {regionalInsps.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">No active inspections in this region.</div>
            ) : (
              regionalInsps.map((insp) => (
                <div
                  key={insp.id}
                  className="p-3 rounded border border-gray-200 bg-white hover:border-[#123B32] transition-colors flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="font-bold text-gray-900">{insp.institutionName}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Expert: <strong>{insp.leadExpertName || 'Pending Nomination'}</strong> • Visit:{' '}
                      {insp.scheduledDate || 'Not Scheduled'}
                    </div>
                  </div>
                  <Badge
                    variant={
                      insp.status === 'REPORT_PENDING'
                        ? 'error'
                        : insp.status === 'REVIEW_COMPLETED'
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {insp.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Grid: Regional Stage-wise Ageing & Regional Escalation List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Application Ageing */}
        <Card
          title="Stage-wise Application Ageing & SLA Tracking"
          subtitle="Dossier movement and statutory processing duration in the region."
        >
          <div className="space-y-3">
            {regionalApps.map((app) => (
              <div
                key={app.id}
                className="p-3 rounded border border-gray-200 bg-white flex justify-between items-center text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#123B32]">{app.applicationNumber}</span>
                    <Badge variant={app.isOverdue ? 'error' : 'progress'}>{app.stageLabel}</Badge>
                  </div>
                  <div className="text-gray-900 font-semibold mt-1">{app.institutionName}</div>
                  <div className="text-[10px] text-gray-500">{app.categoryLabel}</div>
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${app.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                    {app.daysInCurrentStage} Days Active
                  </span>
                  {app.isOverdue ? (
                    <span className="text-[10px] text-red-600 font-bold">SLA BREACHED</span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-medium">Within Norms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Regional Compliance Alerts & Escalation List */}
        <Card
          title="Regional Compliance Expiry & Escalation List"
          subtitle="Lease expiries, Fire NOC deficits, and statutory notices for regional intervention."
        >
          <div className="space-y-3">
            {regionalAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3 rounded border flex justify-between items-start gap-3 text-xs ${
                  alt.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Badge variant={alt.severity === 'CRITICAL' ? 'error' : 'warning'}>{alt.severity}</Badge>
                    <span>{alt.title}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{alt.message}</p>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Deadline: <strong>{alt.deadline || 'Immediate'}</strong> • Action: {alt.recommendedAction}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDispatchEscalation(alt.title)}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Dispatch
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
