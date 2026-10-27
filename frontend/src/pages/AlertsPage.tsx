import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SystemAlert } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Resolve modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await api.getAlerts({
          severity: severityFilter,
          category: categoryFilter,
        });
        setAlerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [severityFilter, categoryFilter]);

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    try {
      const updated = await api.resolveAlert(selectedAlert.id, {
        resolvedBy: currentUser.name,
        actorRole: currentUser.role,
        notes: resolveNotes || 'Condition addressed under authorized supervision.',
      });

      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('success', 'Alert Resolved', `Alert '${updated.title}' closed.`);
      setIsResolveModalOpen(false);
      setResolveNotes('');
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      const updated = await api.escalateAlert(alertId, {
        escalatedBy: currentUser.name,
        actorRole: currentUser.role,
        reason: 'Statutory deadline expired without required institutional or committee response.',
      });

      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('warning', 'Escalated', `Alert escalated to Level ${updated.escalationLevel}`);
    } catch (err: any) {
      showToast('error', 'Escalation Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Alerts & Escalations...
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
              Alerts & Statutory Escalations Queue
            </h1>
            <Badge variant="error">{alerts.filter((a) => !a.isResolved).length} Active</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Automated notifications for approaching deadlines, overdue inspections, document expiries, and multi-tier administrative escalations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical (Immediate Escalation)</option>
              <option value="HIGH">High (Due Soon / Impending SLA)</option>
              <option value="MEDIUM">Medium (Procedural Notice)</option>
              <option value="INFO">Informational</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Alert Categories</option>
              <option value="DEADLINE">Stage Movement Deadlines</option>
              <option value="EVC">EVC & Inspection Delays</option>
              <option value="DOCUMENT_EXPIRY">Document & Lease Expiry</option>
              <option value="POLICY">Regulatory Updates</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alt) => (
          <Card key={alt.id} bodyClassName="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={alt.severity === 'CRITICAL' ? 'error' : alt.severity === 'HIGH' ? 'warning' : 'info'}>
                    {alt.severity}
                  </Badge>
                  <span className="font-bold text-sm text-gray-900">{alt.title}</span>
                  {alt.isEscalated && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">
                      LEVEL {alt.escalationLevel} ESCALATED
                    </span>
                  )}
                  {alt.isResolved && <Badge variant="success">RESOLVED</Badge>}
                </div>

                <p className="text-gray-700">{alt.message}</p>

                <div className="text-[11px] text-gray-500 flex flex-wrap gap-4 pt-1">
                  <span>Category: <strong>{alt.category}</strong></span>
                  <span>Responsible Role: <strong>{alt.responsibleRole}</strong></span>
                  {alt.institutionName && <span>Institution: <strong>{alt.institutionName}</strong></span>}
                  {alt.deadline && <span>Statutory Deadline: <strong>{alt.deadline}</strong></span>}
                  <span>Detected: {alt.createdAt}</span>
                </div>

                <div className="mt-2 text-[11px] p-2 bg-emerald-50/60 border border-emerald-200 rounded text-emerald-900">
                  <strong>Recommended Next Action:</strong> {alt.recommendedAction}
                </div>
              </div>

              {/* Action Buttons */}
              {!alt.isResolved && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEscalateAlert(alt.id)}
                  >
                    Escalate
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => {
                      setSelectedAlert(alt);
                      setIsResolveModalOpen(true);
                    }}
                  >
                    Resolve Alert
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Resolve Alert Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Statutory Alert"
        subtitle={`Alert: ${selectedAlert?.title}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Resolution Remarks & Action Confirmation *
            </label>
            <textarea
              rows={3}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Record why this alert is cleared (e.g. renewal proof verified, report uploaded, hearing completed)..."
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResolveAlert}>
              Confirm Resolution
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
