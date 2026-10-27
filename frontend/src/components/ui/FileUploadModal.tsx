import React, { useState, useRef, DragEvent } from 'react';
import {
  UploadCloud,
  FileCheck2,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { api } from '../../api/client';
import { EvidenceDocument, UserRole } from '../../types';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doc: EvidenceDocument) => void;
  applicationId?: string;
  institutionId?: string;
  requirementId?: string;
  requirementTitle?: string;
  requirementCode?: string;
  clauseReference?: string;
  existingDoc?: EvidenceDocument;
  title?: string;
  documentType?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  actorName?: string;
  actorRole?: UserRole;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  applicationId = 'app_101',
  institutionId = 'inst_01',
  requirementId = 'req_02',
  requirementTitle = 'Compliance Evidence Document',
  requirementCode = 'APH-CL-NORM',
  clauseReference,
  existingDoc,
  title,
  documentType = 'Statutory Evidence',
  allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc'],
  maxSizeMB = 15,
  actorName = 'Prof. Anand Verma',
  actorRole = 'INSTITUTION',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [institutionNotes, setInstitutionNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<EvidenceDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setIsDragging(false);
    setIssueDate('');
    setExpiryDate('');
    setInstitutionNotes('');
    setIsUploading(false);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (selectedFile: File): string | null => {
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `Unsupported file format (${ext}). Allowed formats: ${allowedExtensions.join(', ')}`;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      return `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the statutory limit of ${maxSizeMB} MB.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    const error = validateFile(selectedFile);
    if (error) {
      setErrorMessage(error);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const attachMockDoc = () => {
    let mockFileName = '01_Land_Title_30Year_Registered_Lease_Deed.pdf';
    let defaultIssue = '2020-08-14';
    let defaultExpiry = '2050-08-13';

    const reqLower = ((requirementTitle || '') + ' ' + (requirementCode || '')).toLowerCase();
    if (reqLower.includes('fire')) {
      mockFileName = '02_State_Fire_Safety_Clearance_NOC_Certificate.pdf';
      defaultIssue = '2026-01-15';
      defaultExpiry = '2027-01-14';
    } else if (reqLower.includes('building') || reqLower.includes('architect') || reqLower.includes('infrastructure')) {
      mockFileName = '03_Architectural_Building_Safety_Plan_Approval.pdf';
      defaultIssue = '2021-11-18';
      defaultExpiry = '2031-11-17';
    } else if (reqLower.includes('faculty') || reqLower.includes('cadre') || reqLower.includes('biometric')) {
      mockFileName = '04_AICTE_Faculty_Cadre_Roster_Biometric_Summary.pdf';
      defaultIssue = '2026-01-10';
      defaultExpiry = '2027-06-30';
    } else if (reqLower.includes('bank') || reqLower.includes('guarantee') || reqLower.includes('fdr') || reqLower.includes('endowment')) {
      mockFileName = '05_Bank_Guarantee_Endowment_FDR_Receipt.pdf';
      defaultIssue = '2026-01-05';
      defaultExpiry = '2036-01-05';
    } else if (reqLower.includes('trust') || reqLower.includes('society') || reqLower.includes('affiliation')) {
      mockFileName = '06_Trust_Society_Registration_and_Anna_University_Affiliation_Order.pdf';
      defaultIssue = '2026-01-12';
      defaultExpiry = '2027-05-31';
    } else if (reqLower.includes('resolution') || reqLower.includes('board')) {
      mockFileName = '07_Governing_Board_Resolution.pdf';
      defaultIssue = '2026-01-10';
      defaultExpiry = '';
    }

    const dummyPdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 14 Tf\n50 720 Td\n(AICTE STATUTORY MOCK VERIFICATION DOCUMENT: ${mockFileName}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000118 00000 n\n0000000200 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF`;

    const mockFile = new File([dummyPdfContent], mockFileName, { type: 'application/pdf' });
    setFile(mockFile);
    setIssueDate(defaultIssue);
    setExpiryDate(defaultExpiry);
    setInstitutionNotes(`Official statutory record submitted from mock-documents/ repository. Meets AICTE APH 2026-27 compliance criteria.`);
    setErrorMessage(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setErrorMessage('Please select a valid document to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('institutionId', institutionId);
    formData.append('requirementId', requirementId);
    formData.append('documentType', documentType);
    formData.append('uploadedBy', actorName);
    formData.append('actorRole', actorRole);
    if (issueDate) formData.append('issueDate', issueDate);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (institutionNotes) formData.append('verificationNotes', institutionNotes);
    if (existingDoc?.id) formData.append('previousVersionId', existingDoc.id);

    try {
      setUploadProgress(60);
      const res = await api.uploadDocument(formData);
      setUploadProgress(100);
      const uploadedDoc: EvidenceDocument = (res as any)?.document || (res as any)?.data || (res as any);
      if (!uploadedDoc || typeof uploadedDoc !== 'object') {
        throw new Error('Server did not return a valid document record.');
      }
      setSuccessResult(uploadedDoc);
      if (typeof onSuccess === 'function') {
        onSuccess(uploadedDoc);
      }
    } catch (err: any) {
      setIsUploading(false);
      setErrorMessage(err.message || 'File upload failed. Please verify the document and retry.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-[#123B32]" />
          <span>{title || (existingDoc ? 'Replace Statutory Evidence' : 'Upload Compliance Evidence')}</span>
        </div>
      }
      subtitle={
        <span className="text-xs text-[#52635D]">
          {requirementCode ? `[${requirementCode}] ` : ''}
          {requirementTitle}
        </span>
      }
      maxWidth="lg"
      footer={
        successResult ? (
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={handleClose}>
              Done & Return to Workspace
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-xs text-[#61716B]">
              <Lock className="w-3.5 h-3.5 text-[#123B32] mr-1.5" />
              <span>SHA-256 Hashed & Encrypted in Private AICTE Vault</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadSubmit}
                disabled={!file || isUploading}
                isLoading={isUploading}
              >
                {existingDoc ? 'Submit Replacement' : 'Secure Upload & Record'}
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* Statutory context banner */}
        {clauseReference && (
          <div className="bg-[#F0F5F2] border border-[#CDE0D7] p-2.5 rounded text-xs text-[#172B26] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#123B32]">APH Mandate:</span> {clauseReference}
            </div>
            <span className="text-[11px] bg-white text-[#123B32] border border-[#CDE0D7] px-2 py-0.5 rounded font-mono font-medium">
              Max {maxSizeMB} MB
            </span>
          </div>
        )}

        {/* Existing document version replacement notice */}
        {existingDoc && (
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-xs text-amber-900 flex items-start space-x-2">
            <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Version Replacement Action</p>
              <p className="text-[11px] text-amber-800">
                Currently registered document:{' '}
                <span className="font-mono">{existingDoc.fileName}</span> (v{existingDoc.version || 1}).
                Uploading a replacement will preserve audit history and assign v{(existingDoc.version || 1) + 1}.
              </p>
            </div>
          </div>
        )}

        {/* Success View */}
        {successResult ? (
          <div className="p-6 text-center space-y-3 bg-[#F0F5F2] border border-[#A4CDBB] rounded-lg">
            <CheckCircle2 className="w-12 h-12 text-[#123B32] mx-auto animate-bounce" />
            <div>
              <h4 className="text-base font-semibold text-[#123B32]">Document Uploaded & Verified</h4>
              <p className="text-xs text-[#52635D] mt-1">
                Successfully recorded in AICTE National Registry with tamper-proof SHA-256 hash.
              </p>
            </div>

            <div className="bg-white p-3 rounded border border-[#DFE6E2] text-left text-xs space-y-1 font-mono text-[#172B26]">
              <div className="flex justify-between">
                <span className="text-gray-500">File Name:</span>
                <span className="font-semibold truncate max-w-[280px]">{successResult.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Document ID:</span>
                <span>{successResult.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version:</span>
                <span className="text-[#123B32] font-semibold">v{successResult.version || 1} (Active Current)</span>
              </div>
              {successResult.checksum && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SHA-256 Digest:</span>
                  <span className="truncate max-w-[240px] text-gray-700">{successResult.checksum}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Review Status:</span>
                <span className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium">
                  {successResult.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING SCRUTINY'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* File drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#123B32] bg-[#E8EFEA]'
                  : file
                  ? 'border-[#A4CDBB] bg-[#F7FAF8]'
                  : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#123B32] hover:bg-[#F0F5F2]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedExtensions.join(',')}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center justify-between p-3 bg-white border border-[#DFE6E2] rounded-md text-left">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileCheck2 className="w-8 h-8 text-[#123B32] flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#172B26] truncate">{file.name}</p>
                      <p className="text-[11px] text-[#61716B]">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#E8EFEA] text-[#123B32] mx-auto flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#123B32]">Click to browse</span>
                    <span className="text-xs text-gray-500"> or drag and drop your file here</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    PDF, PNG, JPG, JPEG, DOC, DOCX up to {maxSizeMB} MB
                  </p>
                </div>
              )}
            </div>

            {/* Quick-Attach Sample Mock Document from mock-documents/ */}
            {!file && (
              <div className="flex items-center justify-between p-2 bg-[#F0F5F2] border border-[#CDE0D7] rounded text-xs">
                <span className="text-[11px] text-[#52635D]">Official statutory file ready in mock repository:</span>
                <button
                  type="button"
                  onClick={attachMockDoc}
                  className="px-2.5 py-1 bg-[#123B32] hover:bg-[#0B2924] text-white font-bold rounded text-[11px] shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <span>⚡ Quick-Attach Mock Document</span>
                </button>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading and verifying checksum...</span>
                  <span className="font-mono font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#123B32] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metadata Fields: Issue Date & Expiry Date */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Document Issue Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#123B32] focus:border-[#123B32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Validity / Expiry Date (if applicable)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#123B32] focus:border-[#123B32]"
                  />
                </div>
              </div>
            </div>

            {/* Institutional Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Submission Notes / Clarification Justification
              </label>
              <textarea
                rows={2}
                value={institutionNotes}
                onChange={(e) => setInstitutionNotes(e.target.value)}
                placeholder="Provide reference numbers, issuing authority details, or responses to scrutiny observations..."
                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#123B32] focus:border-[#123B32]"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
