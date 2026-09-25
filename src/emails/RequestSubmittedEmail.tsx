

interface RequestSubmittedEmailProps {
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
  companyLabel?: string;
}

export function RequestSubmittedEmailHtml({
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  teammates,
  companyLabel = 'Company Pickleball',
}: RequestSubmittedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Court Reservation Request Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #15803d; padding: 24px 32px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">${companyLabel.toUpperCase()}</h1>
      <p style="color: #bbf7d0; margin: 4px 0 0 0; font-size: 13px;">Facilities & Court Management</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">Reservation Request Queued</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hi <strong>${employeeName}</strong>,<br>
        Your reservation request has been received and is currently awaiting approval by the Facilities Admin team.
      </p>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Request ID:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${reservationId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Court:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${courtName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Schedule:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${reservationDate} at ${slotTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Teammates:</td>
            <td style="padding: 6px 0; color: #0f172a;">${teammates}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Status:</td>
            <td style="padding: 6px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">PENDING APPROVAL</span></td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
        You will receive another email once your booking has been reviewed. You can check the live status or withdraw your request anytime through your employee dashboard.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
      © ${companyLabel} • Timezone: Asia/Manila (PHT, UTC+8)
    </div>
  </div>
</body>
</html>
  `.trim();
}
