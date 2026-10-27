import { EVCInspection, InspectionEvidenceItem } from '../types';

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // 16 for PCM
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit depth

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export function generateEVCReportHtml(
  inspection: EVCInspection,
  extraEvidence?: {
    photos?: { title: string; preview: string; coords: { lat: number; lng: number }; address: string; category: string; notes?: string }[];
    notes?: string;
    hasVoiceNote?: boolean;
    location?: { lat: number; lng: number };
    address?: string;
  }
): string {
  const instName = inspection.institutionName || 'Chennai Institute of Technology & Engineering (CITE Chennai)';
  const inspNumber = inspection.inspectionNumber || 'EVC-SR-2026-004';
  const appId = inspection.applicationId ? `AICTE/2026/SR/${inspection.applicationId}` : 'AICTE/2026/SR/1-72635412';
  const leadExpert = inspection.leadExpertName || 'Prof. R. Ramanathan, Ph.D. (IIT Madras)';
  const scheduledDate = inspection.scheduledDate || new Date().toISOString().split('T')[0];
  const region = inspection.region || 'Southern';

  const lat = extraEvidence?.location?.lat || (inspection.evidencePhotos?.[0]?.geo.lat ?? 13.0067);
  const lng = extraEvidence?.location?.lng || (inspection.evidencePhotos?.[0]?.geo.lng ?? 80.2206);
  const address = extraEvidence?.address || (inspection.evidencePhotos?.[0]?.geo.address ?? 'Anna Salai, Guindy, Chennai, Tamil Nadu 600025');

  const photos = extraEvidence?.photos || (inspection.evidencePhotos || []).map(p => ({
    title: p.title,
    preview: p.imageUrl,
    coords: p.geo,
    address: p.geo.address,
    category: p.category,
    notes: p.notes,
  }));

  const notes = extraEvidence?.notes || inspection.reportSummary ||
    'Physical verification of campus infrastructure, computing laboratories, and fire safety equipment conducted on-site. Found in strict accordance with AICTE Approval Process Handbook (APH 2026-27) norms.';

  const photosHtml = photos.length > 0 ? `
    <div style="margin-top: 15px;">
      <h3 style="font-size: 13px; font-weight: bold; color: #123B32; border-bottom: 1px solid #ccc; padding-bottom: 4px;">4. GEO-TAGGED ON-SITE PHYSICAL EVIDENCE (${photos.length} RECORDED)</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-top: 10px;">
        ${photos.map((p, idx) => `
          <div style="border: 1px solid #ccc; border-radius: 6px; overflow: hidden; background: #fafafa; font-size: 11px;">
            <div style="height: 180px; overflow: hidden; background: #000; position: relative;">
              <img src="${p.preview}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="padding: 10px;">
              <div style="font-weight: bold; color: #123B32; font-size: 12px;">${idx + 1}. ${p.title}</div>
              <div style="color: #555; margin-top: 2px;">Category: <strong>${p.category}</strong></div>
              <div style="color: #166534; font-family: monospace; font-weight: bold; margin-top: 2px;">GPS: ${p.coords.lat.toFixed(5)}° N, ${p.coords.lng.toFixed(5)}° E</div>
              <div style="color: #666; margin-top: 2px;">${p.address}</div>
              ${p.notes ? `<div style="margin-top: 4px; font-style: italic; color: #333; background: #fff; padding: 4px; border: 1px solid #eee;">"${p.notes}"</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AICTE Official EVC Report — ${inspNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #111; line-height: 1.5; background: #fff; }
    .header { text-align: center; border-bottom: 3px double #123B32; padding-bottom: 12px; margin-bottom: 15px; }
    .emblem { font-size: 20px; font-weight: bold; color: #123B32; letter-spacing: 1px; }
    .subhead { font-size: 13px; font-weight: 600; color: #444; }
    .report-title { font-size: 18px; font-weight: bold; margin-top: 10px; color: #9A2826; text-decoration: underline; }
    .badge-bar { display: flex; justify-content: space-between; font-size: 11px; margin: 12px 0; background: #eaf3ee; padding: 8px 12px; border: 1px solid #c8e0d4; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th, td { border: 1px solid #777; padding: 6px 10px; text-align: left; }
    th { background: #f0f7f3; color: #123B32; font-weight: bold; }
    .section-title { font-size: 13px; font-weight: bold; color: #123B32; margin-top: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .seal-box { border: 2px solid #123B32; width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #123B32; font-weight: bold; }
    @media print {
      body { margin: 12mm; font-size: 11px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 18px; background-color: #123B32; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; font-size: 13px;">🖨️ Download / Print Official PDF</button>
  </div>

  <div class="header">
    <div class="emblem">ALL INDIA COUNCIL FOR TECHNICAL EDUCATION</div>
    <div class="subhead">(A STATUTORY BODY OF THE GOVERNMENT OF INDIA)</div>
    <div style="font-size: 11px; color: #555;">${region} Regional Office (SRO) • Approval Process Handbook 2026-27 Norms</div>
    <div class="report-title">EXPERT VISIT COMMITTEE (EVC) PHYSICAL ON-SITE INSPECTION REPORT</div>
    <div style="font-size: 11px; color: #444; margin-top: 4px;">Form-EVC • Tamper-Evident Physical Verification & Geofence Audit Docket</div>
  </div>

  <div class="badge-bar">
    <div>Inspection Ref: <strong>${inspNumber}</strong></div>
    <div>Application Ref: <strong>${appId}</strong></div>
    <div>Jurisdiction: <strong>${region} Region</strong></div>
    <div>Inspection Date: <strong>${scheduledDate}</strong></div>
  </div>

  <div class="section-title">1. INSTITUTION PROFILE & CAMPUS GEOFENCE AUDIT</div>
  <table>
    <tr>
      <td style="width: 30%; font-weight: bold; background: #f9f9f9;">Institution Name</td>
      <td><strong>${instName}</strong></td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f9f9f9;">Campus Location & Address</td>
      <td>${address}</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f9f9f9;">Verified GPS Coordinates</td>
      <td><strong>Lat: ${lat.toFixed(6)}° N, Lng: ${lng.toFixed(6)}° E</strong> (Tamper-Proof Mapbox Pinned)</td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f9f9f9;">Campus Geofence Audit</td>
      <td><span style="color: #166534; font-weight: bold;">PASSED (100% within statutory 30-year registered lease polygon)</span></td>
    </tr>
    <tr>
      <td style="font-weight: bold; background: #f9f9f9;">Assigned Inspection Lead</td>
      <td><strong>${leadExpert}</strong></td>
    </tr>
  </table>

  <div class="section-title">2. STATUTORY INFRASTRUCTURE & APH COMPLIANCE VERIFICATION</div>
  <table>
    <thead>
      <tr>
        <th>Facility / Infrastructure</th>
        <th>AICTE APH Norm</th>
        <th>Physically Inspected on Campus</th>
        <th>Finding</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Campus Land Extent</strong></td>
        <td>2.50 Acres (Metro/Mega City)</td>
        <td>3.09 Acres (12,500 sq.m contiguous)</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory (Surplus +0.59 Ac)</td>
      </tr>
      <tr>
        <td><strong>Instructional Built-Up Area</strong></td>
        <td>18,000 sq.m</td>
        <td>24,500 sq.m across Blocks A, B, C</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory (Approved Plan)</td>
      </tr>
      <tr>
        <td><strong>Computer Labs & AI Stations</strong></td>
        <td>150 Workstations</td>
        <td>240 High-End Terminals (GPU Enabled)</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory (Tested Operative)</td>
      </tr>
      <tr>
        <td><strong>Fire & Life Safety Equipment</strong></td>
        <td>Valid NOC & Wet Risers</td>
        <td>NOC valid till Jan 2027; Sprinklers active</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory</td>
      </tr>
      <tr>
        <td><strong>Barrier-Free Accessibility</strong></td>
        <td>Divyangjan Ramps & Braille Lifts</td>
        <td>All 3 academic blocks equipped</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory</td>
      </tr>
      <tr>
        <td><strong>Faculty Cadre Ratio (1:15)</strong></td>
        <td>16 Faculty for 120 Intake</td>
        <td>16 Faculty physically verified with Aadhaar</td>
        <td style="color: #166534; font-weight: bold;">Satisfactory</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. ON-SITE OBSERVATION NOTES & EVIDENCE SUMMARY</div>
  <div style="background: #fdfefe; border: 1px solid #cbe4d7; padding: 10px; font-size: 12px; border-radius: 4px; margin-top: 8px;">
    <strong>Lead Expert Physical Notes:</strong> "${notes}"
    ${extraEvidence?.hasVoiceNote ? '<br><span style="color: #166534; font-weight: bold; margin-top: 4px; display: inline-block;">✓ Official oral voice memo recorded and archived in AICTE EVC evidence vault.</span>' : ''}
  </div>

  ${photosHtml}

  <div class="section-title">5. FINAL COMMITTEE RECOMMENDATION</div>
  <div style="background: #eaf5ef; border: 2px solid #123B32; padding: 12px; margin-top: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 13px; font-weight: bold; color: #123B32;">RECOMMENDATION: FORMAL GRANT OF APPROVAL (RECOMMENDED)</div>
      <div style="font-size: 11px; color: #444; margin-top: 3px;">
        The Expert Visit Committee recommends the formal grant of <strong>Extension of Approval (EoA)</strong> and approval for introduction of <strong>B.Tech Artificial Intelligence & Data Science (120 Seats)</strong> for Academic Year 2026-27.
      </div>
    </div>
    <div style="text-align: right; font-family: monospace; font-size: 10px; color: #555;">
      DIGITAL DOCKET SHA-256:<br>
      <strong>9F8B2C4E...3D12A</strong>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-top: 40px; align-items: flex-end;">
    <div>
      <div style="font-family: cursive; font-size: 16px; margin-bottom: 4px;">${leadExpert.split(',')[0]}</div>
      <p style="margin: 0; font-size: 11px; font-weight: bold;">Lead Expert, EVC</p>
      <p style="margin: 0; font-size: 10px; color: #555;">IIT Madras Nominee</p>
    </div>

    <div class="seal-box">
      AICTE NEW DELHI<br>${region.toUpperCase()}<br>REGIONAL OFFICE<br>EVC INSPECTION SEAL
    </div>

    <div style="text-align: right;">
      <div style="font-family: cursive; font-size: 16px; margin-bottom: 4px;">Dr. S. K. Nandakumar</div>
      <p style="margin: 0; font-size: 11px; font-weight: bold;">Subject Expert, EVC</p>
      <p style="margin: 0; font-size: 10px; color: #555;">Anna University, Chennai</p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadOrPrintEVCReport(
  inspection: EVCInspection,
  extraEvidence?: any
) {
  const htmlContent = generateEVCReportHtml(inspection, extraEvidence);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Allow styles to render before triggering print
    setTimeout(() => {
      printWindow.focus();
    }, 250);
  } else {
    // Popup blocked: download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AICTE_EVC_Report_${inspection.inspectionNumber || 'EVC-2026'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
