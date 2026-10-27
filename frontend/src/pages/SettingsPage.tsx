import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Settings,
  Shield,
  Database,
  Clock,
  UserCheck,
  CheckCircle,
  Save,
  Server,
  BellRing,
  FileText,
  History,
  Route,
  Mail,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, availableUsers, switchRole } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sla_rules' | 'users' | 'templates' | 'system'>('sla_rules');

  // SLA state
  const [scrutinySla, setScrutinySla] = useState(10);
  const [clarificationSla, setClarificationSla] = useState(15);
  const [evcSla, setEvcSla] = useState(14);
  const [reportSla, setReportSla] = useState(5);
  const [decisionSla, setDecisionSla] = useState(15);

  // Reminder and Escalation Rules
  const [reminderFirst, setReminderFirst] = useState(30);
  const [reminderSecond, setReminderSecond] = useState(15);
  const [reminderFinal, setReminderFinal] = useState(7);
  const [escalationL1, setEscalationL1] = useState(5);
  const [escalationL2, setEscalationL2] = useState(10);

  // Template state
  const [templates, setTemplates] = useState([
    { id: 't1', code: 'DEFICIENCY_NOTICE', title: 'Scrutiny Deficiency & Clarification Request', target: 'Institution Representative' },
    { id: 't2', code: 'EVC_SCHEDULE_NOTICE', title: 'Expert Visit Committee Campus Inspection Order', target: 'Institution & EVC Team' },
    { id: 't3', code: 'DOC_EXPIRY_WARNING', title: 'Statutory Document / Lease Expiry Warning', target: 'Institution & Regional Officer' },
    { id: 't4', code: 'LOA_SANCTION_ORDER', title: 'Letter of Approval (LoA) Formal Sanction Grant', target: 'Institution & State Directorate' },
  ]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Configuration Saved', 'Statutory SLA rules, reminder intervals, and escalation rules updated.');
  };

  return (
    <div className="space-y-6">
      {/* Supporting Area Masthead */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
              SUPPORTING AREA
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Admin & System Configuration
            </h1>
            <Badge variant="progress">System Administrator</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Used by System Administrators to manage demo personas, role permissions, statutory workflow routes, automated reminder intervals, escalation triggers, and notification templates.
          </p>
        </div>

        <Link to="/audit-trail">
          <Button size="sm" variant="secondary" icon={<History className="w-4 h-4" />}>
            View System Audit Trail
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#DFE6E2] flex items-center gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('sla_rules')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'sla_rules' ? 'border-[#123B32] text-[#123B32]' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Workflow SLAs & Escalation Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'users' ? 'border-[#123B32] text-[#123B32]' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Demo Users & Role Permissions ({availableUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'templates' ? 'border-[#123B32] text-[#123B32]' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notification & Alert Templates ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'system' ? 'border-[#123B32] text-[#123B32]' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System Health & Storage</span>
        </button>
      </div>

      {/* Tab 1: SLAs & Escalation Rules */}
      {activeTab === 'sla_rules' && (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <Card
            title="Statutory Workflow Stage SLAs"
            subtitle="Maximum permitted days per stage before triggering automated alerts."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Scrutiny Evaluation (Days)</label>
                  <input
                    type="number"
                    value={scrutinySla}
                    onChange={(e) => setScrutinySla(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Institution Clarification (Days)</label>
                  <input
                    type="number"
                    value={clarificationSla}
                    onChange={(e) => setClarificationSla(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">EVC Scheduling & Visit (Days)</label>
                  <input
                    type="number"
                    value={evcSla}
                    onChange={(e) => setEvcSla(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">EVC Report Upload (Days)</label>
                  <input
                    type="number"
                    value={reportSla}
                    onChange={(e) => setReportSla(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-gray-700 block mb-1">Competent Authority Decision (Days)</label>
                  <input
                    type="number"
                    value={decisionSla}
                    onChange={(e) => setDecisionSla(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-600">
                Alters default SLA targets aligned with AICTE Approval Process Handbook (APH 2026-27).
              </div>
            </div>
          </Card>

          <Card
            title="Expiry Reminders & Multi-Tier Escalation Thresholds"
            subtitle="Automated notification cadence and administrative escalation triggers."
          >
            <div className="space-y-4">
              <span className="font-bold text-gray-800 block">Document Expiry Reminder Cadence:</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">1st Reminder</label>
                  <input
                    type="number"
                    value={reminderFirst}
                    onChange={(e) => setReminderFirst(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="text-[10px] text-gray-500">Days before</span>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">2nd Reminder</label>
                  <input
                    type="number"
                    value={reminderSecond}
                    onChange={(e) => setReminderSecond(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="text-[10px] text-gray-500">Days before</span>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Final Notice</label>
                  <input
                    type="number"
                    value={reminderFinal}
                    onChange={(e) => setReminderFinal(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="text-[10px] text-gray-500">Days before</span>
                </div>
              </div>

              <span className="font-bold text-gray-800 block pt-2">Administrative SLA Escalation Triggers:</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Level 1 Escalation</label>
                  <input
                    type="number"
                    value={escalationL1}
                    onChange={(e) => setEscalationL1(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="text-[10px] text-gray-500">Days overdue &rarr; Regional Officer</span>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Level 2 Escalation</label>
                  <input
                    type="number"
                    value={escalationL2}
                    onChange={(e) => setEscalationL2(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <span className="text-[10px] text-gray-500">Days overdue &rarr; Bureau Head, HQ</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
                  Save All Configuration
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 2: Users & Roles */}
      {activeTab === 'users' && (
        <Card
          title="Demo Stakeholder Personas & Permissions Matrix"
          subtitle="All 8 statutory stakeholder roles defined in Problem Statement SIH26262."
        >
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                  <th className="py-2.5 px-3">Persona</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3">Primary Dashboard</th>
                  <th className="py-2.5 px-3">Statutory Scope</th>
                  <th className="py-2.5 px-3 text-right">Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableUsers.map((user) => {
                  const isCurrent = user.role === currentUser.role;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#123B32] text-white font-bold flex items-center justify-center text-xs">
                            {user.avatarInitials}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{user.name}</span>
                            <span className="text-[10px] text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="progress">{user.role.replace('_', ' ')}</Badge>
                        <div className="text-[10px] text-gray-500 mt-0.5">{user.designation}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#123B32]">
                        {user.role === 'INSTITUTION'
                          ? 'Dashboard 1: Institution Portal'
                          : user.role === 'PROCESSING_OFFICER'
                          ? 'Dashboard 2: Processing Workspace'
                          : user.role === 'EVC_COMMITTEE_MEMBER' || user.role === 'EVC_MEMBER' || user.role === 'COMMITTEE_MEMBER'
                          ? 'Dashboard 3: Inspection & Committee (EVC + SAC/SHC)'
                          : user.role === 'REGIONAL_OFFICER'
                          ? 'Dashboard 4: Regional Management'
                          : 'Dashboard 5: Central Oversight & Decision Authority'}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{user.organization}</td>
                      <td className="py-3 px-3 text-right">
                        {isCurrent ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              switchRole(user.role);
                              showToast('info', 'Switched Persona', `Active persona: ${user.name}`);
                            }}
                          >
                            Switch
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Notification Templates */}
      {activeTab === 'templates' && (
        <Card
          title="Statutory Notification & Alert Templates"
          subtitle="Standard automated email, SMS, and in-portal alert templates."
        >
          <div className="space-y-3 text-xs">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="p-4 rounded border border-gray-200 bg-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-700">
                      {tmpl.code}
                    </span>
                    <span className="font-bold text-gray-900">{tmpl.title}</span>
                  </div>
                  <div className="text-gray-500 text-[11px] mt-1">Recipient: <strong>{tmpl.target}</strong></div>
                </div>
                <Button size="sm" variant="ghost">Edit Template</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: System Health & Storage */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <Card title="System Services Health" subtitle="Operational microservices and PKI verification status.">
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-950 block">Express API Backend</span>
                  <span className="text-[11px] text-emerald-800">Port 5000 • In-memory seed database active</span>
                </div>
                <Badge variant="success">HEALTHY</Badge>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-emerald-950 block">e-Mudhra DSC PKI Service</span>
                  <span className="text-[11px] text-emerald-800">Digital signature validation module</span>
                </div>
                <Badge variant="success">ONLINE</Badge>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 block">PostgreSQL / Supabase Migration</span>
                  <span className="text-[11px] text-gray-500">supabase/migrations/001_initial_schema.sql</span>
                </div>
                <Badge variant="neutral">READY</Badge>
              </div>
            </div>
          </Card>

          <Card title="Audit Trail & Traceability" subtitle="Tamper-evident system activity logging.">
            <div className="space-y-3">
              <p className="text-gray-700">
                All statutory workflow transitions, document verifications, EVC schedules, committee hearings, and formal decisions are logged deterministically with timestamps and actor credentials.
              </p>
              <Link to="/audit-trail" className="block pt-2">
                <Button variant="primary" icon={<History className="w-4 h-4" />}>
                  Open Full Audit Trail Register
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
