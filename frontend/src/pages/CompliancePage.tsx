import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CEIFinding } from '../services/ceiEngine';
import { ComplianceRequirement, EvidenceDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  HelpCircle,
  UserCheck,
  Building,
  Sparkles,
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const { currentUser, isProcessingOfficer, isCentralOfficer, isRegionalOfficer, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [findings, setFindings] = useState<CEIFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<CEIFinding | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail drawer / modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    async function loadCEI() {
      try {
        const data = await api.getCEIFindings();
        setFindings(data);
      } catch (err) {
        console.error('Failed to load CEI findings', err);
      } finally {
        setLoading(false);
      }
    }
    loadCEI();
  }, []);

  const handleVerify = async (docId: string, outcome: 'APPROVED' | 'REJECTED') => {
    try {
      await api.verifyEvidence(docId, {
        verifiedBy: currentUser.name,
        actorRole: currentUser.role,
        outcome,
        verificationNotes: outcome === 'APPROVED' ? 'Verified compliant with statutory norms.' : 'Deficiency noted during CEI verification.',
      });

      // Reload findings
      const refreshed = await api.getCEIFindings();
      setFindings(refreshed);
      showToast('success', 'Status Updated', `Compliance state recorded as ${outcome === 'APPROVED' ? 'VERIFIED' : 'NEEDS_REVIEW'}`);
      setIsDetailModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Compliance Evidence Intelligence (CEI)...
      </div>
    );
  }

  const missingCount = findings.filter((f) => f.status === 'MISSING').length;
  const expiredCount = findings.filter((f) => f.status === 'EXPIRED').length;
  const expiringCount = findings.filter((f) => f.status === 'EXPIRING').length;
  const verifiedCount = findings.filter((f) => f.status === 'VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Compliance Evidence Intelligence (CEI)
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> SIH Novelty Engine
            </span>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Requirement-centred deterministic evidence verification: connects each regulatory clause to linked proof, explains detected issues, and preserves human verification oversight.
          </p>
        </div>
      </div>

      {/* 4 CEI Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded border border-red-200 shadow-sm bg-red-50/30">
          <div className="text-[11px] font-bold text-red-900 uppercase">Missing Evidence</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{missingCount}</div>
          <div className="text-[10px] text-red-600 mt-0.5">Mandatory clauses unfulfilled</div>
        </div>

        <div className="bg-white p-4 rounded border border-red-200 shadow-sm bg-red-50/30">
          <div className="text-[11px] font-bold text-red-900 uppercase">Expired Documents</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{expiredCount}</div>
          <div className="text-[10px] text-red-600 mt-0.5">Past statutory validity</div>
        </div>

        <div className="bg-white p-4 rounded border border-amber-200 shadow-sm bg-amber-50/30">
          <div className="text-[11px] font-bold text-amber-900 uppercase">Expiring (Within 30d)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{expiringCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Advance renewal required</div>
        </div>

        <div className="bg-white p-4 rounded border border-emerald-200 shadow-sm bg-emerald-50/30">
          <div className="text-[11px] font-bold text-emerald-900 uppercase">Verified Compliance</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Statutory norms fulfilled</div>
        </div>
      </div>

      {/* Main Requirement-Centred Findings Register */}
      <Card
        title="CEI Requirement & Evidence Evaluation Register"
        subtitle="Click any finding to inspect the explainable reasoning, regulatory clause citations, and verification controls."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFE6E2] text-gray-500 font-semibold bg-gray-50/50">
                <th className="py-2.5 px-3">Requirement Code</th>
                <th className="py-2.5 px-3">Clause & Description</th>
                <th className="py-2.5 px-3">Evidence Linked</th>
                <th className="py-2.5 px-3">Compliance Status</th>
                <th className="py-2.5 px-3">Action Responsibility</th>
                <th className="py-2.5 px-3 text-right">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {findings.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#123B32]">
                    {item.requirementCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{item.requirementTitle}</div>
                    <div className="text-[10px] text-gray-500">{item.explanation.requirementReference}</div>
                  </td>
                  <td className="py-3 px-3">
                    {item.evidenceName ? (
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {item.evidenceName}
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium italic">No evidence linked</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        item.status === 'VERIFIED'
                          ? 'success'
                          : item.status === 'EXPIRING'
                          ? 'warning'
                          : item.status === 'EXPIRED' || item.status === 'MISSING'
                          ? 'error'
                          : 'progress'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-700">
                    {item.explanation.whoMustActNext}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedFinding(item);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      Explain Issue
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explainable Finding Modal / Drawer */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>CEI Explainable Assessment: {selectedFinding?.requirementCode}</span>
            <Badge
              variant={
                selectedFinding?.status === 'VERIFIED'
                  ? 'success'
                  : selectedFinding?.status === 'EXPIRING'
                  ? 'warning'
                  : 'error'
              }
            >
              {selectedFinding?.status}
            </Badge>
          </div>
        }
        subtitle={selectedFinding?.requirementTitle}
        maxWidth="lg"
      >
        {selectedFinding && (
          <div className="space-y-4 text-xs">
            {/* 1. What was detected */}
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-950">
              <span className="font-bold block text-red-900 mb-1">1. What Was Detected:</span>
              <p>{selectedFinding.explanation.whatWasDetected}</p>
            </div>

            {/* 2. Requirement Reference */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-800">
              <span className="font-bold block text-gray-900 mb-1">2. Relevant Statutory Clause:</span>
              <p>{selectedFinding.explanation.requirementReference}</p>
            </div>

            {/* 3. Evidence Checked */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-800">
              <span className="font-bold block text-gray-900 mb-1">3. Evidence Document Checked:</span>
              <p>{selectedFinding.explanation.evidenceChecked}</p>
            </div>

            {/* 4. Why attention is required */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-950">
              <span className="font-bold block text-amber-900 mb-1">4. Why Attention Is Required:</span>
              <p>{selectedFinding.explanation.whyAttentionRequired}</p>
            </div>

            {/* 5. Who acts next & Recommended action */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-950">
              <span className="font-bold block text-emerald-900 mb-1">
                5. Action Next: {selectedFinding.explanation.whoMustActNext}
              </span>
              <p>{selectedFinding.explanation.recommendedAction}</p>
            </div>

            {/* Officer Action Controls (Human Verification) */}
            <div className="pt-2 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2">
              <Link
                to="/applications/app_101"
                className="text-xs text-[#123B32] font-bold hover:underline flex items-center gap-1"
              >
                Open in Full Application Dossier &rarr;
              </Link>
              {selectedFinding.evidenceId && (isProcessingOfficer || isRegionalOfficer || isAdmin) && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleVerify(selectedFinding.evidenceId!, 'REJECTED')}
                  >
                    Flag as Deficient
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => handleVerify(selectedFinding.evidenceId!, 'APPROVED')}
                  >
                    Mark Verified Compliant
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
