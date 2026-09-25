

interface AutoRejectionEmailProps {
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  bookingUrl: string;
  companyLabel?: string;
}

export function AutoRejectionEmailHtml({
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  bookingUrl,
  companyLabel = 'Company Pickleball',
}: AutoRejectionEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Court Slot Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #475569; padding: 24px 32px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">COURT SLOT UPDATE</h1>
      <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">Notification Regarding Request ${reservationId}</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">Slot Granted to Another Applicant</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hi <strong>${employeeName}</strong>,<br>
        Thank you for your interest in reserving <strong>${courtName}</strong> for <strong>${reservationDate} (${slotTime})</strong>.
      </p>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Another pending request for this specific court and time slot was approved by Facilities Admin. As a result, your request (${reservationId}) has been automatically closed.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; font-weight: 500;">
          Your booking quota is now restored! You are free to reserve another available court or date.
        </p>
        <a href="${bookingUrl}" style="background-color: #15803d; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Browse Available Slots
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
      © ${companyLabel} • Timezone: Asia/Manila (PHT, UTC+8)
    </div>
  </div>
</body>
</html>
  `.trim();
}
