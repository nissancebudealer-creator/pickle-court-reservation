import React from 'react';

interface CancellationEmailProps {
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  cancelledBy: string;
  reason?: string | null;
  isRescheduled?: boolean;
  newDetails?: {
    courtName: string;
    reservationDate: string;
    slotTime: string;
  };
}

export function CancellationEmailHtml({
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  cancelledBy,
  reason,
  isRescheduled,
  newDetails,
}: CancellationEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${isRescheduled ? 'Court Reservation Rescheduled' : 'Court Reservation Cancelled'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: ${isRescheduled ? '#2563eb' : '#dc2626'}; padding: 24px 32px; text-align: left;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
        ${isRescheduled ? 'RESERVATION RESCHEDULED' : 'RESERVATION CANCELLED'}
      </h1>
      <p style="color: #ffffff; opacity: 0.85; margin: 4px 0 0 0; font-size: 13px;">Ticket ${reservationId}</p>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0;">Hi ${employeeName},</h2>
      
      ${
        isRescheduled && newDetails
          ? `
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Your court reservation has been rescheduled by Facilities Administration.
        </p>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px; margin: 24px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">Updated Reservation Details:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #1e40af; width: 120px;">New Court:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #172554;">${newDetails.courtName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #1e40af;">New Date & Time:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #172554;">${newDetails.reservationDate} • ${newDetails.slotTime}</td>
            </tr>
          </table>
        </div>
      `
          : `
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Your reservation for <strong>${courtName}</strong> on <strong>${reservationDate} at ${slotTime}</strong> has been cancelled (${cancelledBy}).
        </p>

        ${
          reason
            ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13px; color: #991b1b;">
            <strong>Reason:</strong> ${reason}
          </div>`
            : ''
        }

        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Your active reservation limit has been released. You can now book another slot when ready.
        </p>
      `
      }
    </div>

    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
      © Company Pickleball • Timezone: Asia/Manila (PHT, UTC+8)
    </div>
  </div>
</body>
</html>
  `.trim();
}
