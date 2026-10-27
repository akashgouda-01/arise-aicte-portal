import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Application, SystemAlert } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Globe2,
  TrendingUp,
  AlertTriangle,
  Building,
  Users,
  Send,
  CheckCircle,
  FileBarChart,
} from 'lucide-react';

interface RegionalStat {
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

const REGIONAL_STATS: RegionalStat[] = [
  { region: 'Central', office: 'CRO Bhopal', total: 1840, inScrutiny: 240, inEVC: 95, decisionPending: 42, overdue: 8, avgDays: 14.2, complianceRate: 94.2 },
  { region: 'Western', office: 'WRO Mumbai', total: 2450, inScrutiny: 310, inEVC: 140, decisionPending: 68, overdue: 14, avgDays: 16.8, complianceRate: 91.5 },
  { region: 'Southern', office: 'SRO Chennai', total: 3120, inScrutiny: 420, inEVC: 180, decisionPending: 85, overdue: 19, avgDays: 18.1, complianceRate: 89.8 },
  { region: 'North-West', office: 'NWRO Chandigarh', total: 1280, inScrutiny: 160, inEVC: 72, decisionPending: 28, overdue: 6, avgDays: 12.9, complianceRate: 95.8 },
  { region: 'Northern', office: 'NRO Kanpur', total: 1950, inScrutiny: 280, inEVC: 110, decisionPending: 54, overdue: 12, avgDays: 15.4, complianceRate: 92.1 },
  { region: 'Eastern', office: 'ERO Kolkata', total: 980, inScrutiny: 120, inEVC: 48, decisionPending: 20, overdue: 4, avgDays: 13.5, complianceRate: 96.0 },
];

export const RegionalOversightPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const alts = await api.getAlerts({ isResolved: 'false' });
        setAlerts(alts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Regional & Central Oversight Monitoring Dashboard
            </h1>
            <Badge variant="progress">National View</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Consolidated cross-regional performance benchmarks, stage pendency ageing heatmaps, non-compliance distributions, and central escalation dispatch.
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Authorised Bureau: <strong className="text-gray-900">Regulation & Approval Bureau, New Delhi</strong>
        </div>
      </div>

      {/* Section A: Regional Comparative Performance Matrix */}
      <Card
        title="Section A: Regional Comparative Performance Matrix"
        subtitle="Operational metrics across all AICTE Regional Offices (AY 2026-27 Processing Cycle)."
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
              {REGIONAL_STATS.map((stat) => (
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

      {/* Grid: Heatmap & Non-Compliance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage-wise Pendency & Ageing Heatmap */}
        <Card
          title="Stage-wise Pendency & Ageing Heatmap"
          subtitle="Distribution of application durations against prescribed APH SLA targets."
        >
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-gray-800 mb-1.5">
                <span>Digital Scrutiny Stage (10-Day SLA)</span>
                <span className="text-gray-500">1,530 Total Cases</span>
              </div>
              <div className="h-4 rounded bg-gray-100 flex overflow-hidden">
                <div className="bg-emerald-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '68%' }}>
                  &lt;7d (68%)
                </div>
                <div className="bg-amber-500 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '22%' }}>
                  8-10d
                </div>
                <div className="bg-red-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '10%' }}>
                  &gt;10d
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-800 mb-1.5">
                <span>EVC Inspection & Report Upload (14-Day SLA)</span>
                <span className="text-gray-500">645 Total Cases</span>
              </div>
              <div className="h-4 rounded bg-gray-100 flex overflow-hidden">
                <div className="bg-emerald-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '55%' }}>
                  &lt;10d (55%)
                </div>
                <div className="bg-amber-500 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '30%' }}>
                  11-14d
                </div>
                <div className="bg-red-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '15%' }}>
                  &gt;14d
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-gray-800 mb-1.5">
                <span>Competent Authority Decision (15-Day SLA)</span>
                <span className="text-gray-500">289 Total Cases</span>
              </div>
              <div className="h-4 rounded bg-gray-100 flex overflow-hidden">
                <div className="bg-emerald-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '74%' }}>
                  &lt;10d (74%)
                </div>
                <div className="bg-amber-500 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '18%' }}>
                  11-15d
                </div>
                <div className="bg-red-600 text-[10px] text-white flex items-center justify-center font-bold" style={{ width: '8%' }}>
                  &gt;15d
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Statutory Non-Compliance Categories */}
        <Card
          title="Top Statutory Non-Compliance Categories"
          subtitle="Leading causes for clarification notices and deficiency hearings nationwide."
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded flex justify-between items-center">
              <div>
                <span className="font-bold text-red-900 block">Fire Safety NOC Expiry / Non-Renewal</span>
                <span className="text-[11px] text-gray-600">Clause 4.2: Expiring within 30 days without municipal renewal receipt</span>
              </div>
              <span className="text-lg font-bold text-red-700">38%</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-900 block">Faculty Cadre Ratio 1:2:6 Shortfall</span>
                <span className="text-[11px] text-gray-600">Clause 7.4: Associate Professor cadre deficit in emerging courses</span>
              </div>
              <span className="text-lg font-bold text-amber-700">29%</span>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
              <div>
                <span className="font-bold text-blue-900 block">Land Lease Tenure Discrepancy</span>
                <span className="text-[11px] text-gray-600">Clause 2.1: Less than 30-year registered lease or missing stamp duty</span>
              </div>
              <span className="text-lg font-bold text-blue-700">18%</span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-900 block">University Affiliation Order Lapsed</span>
                <span className="text-[11px] text-gray-600">Clause 8.3: Pre-requisite state university order missing</span>
              </div>
              <span className="text-lg font-bold text-gray-700">15%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Section C: Central Escalation Dispatch Queue */}
      <Card
        title="Section C: Central Escalation Dispatch Queue"
        subtitle="Unresolved statutory delays escalated to Bureau Head and Regional Directors for intervention."
      >
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-3.5 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                alt.isEscalated ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={alt.severity === 'CRITICAL' ? 'error' : 'warning'}>
                    {alt.severity}
                  </Badge>
                  <span className="font-bold text-gray-900">{alt.title}</span>
                  {alt.isEscalated && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                      LEVEL {alt.escalationLevel} DISPATCHED
                    </span>
                  )}
                </div>
                <p className="text-gray-700">{alt.message}</p>
                <div className="text-[11px] text-gray-500">
                  Targeted Authority: <strong className="text-gray-800">{alt.responsibleRole}</strong> • Recommended Action: {alt.recommendedAction}
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Dispatch Notice
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
