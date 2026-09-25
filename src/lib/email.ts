import { Resend } from 'resend';
import { RequestSubmittedEmailHtml } from '@/emails/RequestSubmittedEmail';
import { AdminAlertEmailHtml } from '@/emails/AdminAlertEmail';
import { ApprovalNoticeEmailHtml } from '@/emails/ApprovalNoticeEmail';
import { AutoRejectionEmailHtml } from '@/emails/AutoRejectionEmail';
import { CancellationEmailHtml } from '@/emails/CancellationEmail';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && resendApiKey !== 're_123456789' ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'Company Pickleball <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'facilities@company.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
// Derive a human-readable brand label from the FROM_EMAIL display name or env, falling back gracefully
const COMPANY_LABEL = process.env.EMAIL_FROM_ADDRESS
  ? (process.env.EMAIL_FROM_ADDRESS.match(/^([^<]+)/) ?? [])[1]?.trim() || 'Company Pickleball'
  : 'Company Pickleball';


export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.info(`[Email Service Simulated] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[Email Service Error]', error);
    return { success: false, error };
  }
}

export async function sendRequestSubmittedNotice({
  employeeEmail,
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  teammates,
}: {
  employeeEmail: string;
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
}) {
  const html = RequestSubmittedEmailHtml({
    employeeName,
    reservationId,
    courtName,
    reservationDate,
    slotTime,
    teammates,
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: employeeEmail,
    subject: `Reservation Request Received: ${reservationId} (${courtName})`,
    html,
  });
}

export async function sendAdminNewRequestNotice({
  employeeName,
  employeeEmail,
  department,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  teammates,
}: {
  employeeName: string;
  employeeEmail: string;
  department: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
}) {
  const html = AdminAlertEmailHtml({
    employeeName,
    employeeEmail,
    department,
    reservationId,
    courtName,
    reservationDate,
    slotTime,
    teammates,
    reviewUrl: `${APP_URL}/admin/reservations`,
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Review Required] New Court Request from ${employeeName} (${reservationId})`,
    html,
  });
}

export async function sendApprovalNotice({
  employeeEmail,
  employeeName,
  reservationId,
  courtName,
  courtLocation,
  reservationDate,
  slotTime,
  teammates,
}: {
  employeeEmail: string;
  employeeName: string;
  reservationId: string;
  courtName: string;
  courtLocation: string;
  reservationDate: string;
  slotTime: string;
  teammates: string;
}) {
  const html = ApprovalNoticeEmailHtml({
    employeeName,
    reservationId,
    courtName,
    courtLocation,
    reservationDate,
    slotTime,
    teammates,
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: employeeEmail,
    subject: `Confirmed: Court Booking ${reservationId} is Approved!`,
    html,
  });
}

export async function sendAutoRejectionNotice({
  employeeEmail,
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
}: {
  employeeEmail: string;
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
}) {
  const html = AutoRejectionEmailHtml({
    employeeName,
    reservationId,
    courtName,
    reservationDate,
    slotTime,
    bookingUrl: `${APP_URL}/dashboard`,
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: employeeEmail,
    subject: `Your Reservation Request ${reservationId} Was Not Selected`,
    html,
  });
}

export async function sendCancellationNotice({
  employeeEmail,
  employeeName,
  reservationId,
  courtName,
  reservationDate,
  slotTime,
  cancelledBy,
  reason,
}: {
  employeeEmail: string;
  employeeName: string;
  reservationId: string;
  courtName: string;
  reservationDate: string;
  slotTime: string;
  cancelledBy: string;
  reason?: string | null;
}) {
  const html = CancellationEmailHtml({
    employeeName,
    reservationId,
    courtName,
    reservationDate,
    slotTime,
    cancelledBy,
    reason,
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: employeeEmail,
    subject: `Reservation Cancelled: ${reservationId}`,
    html,
  });
}

export async function sendRescheduleNotice({
  employeeEmail,
  employeeName,
  reservationId,
  oldCourtName,
  oldReservationDate,
  oldSlotTime,
  newCourtName,
  newReservationDate,
  newSlotTime,
}: {
  employeeEmail: string;
  employeeName: string;
  reservationId: string;
  oldCourtName: string;
  oldReservationDate: string;
  oldSlotTime: string;
  newCourtName: string;
  newReservationDate: string;
  newSlotTime: string;
}) {
  const html = CancellationEmailHtml({
    employeeName,
    reservationId,
    courtName: oldCourtName,
    reservationDate: oldReservationDate,
    slotTime: oldSlotTime,
    cancelledBy: 'Facilities Administration',
    isRescheduled: true,
    // E2 fix: pass old details so employee knows what was moved FROM
    oldDetails: {
      courtName: oldCourtName,
      reservationDate: oldReservationDate,
      slotTime: oldSlotTime,
    },
    newDetails: {
      courtName: newCourtName,
      reservationDate: newReservationDate,
      slotTime: newSlotTime,
    },
    companyLabel: COMPANY_LABEL,
  });

  return sendEmail({
    to: employeeEmail,
    subject: `Reservation Rescheduled: ${reservationId}`,
    html,
  });
}

