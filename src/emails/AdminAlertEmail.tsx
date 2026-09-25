import React from 'react';

interface AdminAlertEmailProps {
  employeeName: string;
  employeeEmail: string;
  department: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
  reviewUrl: string;
}

export function AdminAlertEmailHtml({
  employeeName,
  employeeEmail,
  department,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  teammates,
  reviewUrl,
}: AdminAlertEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Court Reservation Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">FACILITIES ADMIN ALERT</h1>
      <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Action Required: New Slot Request</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">New Reservation Awaiting Review</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        A new court booking request has been submitted by <strong>${employeeName}</strong> (${department}).
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px;">Request ID:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${reservationId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Requester:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${employeeName} (${employeeEmail})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Department:</td>
            <td style="padding: 6px 0; color: #0f172a;">${department}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Court:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${courtName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Requested Slot:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${reservationDate} • ${slotTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Teammates:</td>
            <td style="padding: 6px 0; color: #0f172a;">${teammates}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${reviewUrl}" style="background-color: #15803d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          Open Admin Dashboard
        </a>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #64748b;">
        Approving this request will automatically reject conflicting pending requests for this slot.
      </p>
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
      © Company Pickleball Admin Portal
    </div>
  </div>
</body>
</html>
  `.trim();
}
