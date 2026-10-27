import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Application, ApplicationCategory } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FileUploadModal } from '../components/ui/FileUploadModal';
import {
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Shield,
  FileCheck,
  Send,
  HelpCircle,
  Eye,
  Info,
  Layers,
  Calendar,
} from 'lucide-react';

export const NewApplicationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Multi-step state (1 to 7)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<Application | null>(null);

  // Form State
  const [category, setCategory] = useState<ApplicationCategory>('EXTENSION_OF_APPROVAL');
  const [categoryLabel, setCategoryLabel] = useState('Extension of Approval (EoA)');

  // Step 2: Institution Data (Defaulted to Chennai College for live demonstration)
  const [institutionName] = useState(
    currentUser?.organization || 'Chennai Institute of Technology & Engineering (CITE Chennai)'
  );
  const [institutionId] = useState(currentUser?.institutionId || 'inst_03');
  const [pid] = useState(currentUser?.institutionId === 'inst_01' ? '1-92837101' : '1-94821033');
  const [region] = useState(currentUser?.region || 'Southern');
  const [state] = useState(currentUser?.institutionId === 'inst_01' ? 'Madhya Pradesh' : 'Tamil Nadu');
  const [district] = useState(currentUser?.institutionId === 'inst_01' ? 'Bhopal' : 'Chennai');
  const [institutionType] = useState('Engineering & Technology');
  const [academicYear] = useState('2026-27');

  // Step 3: Application Details
  const [programmeName, setProgrammeName] = useState('B.Tech Artificial Intelligence & Data Science');
  const [level, setLevel] = useState<'UG' | 'PG' | 'Diploma'>('UG');
  const [intakeProposed, setIntakeProposed] = useState('120');
  const [landArea, setLandArea] = useState('12500'); // sq.m
  const [builtUpArea, setBuiltUpArea] = useState('8500'); // sq.m
  const [affiliatingUniversity, setAffiliatingUniversity] = useState(
    currentUser?.institutionId === 'inst_01'
      ? 'Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal'
      : 'Anna University, Chennai'
  );
  const [commencementSession, setCommencementSession] = useState('July 2026');

  // Step 4: Documents state
  interface UploadedDocState {
    reqId: string;
    title: string;
    clause: string;
    fileName?: string;
    fileSize?: string;
    uploadedAt?: string;
    docId?: string;
    status: 'PENDING' | 'UPLOADED';
  }

  const [documentRequirements, setDocumentRequirements] = useState<UploadedDocState[]>([
    {
      reqId: 'req_01',
      title: 'Land Title / Registered 30-Year Lease Deed',
      clause: 'Clause 4.1.2',
      status: 'PENDING',
    },
    {
      reqId: 'req_02',
      title: 'State Fire Safety NOC & Clearance Certificate',
      clause: 'Clause 4.2.3',
      status: 'PENDING',
    },
    {
      reqId: 'req_03',
      title: 'Architectural Building & Infrastructure Plan',
      clause: 'Clause 5.1.1',
      status: 'PENDING',
    },
    {
      reqId: 'req_04',
      title: 'AICTE Cadre Ratio Faculty Appointment Roster',
      clause: 'Clause 7.4.1',
      status: 'PENDING',
    },
    {
      reqId: 'req_05',
      title: 'Governing Board Resolution for Approval Filing',
      clause: 'Clause 3.2.1',
      status: 'PENDING',
    },
  ]);

  // Active upload modal state
  const [activeUploadReq, setActiveUploadReq] = useState<UploadedDocState | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Step 6: Statutory Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Restore draft on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('aicte_draft_application_inst_01');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.categoryLabel) setCategoryLabel(parsed.categoryLabel);
        if (parsed.programmeName) setProgrammeName(parsed.programmeName);
        if (parsed.level) setLevel(parsed.level);
        if (parsed.intakeProposed) setIntakeProposed(parsed.intakeProposed);
        if (parsed.landArea) setLandArea(parsed.landArea);
        if (parsed.builtUpArea) setBuiltUpArea(parsed.builtUpArea);
        if (parsed.affiliatingUniversity) setAffiliatingUniversity(parsed.affiliatingUniversity);
        if (parsed.documentRequirements) setDocumentRequirements(parsed.documentRequirements);
        showToast('info', 'Draft Restored', 'Restored previously saved application draft.');
      }
    } catch (e) {
      console.warn('Could not load draft application', e);
    }
  }, []);

  const handleSaveDraft = () => {
    const draftPayload = {
      category,
      categoryLabel,
      programmeName,
      level,
      intakeProposed,
      landArea,
      builtUpArea,
      affiliatingUniversity,
      documentRequirements,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('aicte_draft_application_inst_01', JSON.stringify(draftPayload));
    showToast('success', 'Draft Saved', 'Your application progress has been stored locally.');
  };

  const handleCategorySelect = (cat: ApplicationCategory, label: string) => {
    setCategory(cat);
    setCategoryLabel(label);
  };

  const handleDocumentUploaded = (doc: any) => {
    if (!activeUploadReq) return;
    setDocumentRequirements((prev) =>
      prev.map((d) =>
        d.reqId === activeUploadReq.reqId
          ? {
              ...d,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              uploadedAt: doc.uploadedAt || new Date().toISOString().split('T')[0],
              docId: doc.id,
              status: 'UPLOADED',
            }
          : d
      )
    );
    showToast('success', 'Document Saved', `${doc.fileName} associated with this application draft.`);
  };

  const handleAutoFillMockDocuments = () => {
    const mockFilesMap: Record<string, { fileName: string; fileSize: string }> = {
      req_01: { fileName: '01_Land_Title_30Year_Registered_Lease_Deed.pdf', fileSize: '1.2 MB' },
      req_02: { fileName: '02_State_Fire_Safety_Clearance_NOC_Certificate.pdf', fileSize: '850 KB' },
      req_03: { fileName: '03_Architectural_Building_Safety_Plan_Approval.pdf', fileSize: '2.4 MB' },
      req_04: { fileName: '04_AICTE_Faculty_Cadre_Roster_Biometric_Summary.pdf', fileSize: '1.1 MB' },
      req_05: { fileName: '07_Governing_Board_Resolution.pdf', fileSize: '640 KB' },
    };

    setDocumentRequirements((prev) =>
      prev.map((d) => {
        const mock = mockFilesMap[d.reqId] || { fileName: `${d.title.replace(/[\/\s]/g, '_')}.pdf`, fileSize: '1.0 MB' };
        return {
          ...d,
          fileName: mock.fileName,
          fileSize: mock.fileSize,
          uploadedAt: new Date().toISOString().split('T')[0],
          docId: `doc_mock_${d.reqId}`,
          status: 'UPLOADED',
        };
      })
    );
    showToast('success', 'Mock Documents Attached', 'All 5 statutory documents loaded from mock-documents/ archive.');
  };

  const handleFinalSubmit = async () => {
    if (!declarationAccepted) {
      showToast('error', 'Declaration Required', 'Please accept the statutory institutional declaration before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        institutionId,
        institutionName,
        category,
        categoryLabel,
        academicYear,
        region,
        state,
        district,
        programmeName,
        intakeProposed: Number(intakeProposed),
        landArea: Number(landArea),
        builtUpArea: Number(builtUpArea),
        affiliatingUniversity,
        uploadedDocumentIds: documentRequirements.filter((d) => d.status === 'UPLOADED').map((d) => d.docId),
        actorName: currentUser.name,
        actorRole: currentUser.role,
      };

      const created = await api.createApplication(payload);
      setSubmittedApplication(created);
      localStorage.removeItem('aicte_draft_application_inst_01');
      showToast('success', 'Application Submitted', `Application ${created.applicationNumber} registered in national database.`);
      setCurrentStep(7); // Jump to Confirmation Step
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.message || 'Unable to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    {
      id: 'EXTENSION_OF_APPROVAL' as ApplicationCategory,
      title: 'Extension of Approval (EoA)',
      subtitle: 'Annual approval for continuing existing approved technical programmes for AY 2026-27.',
      badge: 'Annual Mandatory',
    },
    {
      id: 'NEW_PROGRAMME' as ApplicationCategory,
      title: 'Introduction of New Programme / Course / Level',
      subtitle: 'Introduction of a new technical discipline (e.g., AI & Data Science) or degree level (UG/PG).',
      badge: 'Scrutiny + EVC',
    },
    {
      id: 'NEW_INSTITUTION' as ApplicationCategory,
      title: 'Establishment of New Technical Institution',
      subtitle: 'Approval for setting up a new engineering, management, or polytechnic college.',
      badge: 'Full Scrutiny',
    },
    {
      id: 'CHANGE_MODIFICATION' as ApplicationCategory,
      title: 'Change of Site / Intake Modification',
      subtitle: 'Permanent relocation of campus or substantial increase in student intake capacity.',
      badge: 'Inspection Required',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
            <span className="cursor-pointer hover:underline" onClick={() => navigate('/institution')}>
              My Institution Portal
            </span>
            <span>&gt;</span>
            <span className="font-semibold text-neutral-800">New Application</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Create New Institutional Approval Application
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Academic Session 2026-27 • Council Approval & Regulatory Scrutiny Workflow
          </p>
        </div>

        {currentStep < 7 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<Save className="w-3.5 h-3.5" />} onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/institution')}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Stepper Progress Bar (Steps 1 to 6) */}
      {currentStep < 7 && (
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              { num: 1, label: 'Application Type' },
              { num: 2, label: 'Institution Profile' },
              { num: 3, label: 'Course Details' },
              { num: 4, label: 'Documents' },
              { num: 5, label: 'Review' },
              { num: 6, label: 'Declaration' },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                  currentStep === s.num
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-b-2 border-emerald-700'
                    : currentStep > s.num
                    ? 'text-emerald-700 cursor-pointer font-medium hover:bg-neutral-50'
                    : 'text-neutral-400 font-medium'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === s.num
                      ? 'bg-emerald-800 text-white'
                      : currentStep > s.num
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: Select Application Type */}
      {currentStep === 1 && (
        <Card title="Step 1: Select Approval Category" subtitle="Select the applicable statutory approval category under APH 2026-27 regulations.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id, cat.title)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    category === cat.id
                      ? 'border-emerald-700 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-700'
                      : 'border-neutral-200 hover:border-neutral-400 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {cat.badge}
                      </span>
                      {category === cat.id && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900">{cat.title}</h3>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{cat.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Selected category determines the mandatory document checklist and whether physical Expert Visit Committee (EVC) inspection is statutory.
              </span>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setCurrentStep(2)}>
                Continue to Institution Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Institution Details (Prefilled Verified Profile) */}
      {currentStep === 2 && (
        <Card title="Step 2: Institution Details & Jurisdiction" subtitle="Verified identity loaded from council institutional database.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Institution Legal Name</label>
                <input
                  type="text"
                  value={institutionName}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Permanent Institution ID (PID)</label>
                <input
                  type="text"
                  value={pid}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Assigned AICTE Regional Office</label>
                <input
                  type="text"
                  value={`${region} Regional Office (CRO Bhopal)`}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">State & District</label>
                <input
                  type="text"
                  value={`${district}, ${state}`}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Discipline / Institution Category</label>
                <input
                  type="text"
                  value={institutionType}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Target Academic Session</label>
                <input
                  type="text"
                  value={academicYear}
                  disabled
                  className="w-full p-2.5 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-medium text-emerald-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button size="md" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(1)}>
                Previous
              </Button>
              <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setCurrentStep(3)}>
                Continue to Course Particulars
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Course & Infrastructure Details */}
      {currentStep === 3 && (
        <Card title="Step 3: Academic & Infrastructure Particulars" subtitle="Specify the course title, requested student intake capacity, and built-up area.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-neutral-700 block mb-1">
                  Programme / Course Title *
                </label>
                <input
                  type="text"
                  value={programmeName}
                  onChange={(e) => setProgrammeName(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Course Level *</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs bg-white focus:ring-2 focus:ring-emerald-700 outline-none"
                >
                  <option value="UG">Under Graduate (UG — 4 Years)</option>
                  <option value="PG">Post Graduate (PG — 2 Years)</option>
                  <option value="Diploma">Diploma (3 Years)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Proposed Annual Student Intake *</label>
                <select
                  value={intakeProposed}
                  onChange={(e) => setIntakeProposed(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs bg-white focus:ring-2 focus:ring-emerald-700 outline-none font-mono"
                >
                  <option value="60">60 Students (1 Division)</option>
                  <option value="120">120 Students (2 Divisions)</option>
                  <option value="180">180 Students (3 Divisions)</option>
                  <option value="240">240 Students (4 Divisions)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Total Campus Land Area (Sq. Metres) *</label>
                <input
                  type="number"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Total Instructional Built-up Area (Sq. Metres) *</label>
                <input
                  type="number"
                  value={builtUpArea}
                  onChange={(e) => setBuiltUpArea(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-neutral-700 block mb-1">
                  Affiliating State University / Technical Board *
                </label>
                <input
                  type="text"
                  value={affiliatingUniversity}
                  onChange={(e) => setAffiliatingUniversity(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button size="md" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(2)}>
                Previous
              </Button>
              <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setCurrentStep(4)}>
                Continue to Evidence Uploads
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: Compliance Documents & Evidence */}
      {currentStep === 4 && (
        <Card
          title="Step 4: Statutory Compliance Documents & Evidence"
          subtitle="Upload required certifications. Documents will be registered in the national evidence repository."
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[#F0F5F2] border border-[#CDE0D7] rounded-lg">
              <div className="text-xs text-[#52635D]">
                <strong className="text-[#123B32]">Mock Documents Archive:</strong> Pre-generated statutory PDFs and deeds are stored in <code className="font-mono bg-white px-1 py-0.5 rounded border text-[#123B32]">mock-documents/</code>.
              </div>
              <button
                type="button"
                onClick={handleAutoFillMockDocuments}
                className="px-3 py-1.5 bg-[#123B32] hover:bg-[#0B2924] text-white text-xs font-bold rounded shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <span>⚡ Auto-Attach All Mock Documents</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="ux4g-table ux4g-table-m ux4g-table-zebra-rows w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold text-[10px] uppercase bg-neutral-50">
                    <th className="py-2.5 px-3">Statutory Requirement</th>
                    <th className="py-2.5 px-3">APH Clause</th>
                    <th className="py-2.5 px-3">Submitted File</th>
                    <th className="py-2.5 px-3">Upload Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {documentRequirements.map((doc) => (
                    <tr key={doc.reqId}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900">{doc.title}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-500">{doc.clause}</td>
                      <td className="py-3 px-3">
                        {doc.status === 'UPLOADED' ? (
                          <div>
                            <div className="font-semibold text-emerald-900 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              {doc.fileName}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {doc.fileSize} • Uploaded: {doc.uploadedAt}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No document attached yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={doc.status === 'UPLOADED' ? 'success' : 'neutral'}>
                          {doc.status === 'UPLOADED' ? 'FURNISHED' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant={doc.status === 'UPLOADED' ? 'secondary' : 'primary'}
                          icon={<Upload className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setActiveUploadReq(doc);
                            setIsUploadModalOpen(true);
                          }}
                        >
                          {doc.status === 'UPLOADED' ? 'Replace' : 'Upload File'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button size="md" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(3)}>
                Previous
              </Button>
              <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setCurrentStep(5)}>
                Review Application
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: Review Application */}
      {currentStep === 5 && (
        <Card title="Step 5: Review Application Summary" subtitle="Verify all institutional, academic, and document particulars before submission.">
          <div className="space-y-6 text-xs">
            {/* Category & Session */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-neutral-900">Application Overview</h4>
                <button onClick={() => setCurrentStep(1)} className="text-emerald-700 hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-neutral-500 block">Approval Category</span>
                  <span className="font-bold text-neutral-800">{categoryLabel}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Target Session</span>
                  <span className="font-bold text-neutral-800">{academicYear}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Institution PID</span>
                  <span className="font-mono font-bold text-neutral-800">{pid}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Regional Office</span>
                  <span className="font-bold text-neutral-800">{region} (Bhopal)</span>
                </div>
              </div>
            </div>

            {/* Academic Particulars */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-neutral-900">Course & Infrastructure Particulars</h4>
                <button onClick={() => setCurrentStep(3)} className="text-emerald-700 hover:underline font-semibold">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-neutral-500 block">Programme</span>
                  <span className="font-bold text-neutral-800">{programmeName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Level</span>
                  <span className="font-bold text-neutral-800">{level} (4 Years)</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Requested Intake</span>
                  <span className="font-mono font-bold text-neutral-800">{intakeProposed} Seats</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Instructional Area</span>
                  <span className="font-mono font-bold text-neutral-800">{builtUpArea} sq.m</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 block">Affiliating University</span>
                  <span className="font-bold text-neutral-800">{affiliatingUniversity}</span>
                </div>
              </div>
            </div>

            {/* Document Verification Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-neutral-900">Uploaded Evidence Records</h4>
                <button onClick={() => setCurrentStep(4)} className="text-emerald-700 hover:underline font-semibold">
                  Manage Files
                </button>
              </div>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 text-[10px] text-neutral-600 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">Requirement</th>
                      <th className="p-2.5">File Name</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {documentRequirements.map((d) => (
                      <tr key={d.reqId}>
                        <td className="p-2.5 font-medium">{d.title}</td>
                        <td className="p-2.5 font-mono text-neutral-600">
                          {d.fileName || <span className="text-neutral-400 italic">Pending</span>}
                        </td>
                        <td className="p-2.5">
                          <Badge variant={d.status === 'UPLOADED' ? 'success' : 'neutral'}>
                            {d.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button size="md" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(4)}>
                Previous
              </Button>
              <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setCurrentStep(6)}>
                Proceed to Declaration
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: Statutory Declaration & Submission */}
      {currentStep === 6 && (
        <Card title="Step 6: Statutory Institutional Declaration" subtitle="Affirm compliance under the AICTE Act 1987 and submit application.">
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-950 leading-relaxed space-y-2">
              <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-700" /> Statutory Institutional Undertaking
              </h4>
              <p>
                I, <strong>{currentUser.name}</strong>, authorized representative of{' '}
                <strong>{institutionName}</strong>, hereby solemnly affirm and state as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-neutral-700">
                <li>All particulars, student intake details, instructional areas, and uploaded documents are authentic, accurate, and in strict conformance with the AICTE Approval Process Handbook (APH) 2026-27 regulations.</li>
                <li>The land and built-up infrastructure comply with the approved building master plan and state fire safety directives.</li>
                <li>The institution guarantees minimum Cadre Ratio faculty appointments (Clause 7.4.1) prior to the commencement of classes.</li>
                <li>I understand that submitting false or manipulated certificates will lead to summary withdrawal of approval and penal proceedings under Indian statutory law.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-700 w-4 h-4"
              />
              <span className="text-xs font-semibold text-neutral-800">
                I have read and accept the statutory declaration. I authorize the digital submission of this application for council scrutiny.
              </span>
            </label>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button size="md" variant="secondary" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setCurrentStep(5)}>
                Back to Review
              </Button>
              <Button
                size="md"
                variant="primary"
                isLoading={isSubmitting}
                disabled={!declarationAccepted || isSubmitting}
                icon={<Send className="w-4 h-4" />}
                onClick={handleFinalSubmit}
                className="bg-[#123B32] hover:bg-[#0B2924] text-white"
              >
                Submit Application to AICTE
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 7: Submission Confirmation */}
      {currentStep === 7 && submittedApplication && (
        <Card className="text-center py-8">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                Application Successfully Submitted to AICTE
              </h2>
              <p className="text-xs text-neutral-600 mt-1">
                Your institutional approval application has been registered and transmitted to the Central Regional Scrutiny Office.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-neutral-500">Application Number:</span>
                <span className="font-mono font-bold text-neutral-900">{submittedApplication.applicationNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-neutral-500">Institution:</span>
                <span className="font-bold text-neutral-900">{submittedApplication.institutionName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-neutral-500">Category:</span>
                <span className="font-medium text-neutral-900">{submittedApplication.categoryLabel}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-neutral-500">Submission Date:</span>
                <span className="font-medium text-neutral-900">{submittedApplication.submissionDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Current Status:</span>
                <Badge variant="progress">{submittedApplication.stageLabel}</Badge>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 text-left">
              <strong>Next Expected Step:</strong> Scrutiny Officer Dr. Ramesh Chandra will conduct completeness scrutiny and document verification within 15 statutory business days.
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => navigate(`/applications/${submittedApplication.id}`)}
              >
                View Application Details
              </Button>
              <Button
                variant="outline"
                icon={<Building2 className="w-4 h-4" />}
                onClick={() => navigate('/institution')}
              >
                Return to Institution Portal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Reusable File Upload Modal for Step 4 */}
      {activeUploadReq && (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setActiveUploadReq(null);
          }}
          onSuccess={(doc) => {
            handleDocumentUploaded(doc);
            setIsUploadModalOpen(false);
            setActiveUploadReq(null);
          }}
          applicationId="draft_new_app"
          institutionId={institutionId}
          requirementId={activeUploadReq.reqId}
          requirementTitle={activeUploadReq.title}
          clauseReference={activeUploadReq.clause}
          documentType="Institutional Evidence"
          actorName={currentUser.name}
          actorRole={currentUser.role}
        />
      )}
    </div>
  );
};
