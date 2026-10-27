import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDir = __dirname;

const pdfs = [
  { name: '01_Land_Title_30Year_Registered_Lease_Deed.pdf', title: 'Perpetual 30-Year Lease Deed (Guindy, Chennai - 12,500 sq.m)' },
  { name: '02_State_Fire_Safety_Clearance_NOC_Certificate.pdf', title: 'Tamil Nadu Fire and Rescue Services NOC (Valid till Jan 2027)' },
  { name: '03_Architectural_Building_Safety_Plan_Approval.pdf', title: 'CMDA Institutional Building Plan Sanction (24,500 sq.m)' },
  { name: '04_AICTE_Faculty_Cadre_Roster_Biometric_Summary.pdf', title: 'AICTE Cadre Ratio 1:15 Faculty Roster with Aadhaar Biometrics' },
  { name: '05_Bank_Guarantee_Endowment_FDR_Receipt.pdf', title: 'SBI Joint Fixed Deposit Receipt Rs 1.00 Crore (Endowment Fund)' },
  { name: '06_Trust_Society_Registration_and_Anna_University_Affiliation_Order.pdf', title: 'Anna University Affiliation Order & Trust Registration Deed' },
  { name: '07_Governing_Board_Resolution.pdf', title: 'Governing Board Resolution No 04 for AICTE Approval 2026-27' },
  { name: '08_Form_EVC_Official_Inspection_Report.pdf', title: 'Form-EVC Official Expert Visit Committee On-Site Inspection Report' },
];

function createSimplePdf(title) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 18 Tf
50 720 Td
(ALL INDIA COUNCIL FOR TECHNICAL EDUCATION) Tj
0 -30 Td
/F1 14 Tf
(OFFICIAL STATUTORY DOCUMENT VERIFICATION) Tj
0 -30 Td
/F1 11 Tf
(${title}) Tj
0 -25 Td
(Institution: Chennai Institute of Technology & Engineering - CITE Chennai) Tj
0 -20 Td
(Permanent Institute ID: 1-72635412 | Academic Year: 2026-27) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000118 00000 n 
0000000234 00000 n 
0000000546 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
620
%%EOF
`;
  return Buffer.from(content, 'utf-8');
}

pdfs.forEach(p => {
  const filePath = path.join(mockDir, p.name);
  fs.writeFileSync(filePath, createSimplePdf(p.title));
  console.log('Created PDF:', p.name);
});
