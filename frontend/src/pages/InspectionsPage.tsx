import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EVCInspection } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  FileText,
  Upload,
  Calendar,
  Scale,
  ClipboardList,
  Camera,
  MapPin,
  Eye,
  Compass,
  Download,
  Printer,
} from 'lucide-react';
import { LiveEVCInspectionModal } from '../components/inspection/LiveEVCInspectionModal';
import { downloadOrPrintEVCReport } from '../utils/evcReportGenerator';

export const InspectionsPage: React.FC = () => {
  const { currentUser, isEVCMember, isCommitteeMember, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [inspections, setInspections] = useState<EVCInspection[]>([]);
  const [selectedInsp, setSelectedInsp] = useState<EVCInspection | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab state: default to EVC or Committee depending on active persona
  const [activeTab, setActiveTab] = useState<'evc_roster' | 'committee_hearing'>(
    isCommitteeMember ? 'committee_hearing' : 'evc_roster'
  );

  // Schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [leadExpertName, setLeadExpertName] = useState('');
  const [leadOrg, setLeadOrg] = useState('');

  // Complete visit modal (with on-site checklist)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitOutcome, setVisitOutcome] = useState<'SATISFACTORY' | 'DEFICIENCIES_FOUND' | 'SERIOUS_IRREGULARITIES'>('SATISFACTORY');
  const [checkBuiltUpArea, setCheckBuiltUpArea] = useState(true);
  const [checkLaboratories, setCheckLaboratories] = useState(true);
  const [checkFireSafety, setCheckFireSafety] = useState(true);
  const [checkFacultyRoster, setCheckFacultyRoster] = useState(true);

  // Report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Committee review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<'RECOMMEND_APPROVAL' | 'RECOMMEND_DEFICIENCY_HEARING' | 'RECOMMEND_REJECTION'>('RECOMMEND_APPROVAL');
  const [committeeRemarks, setCommitteeRemarks] = useState('');

  // Live EVC On-Site Inspection & Geo Evidence Modal
  const [isLiveEvidenceModalOpen, setIsLiveEvidenceModalOpen] = useState(false);
  const [previewWatermarkUrl, setPreviewWatermarkUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadInspections() {
      try {
        const data = await api.getInspections();
        setInspections(data);
      } catch (err) {
        console.error('Failed to load inspections', err);
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);

  // Update tab when role changes
  useEffect(() => {
    if (isCommitteeMember) {
      setActiveTab('committee_hearing');
    } else if (isEVCMember) {
      setActiveTab('evc_roster');
    }
  }, [currentUser.role]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsp) return;

    try {
      const updated = await api.scheduleInspection(selectedInsp.id, {
        scheduledDate,
        reportingDeadline: new Date(new Date(scheduledDate).getTime() + 5 * 86400000).toISOString().split('T')[0],
        leadExpertName,
        actorName: currentUser.name,
        actorRole: currentUser.role,
      });

      setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast('success', 'Inspection Scheduled', `EVC visit scheduled for ${scheduledDate}`);
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Scheduling Failed', err.message);
    }
  };

  const handleCompleteVisitSubmit = async () => {
    if (!selectedInsp) return;
    try {
      const updated = await api.completeInspectionVisit(selectedInsp.id, {
        visitOutcome,
        actorName: currentUser.name,
        actorRole: currentUser.role,
      });

      setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast('success', 'Visit Completed', 'On-site verification completed. 5-day statutory report countdown initiated.');
      setIsVisitModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Action Failed', err.message);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsp || !reportSummary) return;

    setSubmittingReport(true);
    try {
      if (reportFile) {
        const formData = new FormData();
        formData.append('file', reportFile);
        formData.append('applicationId', selectedInsp.applicationId);
        formData.append('institutionId', selectedInsp.institutionId);
        formData.append('requirementId', 'req_evc_report');
        formData.append('documentType', 'EVC Inspection Report');
        formData.append('uploadedBy', currentUser.name);
        formData.append('actorRole', currentUser.role);
        formData.append('verificationNotes', reportSummary);
        await api.uploadDocument(formData);
      }

      const updated = await api.submitInspectionReport(selectedInsp.id, {
        reportSummary,
        actorName: currentUser.name,
        actorRole: currentUser.role,
      });

      setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast('success', 'Report Uploaded', 'Signed EVC report submitted for SAC / SHC committee review.');
      setIsReportModalOpen(false);
      setReportSummary('');
      setReportFile(null);
    } catch (err: any) {
      showToast('error', 'Report Submission Failed', err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsp || !committeeRemarks) return;

    try {
      const updated = await api.recordCommitteeReview(selectedInsp.id, {
        recommendation,
        remarks: committeeRemarks,
        actorName: currentUser.name,
        actorRole: currentUser.role,
      });

      setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      showToast('success', 'Committee Review Recorded', `SAC recommended: ${recommendation}`);
      setIsReviewModalOpen(false);
      setCommitteeRemarks('');
    } catch (err: any) {
      showToast('error', 'Review Submission Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3"></span>
        Loading Inspection & Committee Workspace...
      </div>
    );
  }

  // Filter lists based on tab
  const evcList = inspections;
  const committeeList = inspections.filter(
    (i) => i.status === 'REPORT_SUBMITTED' || i.status === 'REVIEW_COMPLETED' || i.status === 'REPORT_PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Dashboard 3 Masthead */}
      <div className="bg-white p-5 rounded border border-[#DFE6E2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#123B32] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
              DASHBOARD 3
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-[#172B26]">
              Inspection & Committee Workspace
            </h1>
            <Badge variant="progress">Conditional Workflow</Badge>
          </div>
          <p className="text-xs text-[#61716B] mt-1">
            Conditional workflow interface used by Expert Visit Committee (EVC) Members to manage field visits and submit inspection findings, and by SAC/SHC Committee Members to review dockets and record formal recommendations.
          </p>
        </div>

        {/* Active Role Indicator */}
        <div className="text-xs font-semibold px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
          Viewing As: <strong>{currentUser.role.replace('_', ' ')}</strong>
        </div>
      </div>

      {/* Role-Specific Tabs Header */}
      <div className="border-b border-[#DFE6E2] flex items-center gap-4 overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          onClick={() => setActiveTab('evc_roster')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'evc_roster'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>EVC Field Inspection Roster ({evcList.length})</span>
          {isEVCMember && (
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
              Your Primary Role
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('committee_hearing')}
          className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'committee_hearing'
              ? 'border-[#123B32] text-[#123B32]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>SAC / SHC Standing Committee Cases ({committeeList.length})</span>
          {isCommitteeMember && (
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
              Your Primary Role
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: EVC Inspection Roster & Field Schedules */}
      {activeTab === 'evc_roster' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
            <div>
              <strong>EVC Operational Workflow:</strong> Coordinate visit schedule, conduct on-site physical infrastructure audit, and upload signed Form-EVC within statutory 5 days of visit.
            </div>
            <span className="text-[11px] font-bold text-blue-700">APH 2026-27 Norms</span>
          </div>

          <div className="space-y-4">
            {evcList.map((insp) => (
              <Card key={insp.id} bodyClassName="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                        {insp.inspectionNumber}
                      </span>
                      <Badge
                        variant={
                          insp.status === 'REPORT_PENDING'
                            ? 'error'
                            : insp.status === 'REVIEW_COMPLETED'
                            ? 'success'
                            : insp.status === 'SCHEDULED'
                            ? 'warning'
                            : 'progress'
                        }
                      >
                        {insp.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs font-semibold text-gray-600">{insp.inspectionType.replace('_', ' ')}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{insp.institutionName}</h3>

                    <div className="text-xs text-gray-600 flex flex-wrap gap-4">
                      <span>Region: <strong>{insp.region}</strong></span>
                      <span>Lead Expert: <strong>{insp.leadExpertName || 'To be nominated'}</strong></span>
                      {insp.scheduledDate && <span>Visit Date: <strong>{insp.scheduledDate}</strong></span>}
                      {insp.reportingDeadline && <span>Report Deadline: <strong>{insp.reportingDeadline}</strong></span>}
                    </div>

                    {insp.reportSummary && (
                      <div className="mt-2 text-xs p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-700">
                        <strong>EVC Report Summary:</strong> {insp.reportSummary}
                      </div>
                    )}
                  </div>

                    {/* EVC Actions */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#123B32] text-[#123B32] hover:bg-[#EAF5EF] font-semibold"
                      icon={<Camera className="w-4 h-4 text-[#123B32]" />}
                      onClick={() => {
                        setSelectedInsp(insp);
                        setIsLiveEvidenceModalOpen(true);
                      }}
                    >
                      Live Inspection Camera
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-semibold"
                      icon={<Download className="w-4 h-4 text-emerald-700" />}
                      onClick={() => downloadOrPrintEVCReport(insp)}
                      title="Download or Print Official AICTE Form-EVC Report"
                    >
                      Download EVC Report
                    </Button>

                    {insp.status === 'SCHEDULING_PENDING' && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Calendar className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedInsp(insp);
                          setIsScheduleModalOpen(true);
                        }}
                      >
                        Schedule Visit
                      </Button>
                    )}

                    {insp.status === 'SCHEDULED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedInsp(insp);
                          setIsVisitModalOpen(true);
                        }}
                      >
                        Mark Visit Completed
                      </Button>
                    )}

                    {insp.status === 'REPORT_PENDING' && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Upload className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedInsp(insp);
                          setIsReportModalOpen(true);
                        }}
                      >
                        Submit EVC Report
                      </Button>
                    )}

                    {insp.status === 'REPORT_SUBMITTED' && (
                      <Badge variant="success">Report Submitted</Badge>
                    )}

                    {insp.status === 'REVIEW_COMPLETED' && (
                      <Badge variant="success">EVC Finalized</Badge>
                    )}
                  </div>
                </div>

                {/* Geo-Tagged Physical Evidence & Mapbox Audit Section */}
                {insp.evidencePhotos && insp.evidencePhotos.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-[#DFE6E2] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-800" />
                        <span className="font-bold text-[#101E1A] text-xs">
                          Geo-Tagged On-Site Physical Evidence ({insp.evidencePhotos.length} Photo{insp.evidencePhotos.length > 1 ? 's' : ''} Recorded)
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                          Mapbox Pinned
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Tamper-Evident GPS, Date & Time Watermark Overlay
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      {insp.evidencePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:border-emerald-600 transition-colors shadow-2xs group"
                        >
                          <div
                            className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                            onClick={() => setPreviewWatermarkUrl(photo.imageUrl)}
                          >
                            <img
                              src={photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {photo.mapboxStaticUrl && (
                              <div className="absolute top-1.5 left-1.5 w-12 h-12 rounded border border-white shadow-md overflow-hidden bg-white">
                                <img
                                  src={photo.mapboxStaticUrl}
                                  alt="Mapbox Pin"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <Eye className="w-3 h-3 text-[#E5A900]" /> Full Watermark
                            </div>
                          </div>

                          <div className="p-2.5 space-y-1 text-[11px]">
                            <div className="font-bold text-gray-900 truncate" title={photo.title}>
                              {photo.title}
                            </div>
                            <div className="text-[10px] text-gray-600 line-clamp-1">{photo.category}</div>
                            <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{photo.geo.lat.toFixed(4)}° N, {photo.geo.lng.toFixed(4)}° E</span>
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">{photo.geo.address}</div>
                            {photo.notes && (
                              <div className="text-[10px] text-gray-700 italic bg-white p-1 rounded border border-gray-100 line-clamp-2">
                                "{photo.notes}"
                              </div>
                            )}
                            <div className="text-[9px] text-gray-400 pt-1 border-t border-gray-200 flex justify-between">
                              <span>📅 {photo.capturedAt}</span>
                              <span className="font-semibold text-gray-700">{photo.capturedBy.split('(')[0].trim()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: SAC / SHC Standing Committee Hearing Cases */}
      {activeTab === 'committee_hearing' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
            <div>
              <strong>Standing Appellate Committee (SAC) & Standing Hearing Committee (SHC):</strong> Review submitted EVC reports, hear oral representations on deficiencies, and formulate recommendations for the Competent Decision Authority.
            </div>
            <span className="text-[11px] font-bold text-amber-800">Appellate Jurisdiction</span>
          </div>

          <div className="space-y-4">
            {committeeList.map((insp) => (
              <Card key={insp.id} bodyClassName="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                        {insp.inspectionNumber}
                      </span>
                      <Badge variant={insp.status === 'REVIEW_COMPLETED' ? 'success' : 'warning'}>
                        {insp.status === 'REVIEW_COMPLETED' ? 'HEARING COMPLETED' : 'AWAITING COMMITTEE HEARING'}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{insp.institutionName}</h3>

                    <div className="text-xs text-gray-600 flex flex-wrap gap-4">
                      <span>Inspection Team: <strong>{insp.leadExpertName}</strong></span>
                      <span>Visit Completed On: <strong>{insp.scheduledDate}</strong></span>
                    </div>

                    {insp.reportSummary && (
                      <div className="text-xs p-2.5 bg-gray-50 border border-gray-200 rounded text-gray-700">
                        <strong>Submitted EVC Finding:</strong> {insp.reportSummary}
                      </div>
                    )}

                    {insp.committeeRemarks && (
                      <div className="text-xs p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                        <strong>Recorded Committee Recommendation:</strong> {insp.committeeRecommendation} — {insp.committeeRemarks}
                      </div>
                    )}
                  </div>

                  {/* Committee Action */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {insp.status === 'REPORT_SUBMITTED' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Scale className="w-4 h-4" />}
                        onClick={() => {
                          setSelectedInsp(insp);
                          setIsReviewModalOpen(true);
                        }}
                      >
                        Record Hearing Finding
                      </Button>
                    ) : insp.status === 'REVIEW_COMPLETED' ? (
                      <Badge variant="success">Recommendation Recorded</Badge>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Awaiting EVC Report</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Expert Visit Committee (EVC) Inspection"
        subtitle={`Assign Lead Expert & Inspection Date for ${selectedInsp?.institutionName}`}
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Inspection Visit Date *</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Nominated Lead Expert Name *</label>
            <input
              type="text"
              placeholder="e.g. Prof. Sunita Kulkarni"
              value={leadExpertName}
              onChange={(e) => setLeadExpertName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Expert Parent Organization</label>
            <input
              type="text"
              placeholder="e.g. Indian Institute of Technology, Bombay"
              value={leadOrg}
              onChange={(e) => setLeadOrg(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark Visit Completed Modal with On-Site Verification Checklist */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title="Record On-Site Visit Completion & Checklist"
        subtitle={`Physical verification completed for ${selectedInsp?.institutionName}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
            <span className="font-bold text-gray-800 block">On-Site Physical Audit Checklist:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkBuiltUpArea}
                onChange={(e) => setCheckBuiltUpArea(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Instructional & Administrative Built-Up Area meets prescribed sq.m norms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkLaboratories}
                onChange={(e) => setCheckLaboratories(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Computer Centre & Engineering Laboratories operational with required equipment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkFireSafety}
                onChange={(e) => setCheckFireSafety(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Fire safety equipment, hydrants, and evacuation signage in place</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkFacultyRoster}
                onChange={(e) => setCheckFacultyRoster(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Faculty attendance register & appointment orders verified</span>
            </label>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Inspection Preliminary Finding *</label>
            <select
              value={visitOutcome}
              onChange={(e: any) => setVisitOutcome(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs"
            >
              <option value="SATISFACTORY">Satisfactory (Meets AICTE APH Standards)</option>
              <option value="DEFICIENCIES_FOUND">Deficiencies Found (Clarification / Correction Needed)</option>
              <option value="SERIOUS_IRREGULARITIES">Serious Irregularities / Misrepresentation</option>
            </select>
          </div>

          <p className="text-[11px] text-gray-500">
            Note: Marking visit completed triggers statutory 5-day deadline for expert team to upload signed inspection report.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsVisitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCompleteVisitSubmit}>
              Confirm Visit Completion
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submit Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Submit Signed EVC Inspection Report"
        subtitle={`Formal report submission for ${selectedInsp?.institutionName}`}
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Executive Summary & Facility Observations *
            </label>
            <textarea
              rows={4}
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              placeholder="Detail laboratory equipment verification, classroom built-up area, faculty attendance register, library titles, and statutory safety readiness..."
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Attach Signed Form-EVC Inspection Dossier & Photos (PDF / Images)
            </label>
            <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded text-center">
              <input
                type="file"
                id="evc-report-file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReportFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="evc-report-file" className="cursor-pointer block">
                <Upload className="w-6 h-6 text-[#123B32] mx-auto mb-1" />
                {reportFile ? (
                  <div className="text-xs font-semibold text-[#123B32]">
                    Selected: {reportFile.name} ({(reportFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-[#123B32]">Click to select signed report file</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">PDF, PNG, JPG up to 15 MB with DSC / e-Sign</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingReport}>
              Submit Final Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Committee Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Standing Hearing Committee (SAC / SHC) Review"
        subtitle={`Appellate / Hearing review for ${selectedInsp?.institutionName}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 block mb-1">Committee Recommendation *</label>
            <select
              value={recommendation}
              onChange={(e: any) => setRecommendation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-xs"
            >
              <option value="RECOMMEND_APPROVAL">Recommend Formal Approval (LoA)</option>
              <option value="RECOMMEND_DEFICIENCY_HEARING">Recommend Deficiency Show-Cause Hearing</option>
              <option value="RECOMMEND_REJECTION">Recommend Rejection (LoR)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Committee Observations & Grounds *</label>
            <textarea
              rows={3}
              value={committeeRemarks}
              onChange={(e) => setCommitteeRemarks(e.target.value)}
              placeholder="Record committee rationale based on APH clauses, inspection findings, and oral submissions..."
              className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Committee Finding
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live EVC Inspection & Geo-Tagged Evidence Capture Modal */}
      <LiveEVCInspectionModal
        isOpen={isLiveEvidenceModalOpen}
        onClose={() => setIsLiveEvidenceModalOpen(false)}
        inspection={selectedInsp}
        onEvidenceSubmitted={(updated) => {
          setInspections((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />

      {/* Full Watermarked Evidence Image Preview Lightbox */}
      {previewWatermarkUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewWatermarkUrl(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#123B32] text-white flex items-center justify-between text-xs font-bold">
              <span>Verified On-Site Physical Inspection Watermark (Mapbox + GPS Timestamp)</span>
              <button
                type="button"
                onClick={() => setPreviewWatermarkUrl(null)}
                className="text-white hover:text-gray-300 text-lg px-2"
              >
                ×
              </button>
            </div>
            <div className="p-3 overflow-auto max-h-[80vh] flex items-center justify-center bg-neutral-900">
              <img
                src={previewWatermarkUrl}
                alt="Watermarked Evidence"
                className="max-h-[75vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
