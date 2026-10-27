import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileCheck2,
  ArrowRight,
  Shield,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Users,
  Compass,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [highContrast, setHighContrast] = useState(false);
  const [trackAppNo, setTrackAppNo] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast');
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackAppNo.trim()) return;
    const cleanNo = trackAppNo.trim().toUpperCase();
    if (cleanNo.includes('101')) {
      setTrackResult('Application APP-2026-101: Under Scrutiny — Deficiency Notice Communicated (Response Due: 2026-11-10).');
    } else if (cleanNo.includes('103')) {
      setTrackResult('Application APP-2026-103: Committee Review Completed — Awaiting Competent Authority Decision.');
    } else if (cleanNo.includes('105')) {
      setTrackResult('Application APP-2026-105: Approved — Letter of Approval (LoA) Issued for AY 2026-27.');
    } else {
      setTrackResult(`Application ${cleanNo}: Record found. Current Stage: Scrutiny & Document Verification. Login to view complete details.`);
    }
  };

  const services = [
    {
      title: 'Apply for Approval',
      desc: 'Submit new institutional applications, extension of approvals (EoA), or new programmes for AY 2026-27.',
      icon: <Building2 className="w-5 h-5 text-emerald-700" />,
      action: () => navigate('/login?redirect=/institution/applications/new'),
      badge: 'Online Form',
    },
    {
      title: 'Track an Application',
      desc: 'Check live application status, stage progression, and scrutiny committee timelines using your reference number.',
      icon: <Compass className="w-5 h-5 text-indigo-700" />,
      action: () => {
        const el = document.getElementById('tracking-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      badge: 'Public Tracker',
    },
    {
      title: 'Submit Clarification',
      desc: 'Respond to formal deficiency notices and upload requested documents within statutory deadlines.',
      icon: <FileText className="w-5 h-5 text-amber-700" />,
      action: () => navigate('/login'),
      badge: 'Restricted',
    },
    {
      title: 'Upload Compliance Evidence',
      desc: 'Upload fire safety NOCs, land titles, building plans, and faculty rosters directly to the digital repository.',
      icon: <Upload className="w-5 h-5 text-blue-700" />,
      action: () => navigate('/login'),
      badge: 'Digital Locker',
    },
    {
      title: 'Check Document Validity',
      desc: 'Monitor institutional lease expiry dates, recurring certifications, and regulatory validity registers.',
      icon: <Calendar className="w-5 h-5 text-purple-700" />,
      action: () => navigate('/login'),
      badge: 'Registers',
    },
    {
      title: 'Notices & Circulars',
      desc: 'Read official Approval Process Handbook (APH) amendments, council resolutions, and public advisories.',
      icon: <FileCheck2 className="w-5 h-5 text-teal-700" />,
      action: () => {
        const el = document.getElementById('notices');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      badge: 'Public Gazette',
    },
  ];

  const workflowSteps = [
    { step: 1, title: 'Institution Login', desc: 'Secure institutional access via authorized Principal / Director credentials.' },
    { step: 2, title: 'Create Application', desc: 'Select approval category (Extension of Approval, New Programme, New Institute).' },
    { step: 3, title: 'Enter Details & Evidence', desc: 'Furnish institutional profile, academic infrastructure, and upload certificates.' },
    { step: 4, title: 'Submit Application', desc: 'Formal statutory declaration and submission to the Regional Scrutiny Office.' },
    { step: 5, title: 'Scrutiny & Review', desc: 'Automated completeness checks and officer document verification.' },
    { step: 6, title: 'Clarification / Response', desc: 'Opportunity for the institution to rectify deficiencies within statutory deadlines.' },
    { step: 7, title: 'EVC / Physical Visit', desc: 'Expert Visit Committee on-site or virtual infrastructure inspection.' },
    { step: 8, title: 'Committee Assessment', desc: 'Standing Hearing Committee (SHC) / Appellate assessment where mandated.' },
    { step: 9, title: 'Competent Decision', desc: 'Executive council grant of formal Letter of Approval (LoA) or Speaking Order.' },
    { step: 10, title: 'Post-Approval Compliance', desc: 'Annual compliance reporting, fee parity, and certificate renewal tracking.' },
  ];

  const portalFeatures = [
    {
      title: 'Coordinated Workflow Engine',
      desc: 'Single unified state machine tracking applications from initial filing to executive decision with complete role isolation and SLA timers.',
      icon: <Layers className="w-5 h-5 text-emerald-800" />,
    },
    {
      title: 'Compliance Evidence Intelligence (CEI)',
      desc: 'Deterministic regulatory rules verify land titles, fire safety NOC expiry, and faculty cadre ratios against APH standards with full explainability.',
      icon: <Shield className="w-5 h-5 text-indigo-800" />,
    },
    {
      title: 'Document Validity & Expiry Register',
      desc: 'Automated tracking of statutory lease deeds, certificates, and compliance undertakings with pro-active notifications prior to expiry.',
      icon: <Clock className="w-5 h-5 text-amber-800" />,
    },
    {
      title: 'Regulatory Change Impact Engine (RCIE)',
      desc: 'Clause-level diffing between APH revisions with impact analysis on live applications before controlled council publication.',
      icon: <Award className="w-5 h-5 text-blue-800" />,
    },
    {
      title: 'Multi-Tier Alerts & Escalations',
      desc: 'Automatic escalation to Regional Officers and Central Headquarters when statutory review deadlines approach SLA limits.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-800" />,
    },
    {
      title: 'Immutable National Audit Trail',
      desc: 'Cryptographic SHA-256 verification and immutable event logging for every document submission, review remark, and sanction order.',
      icon: <FileCheck2 className="w-5 h-5 text-teal-800" />,
    },
  ];

  const notices = [
    {
      id: 'n1',
      date: '2026-10-15',
      title: 'Approval Process Handbook (APH) 2026-27 Gazetted & Enacted',
      category: 'Regulations',
      desc: 'Revised faculty cadre ratios (Clause 7.4.1) and fire safety grace periods (Clause 4.2.3) now in active legal effect.',
    },
    {
      id: 'n2',
      date: '2026-10-01',
      title: 'Mandatory Submission of Digital Fire Safety Certificates',
      category: 'Circular',
      desc: 'All technical institutions must furnish valid state fire safety clearance certificates with minimum 1-year remaining validity.',
    },
    {
      id: 'n3',
      date: '2026-09-20',
      title: 'Advisory on Faculty Cadre Ratio Compliance in Engineering & Tech',
      category: 'Advisory',
      desc: 'Institutions with cadre deficits must upload approved recruitment rosters or board undertakings prior to EVC inspection.',
    },
  ];

  const faqs = [
    {
      q: 'Who is eligible to apply through this portal?',
      a: 'All recognized technical institutions, universities, polytechnics, and newly proposed trusts or societies seeking AICTE approval for technical education programmes in India.',
    },
    {
      q: 'What is Compliance Evidence Intelligence (CEI)?',
      a: 'CEI is an automated advisory system that checks submitted documents against configured AICTE Approval Process Handbook (APH) clauses. It assists scrutiny officers and institutions by highlighting missing records, approaching expiry dates, and cadre ratio variances.',
    },
    {
      q: 'How do I create a new application for AY 2026-27?',
      a: 'Click "Login to Portal", select your verified Institution Representative profile, and click "Create New Application" in the Institution Portal to begin the guided submission process.',
    },
    {
      q: 'Can an institution view another college’s application records?',
      a: 'No. Strict institutional data isolation is enforced. Institutions can only view, manage, and upload documents for their own designated institution ID.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-neutral-900 flex flex-col font-sans">
      {/* 1. Government Utility Bar */}
      <div className="w-full bg-[#0B2924] text-[#DFE6E2] px-4 md:px-8 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-[#173830]">
        <div className="flex items-center gap-2 md:gap-3 text-[11px]">
          <span className="font-semibold text-white">Government of India</span>
          <span className="text-[#558174]">|</span>
          <span>Ministry of Education</span>
          <span className="text-[#558174]">|</span>
          <span className="hidden sm:inline">All India Council for Technical Education</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button onClick={toggleContrast} className="hover:text-white flex items-center gap-1 transition-colors">
            High Contrast
          </button>
          <span className="text-[#558174]">|</span>
          <span className="font-mono text-emerald-400">Academic Year: 2026-27</span>
          <span className="text-[#558174]">|</span>
          <button onClick={() => navigate('/login')} className="text-amber-400 hover:underline font-semibold">
            Officer Login
          </button>
        </div>
      </div>

      {/* 2. Main Government Header */}
      <header className="w-full bg-[#123B32] text-white border-b border-neutral-200/20 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded bg-[#0B2924] border border-[#2b5349] flex items-center justify-center p-1 shadow-inner flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#E5A900]" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                AICTE Centralized Approval & Institutional Compliance Portal
              </div>
              <div className="text-[11px] text-[#c9e9e1] font-medium">
                Regulatory Approval, Scrutiny Workflow & Compliance Monitoring System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="ux4g-btn ux4g-btn-primary ux4g-btn-m  bg-[#E5A900] text-[#0B2924] font-bold hover:bg-[#d69d00] transition-colors border-0"
            >
              Login to Portal
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="w-full bg-[#0E3029] border-t border-[#1a443a] text-xs font-medium">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-6 overflow-x-auto py-2.5">
            <a href="#hero" className="text-white hover:text-amber-300 transition-colors whitespace-nowrap">Home</a>
            <a href="#about" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">About the Portal</a>
            <a href="#approval-process" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Approval Process</a>
            <a href="#services" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Services</a>
            <a href="#features" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Portal Capabilities</a>
            <a href="#notices" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Notices & Circulars</a>
            <a href="#faq" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Help & FAQs</a>
            <a href="#contact" className="text-[#c1ecde] hover:text-white transition-colors whitespace-nowrap">Contact & Support</a>
          </div>
        </nav>
      </header>



      {/* 3. Hero Section */}
      <section id="hero" className="bg-gradient-to-b from-[#123B32] to-[#0B2924] text-white py-14 px-4 md:px-8 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0B2924] border border-[#2b5349] text-xs font-semibold text-amber-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Centralized Statutory Portal for Academic Session 2026-27</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              A Unified Platform for Approval Workflow and Institutional Compliance
            </h1>
            <p className="text-sm sm:text-base text-[#d1e7e2] leading-relaxed max-w-2xl">
              A coordinated platform for institution applications, evidence submission, approval workflow tracking, document validity monitoring, and post-approval compliance under the AICTE Act & Regulations.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded text-sm font-bold bg-[#E5A900] text-[#0B2924] hover:bg-[#d69d00] transition-colors inline-flex items-center justify-center shadow"
              >
                Login to Portal <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
              <a
                href="#approval-process"
                className="px-5 py-2.5 rounded text-sm font-semibold text-white border border-white/60 bg-transparent hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Understand the Approval Process
              </a>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-3 text-left">
              <div className="bg-[#0B2924]/60 border border-[#234c41] p-3 rounded">
                <div className="text-lg font-bold text-amber-400">15 Colleges</div>
                <div className="text-[11px] text-gray-300">Multi-Regional Coverage</div>
              </div>
              <div className="bg-[#0B2924]/60 border border-[#234c41] p-3 rounded">
                <div className="text-lg font-bold text-emerald-400">100% Digital</div>
                <div className="text-[11px] text-gray-300">Scrutiny & Evidence Log</div>
              </div>
              <div className="bg-[#0B2924]/60 border border-[#234c41] p-3 rounded">
                <div className="text-lg font-bold text-blue-400">Deterministic</div>
                <div className="text-[11px] text-gray-300">CEI Regulatory Checks</div>
              </div>
            </div>
          </div>

          {/* Hero Interactive Quick Tracking Card */}
          <div className="lg:col-span-5" id="tracking-section">
            <div className="bg-white text-neutral-900 p-6 rounded-lg shadow-xl border border-neutral-200">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-neutral-900">Quick Application Tracking</h3>
              </div>
              <p className="text-xs text-neutral-600 mb-4">
                Enter your unique Application Reference Number to verify stage status:
              </p>

              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Application Number
                  </label>
                  <input
                    type="text"
                    value={trackAppNo}
                    onChange={(e) => setTrackAppNo(e.target.value)}
                    placeholder="e.g., APP-2026-101 or APP-2026-105"
                    className="w-full p-2.5 border border-neutral-300 rounded text-xs font-mono focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Sample IDs: <code className="bg-neutral-100 px-1 py-0.5 rounded cursor-pointer" onClick={() => setTrackAppNo('APP-2026-101')}>APP-2026-101</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded cursor-pointer" onClick={() => setTrackAppNo('APP-2026-103')}>APP-2026-103</code>, <code className="bg-neutral-100 px-1 py-0.5 rounded cursor-pointer" onClick={() => setTrackAppNo('APP-2026-105')}>APP-2026-105</code>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#123B32] hover:bg-[#0B2924] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="w-4 h-4" /> Check Status
                </button>
              </form>

              {trackResult && (
                <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 animate-fadeIn">
                  <div className="font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Record
                  </div>
                  <p className="text-[11px] leading-relaxed">{trackResult}</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-2 text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Login to view complete records <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Access Services */}
      <section id="services" className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Quick Access Services
          </h2>
          <p className="text-xs text-neutral-600 mt-1">
            Access statutory submission services, compliance registers, and public regulatory directories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((item, idx) => (
            <div
              key={idx}
              onClick={item.action}
              className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded bg-neutral-100 group-hover:bg-emerald-50 transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-emerald-800 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Access Service</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Approval Process Overview (10-Step Timeline) */}
      <section id="approval-process" className="py-12 px-4 md:px-8 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Statutory Workflow Architecture
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
              The 10-Step Institutional Approval Lifecycle
            </h2>
            <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
              Transparent, accountable lifecycle defined under the AICTE Approval Process Handbook (APH). Actual workflow progression depends on the application category and statutory rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {workflowSteps.map((ws) => (
              <div
                key={ws.step}
                className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-emerald-600 hover:shadow-sm transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-7 h-7 rounded-full bg-[#123B32] text-white font-bold flex items-center justify-center text-xs mb-2.5">
                    {ws.step}
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900">{ws.title}</h4>
                  <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{ws.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login?redirect=/institution/applications/new')}
              className="ux4g-btn ux4g-btn-primary ux4g-btn-m bg-[#123B32] text-white hover:bg-[#0B2924]"
            >
              Start an Application Now
            </button>
          </div>
        </div>
      </section>

      {/* 6. Portal Capabilities */}
      <section id="features" className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Integrated Technical Innovations
          </h2>
          <p className="text-xs text-neutral-600 mt-1">
            Transforming statutory regulation from disconnected checklists into an explainable, auditable ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portalFeatures.map((feat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex items-start gap-3.5">
              <div className="p-2 rounded bg-neutral-100 flex-shrink-0 mt-0.5">{feat.icon}</div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900">{feat.title}</h3>
                <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Notices & Circulars */}
      <section id="notices" className="py-12 px-4 md:px-8 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Official Notices & Circulars</h2>
              <p className="text-xs text-neutral-600 mt-0.5">Statutory notifications published by AICTE Bureau</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 border border-neutral-200 self-start sm:self-auto">
              Regulatory Baseline: APH 2026-27 v2.4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notices.map((n) => (
              <div key={n.id} className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-white transition-all">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {n.category}
                  </span>
                  <span>{n.date}</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900">{n.title}</h4>
                <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Help & FAQs */}
      <section id="faq" className="py-12 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-neutral-600 mt-1">
            Guidance for institutional representatives and stakeholders.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left font-semibold text-xs text-neutral-900 flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <span>{f.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Contact & Support */}
      <section id="contact" className="py-10 px-4 md:px-8 bg-neutral-100 border-t border-neutral-200 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-bold text-neutral-900 mb-2">Central Headquarters</h4>
            <div className="space-y-1 text-neutral-600 leading-relaxed">
              <p className="flex items-start gap-1.5"><MapPin className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" /> All India Council for Technical Education (AICTE)</p>
              <p className="pl-5">Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070</p>
              <p className="flex items-center gap-1.5 pl-0.5 pt-1"><Phone className="w-3.5 h-3.5 text-emerald-800" /> +91-11-29581000 / 29581050</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 mb-2">Regional Offices Network</h4>
            <p className="text-neutral-600 leading-relaxed mb-1">
              Central (Bhopal), Western (Mumbai), Northern (Kanpur), North-West (Chandigarh), Eastern (Kolkata), Southern (Chennai), South-Central (Hyderabad), South-West (Bengaluru).
            </p>
            <p className="text-[11px] text-emerald-800 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/login')}>
              View Regional Management Workspaces &rarr;
            </p>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 mb-2">Portal Technical Helpdesk</h4>
            <div className="space-y-1 text-neutral-600">
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-800" /> aicte-helpdesk@aicte-india.org</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-800" /> Toll Free: 1800-11-2233 (09:30 AM to 05:30 PM)</p>
              <p className="text-[10px] text-neutral-500 pt-1">SIH26262 Prototype — Verified for Smart India Hackathon Judging</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Government Footer */}
      <footer className="w-full bg-[#0B2924] text-[#DFE6E2] py-6 px-4 md:px-8 border-t border-[#173830] text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white">AICTE Regulatory & Institutional Compliance Portal</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Ministry of Education, Government of India • SIH26262 Prototype</div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#c1ecde]">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <span>•</span>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <span>•</span>
            <a href="#faq" className="hover:text-white transition-colors">Help</a>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/login')}>Login</span>
            <span>•</span>
            <span className="text-gray-400">Privacy Policy</span>
            <span>•</span>
            <span className="text-gray-400">Terms of Use</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-gray-400">
          This digital portal is a demonstration prototype developed for Smart India Hackathon (SIH26262). No live official statutory approvals or commitments are executed.
        </div>
      </footer>
    </div>
  );
};
