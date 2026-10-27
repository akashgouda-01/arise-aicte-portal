import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AuditEvent } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Search, History, ShieldCheck, Filter } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [entityType, setEntityType] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      try {
        const data = await api.getAuditEvents({
          entityType,
          actorRole,
          search,
        });
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [entityType, actorRole, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading National Audit Trail...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              National Digital Audit Trail
            </h1>
            <Badge variant="progress">Tamper-Evident Ledger</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Immutable, cryptographically verifiable log of all statutory decisions, workflow state transitions, document uploads, and policy publications.
          </p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Logged Transactions: <strong className="text-emerald-800">{events.length}</strong>
        </div>
      </div>

      {/* Filters */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Actor, Entity, Details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Entity Types</option>
              <option value="APPLICATION">Applications</option>
              <option value="EVIDENCE">Evidence & Documents</option>
              <option value="INSPECTION">EVC Inspections</option>
              <option value="POLICY">Regulatory Policies</option>
              <option value="ALERT">System Alerts & Escalations</option>
            </select>
          </div>

          <div>
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Actor Roles</option>
              <option value="INSTITUTION">Institution Representative</option>
              <option value="PROCESSING_OFFICER">Scrutiny Officer</option>
              <option value="EVC_MEMBER">EVC Member</option>
              <option value="COMMITTEE_MEMBER">Committee Member</option>
              <option value="DECISION_MAKER">Decision-Making Authority</option>
              <option value="CENTRAL_OFFICER">Central Administrative Officer</option>
              <option value="SYSTEM_ADMIN">System Administrator</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-2.5 px-3">Timestamp (IST)</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action Recorded</th>
                <th className="py-2.5 px-3">Entity Affected</th>
                <th className="py-2.5 px-3">Audit Details & Value Diff</th>
                <th className="py-2.5 px-3 text-right">Gateway / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                    {event.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{event.actorName}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold">
                      {event.actorRole.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="progress">{event.action}</Badge>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-800">{event.entityName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{event.entityType} ({event.entityId})</div>
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <p className="text-gray-700">{event.details}</p>
                    {event.previousValue && event.newValue && (
                      <div className="text-[10px] font-mono mt-1 text-gray-500">
                        Diff: <span className="text-red-600 line-through">{event.previousValue}</span> →{' '}
                        <span className="text-emerald-700 font-bold">{event.newValue}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {event.ipAddress || '10.24.8.112'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
