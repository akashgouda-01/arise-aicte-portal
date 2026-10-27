import { ComplianceRequirement, ComplianceStatus, EvidenceDocument, UserRole } from '../types';

export interface CEIFinding {
  id: string;
  requirementCode: string;
  requirementTitle: string;
  evidenceId?: string;
  evidenceName?: string;
  status: ComplianceStatus;
  issueType: 'MISSING_EVIDENCE' | 'DOCUMENT_EXPIRED' | 'EXPIRING_SOON' | 'NEEDS_VERIFICATION' | 'CADRE_DEFICIENCY' | 'COMPLIANT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  explanation: {
    whatWasDetected: string;
    requirementReference: string;
    evidenceChecked: string;
    whyAttentionRequired: string;
    whoMustActNext: UserRole;
    recommendedAction: string;
  };
}

export class CEIEngine {
  /**
   * Run deterministic requirement-centered compliance evaluation
   */
  static evaluateCompliance(
    requirements: ComplianceRequirement[],
    evidenceList: EvidenceDocument[]
  ): CEIFinding[] {
    const findings: CEIFinding[] = [];
    const now = new Date();

    for (const req of requirements) {
      const linkedEvidence = evidenceList.filter((e) => e.requirementId === req.id);

      if (linkedEvidence.length === 0) {
        // Missing Evidence
        findings.push({
          id: `cei_missing_${req.id}`,
          requirementCode: req.code,
          requirementTitle: req.title,
          status: 'MISSING',
          issueType: 'MISSING_EVIDENCE',
          severity: 'CRITICAL',
          explanation: {
            whatWasDetected: `No supporting document or evidence has been linked to mandatory requirement ${req.code}.`,
            requirementReference: `${req.clauseReference} — ${req.title}`,
            evidenceChecked: 'No file uploaded in registry.',
            whyAttentionRequired: 'Statutory scrutiny cannot proceed without prescribed verification documents.',
            whoMustActNext: 'INSTITUTION',
            recommendedAction: `Upload valid ${req.evidenceType} with digital signature.`,
          },
        });
        continue;
      }

      for (const evi of linkedEvidence) {
        // Check 1: Expired
        if (evi.expiryDate) {
          const expDate = new Date(evi.expiryDate);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

          if (diffDays <= 0) {
            findings.push({
              id: `cei_exp_${evi.id}`,
              requirementCode: req.code,
              requirementTitle: req.title,
              evidenceId: evi.id,
              evidenceName: evi.fileName,
              status: 'EXPIRED',
              issueType: 'DOCUMENT_EXPIRED',
              severity: 'CRITICAL',
              explanation: {
                whatWasDetected: `Uploaded document expired ${Math.abs(diffDays)} days ago on ${evi.expiryDate}.`,
                requirementReference: `${req.clauseReference} — ${req.title}`,
                evidenceChecked: `${evi.fileName} (${evi.documentType})`,
                whyAttentionRequired: 'Expired documents fail statutory validity and nullify approval prerequisites.',
                whoMustActNext: 'INSTITUTION',
                recommendedAction: 'Obtain current renewed certificate from competent authority and submit renewal docket.',
              },
            });
            continue;
          }

          // Check 2: Expiring Soon
          if (diffDays <= 30) {
            findings.push({
              id: `cei_exp_soon_${evi.id}`,
              requirementCode: req.code,
              requirementTitle: req.title,
              evidenceId: evi.id,
              evidenceName: evi.fileName,
              status: 'EXPIRING',
              issueType: 'EXPIRING_SOON',
              severity: 'HIGH',
              explanation: {
                whatWasDetected: `Document expires in ${diffDays} days (${evi.expiryDate}). Renewal evidence has not yet been verified.`,
                requirementReference: `${req.clauseReference} — ${req.title}`,
                evidenceChecked: `${evi.fileName} (Issued: ${evi.issueDate || 'N/A'})`,
                whyAttentionRequired: 'Approval handbook requires minimum valid duration prior to academic session start.',
                whoMustActNext: 'INSTITUTION',
                recommendedAction: 'Submit renewal acknowledgement challan or advance extension certificate.',
              },
            });
            continue;
          }
        }

        // Check 3: Automated check failed or flagged
        if (!evi.automatedCheck.passed && evi.status !== 'VERIFIED') {
          findings.push({
            id: `cei_auto_${evi.id}`,
            requirementCode: req.code,
            requirementTitle: req.title,
            evidenceId: evi.id,
            evidenceName: evi.fileName,
            status: 'NEEDS_REVIEW',
            issueType: 'CADRE_DEFICIENCY',
            severity: 'HIGH',
            explanation: {
              whatWasDetected: evi.automatedCheck.message,
              requirementReference: `${req.clauseReference} — ${req.title}`,
              evidenceChecked: `${evi.fileName} (Rule: ${evi.automatedCheck.ruleCode})`,
              whyAttentionRequired: 'Automated rule verification detected potential ratio or field shortfall.',
              whoMustActNext: 'PROCESSING_OFFICER',
              recommendedAction: evi.automatedCheck.suggestedAction,
            },
          });
          continue;
        }

        // Check 4: Unverified submission
        if (evi.status === 'RECEIVED' || evi.status === 'NEEDS_REVIEW') {
          findings.push({
            id: `cei_unver_${evi.id}`,
            requirementCode: req.code,
            requirementTitle: req.title,
            evidenceId: evi.id,
            evidenceName: evi.fileName,
            status: 'NEEDS_REVIEW',
            issueType: 'NEEDS_VERIFICATION',
            severity: 'MEDIUM',
            explanation: {
              whatWasDetected: 'Evidence has been received into portal storage but has not yet undergone formal scrutiny review.',
              requirementReference: `${req.clauseReference} — ${req.title}`,
              evidenceChecked: `${evi.fileName} (Uploaded: ${evi.uploadedAt})`,
              whyAttentionRequired: 'Document upload alone does not constitute verified institutional compliance.',
              whoMustActNext: req.verificationRequiredBy,
              recommendedAction: 'Examine document credentials, verify digital signature, and record formal verification status.',
            },
          });
          continue;
        }

        // Case 5: Fully Verified
        if (evi.status === 'VERIFIED') {
          findings.push({
            id: `cei_ver_${evi.id}`,
            requirementCode: req.code,
            requirementTitle: req.title,
            evidenceId: evi.id,
            evidenceName: evi.fileName,
            status: 'VERIFIED',
            issueType: 'COMPLIANT',
            severity: 'INFO',
            explanation: {
              whatWasDetected: 'Evidence fully verified against statutory norms by authorized scrutiny officer.',
              requirementReference: `${req.clauseReference} — ${req.title}`,
              evidenceChecked: `${evi.fileName} (Verified by: ${evi.verifiedBy} on ${evi.verifiedAt})`,
              whyAttentionRequired: 'Statutory condition fulfilled. Maintained in institutional compliance register.',
              whoMustActNext: 'PROCESSING_OFFICER',
              recommendedAction: 'No action required. Record permanently logged in audit trail.',
            },
          });
        }
      }
    }

    return findings;
  }
}
