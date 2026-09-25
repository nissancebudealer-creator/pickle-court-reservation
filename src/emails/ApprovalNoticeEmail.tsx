import React from 'react';

interface ApprovalNoticeEmailProps {
  employeeName: string;
  reservationId: string;
  courtName: string;
  courtLocation: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
}

export function ApprovalNoticeEmailHtml({
  employeeName,
  reservationId,
  courtName,
  courtLocation,
  reservationDate,
  slotTime,
  teammates,
}: ApprovalNoticeEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Court Reservation Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #16a34a; padding: 24px 32px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">COURT RESERVATION CONFIRMED</h1>
      <p style="color: #dcfce7; margin: 4px 0 0 0; font-size: 13px;">Get Ready to Play!</p>
    </div>
    
    <div style="padding: 32px;">
      <div style="display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
        ✓ Approved & Confirmed
      </div>
      
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">Hi ${employeeName}, your court is locked in!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Facilities management has approved your booking. Here are your reservation details:
      </p>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #166534; width: 140px; font-weight: 500;">Ticket ID:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #14532d;">${reservationId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534; font-weight: 500;">Court:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #14532d;">${courtName} (${courtLocation})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534; font-weight: 500;">Date & Time:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #14532d;">${reservationDate} • ${slotTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534; font-weight: 500;">Teammates:</td>
            <td style="padding: 6px 0; color: #14532d;">${teammates}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #0f172a;">Court Reminders:</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #475569; line-height: 1.6;">
          <li>Please wear appropriate non-marking sports shoes.</li>
          <li>Arrive 5-10 minutes prior to your reserved slot.</li>
          <li>If you need to cancel, please do so early so colleagues can utilize the court.</li>
        </ul>
      </div>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
      © Company Pickleball • Timezone: Asia/Manila (PHT, UTC+8)
    </div>
  </div>
</body>
</html>
  `.trim();
}
