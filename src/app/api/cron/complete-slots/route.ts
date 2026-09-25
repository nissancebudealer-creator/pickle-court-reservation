import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getManilaNow, getManilaTodayString, isSlotPast } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check CRON_SECRET if set
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const todayStr = getManilaTodayString();

    // 1. Fetch confirmed reservations for today or earlier
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, reservation_date, slot_id, court_slots(end_time)')
      .eq('status', 'CONFIRMED')
      .lte('reservation_date', todayStr);

    if (fetchError) {
      console.error('[Cron] Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ message: 'No active reservations to complete', completedCount: 0 });
    }

    const idsToComplete: string[] = [];

    for (const res of reservations) {
      const slotEndTime = (res.court_slots as any)?.end_time || '20:30:00';
      if (res.reservation_date < todayStr || isSlotPast(res.reservation_date, slotEndTime)) {
        idsToComplete.push(res.id);
      }
    }

    if (idsToComplete.length > 0) {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'COMPLETED' })
        .in('id', idsToComplete);

      if (updateError) {
        console.error('[Cron] Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      completedCount: idsToComplete.length,
      completedIds: idsToComplete,
      timestamp: getManilaNow().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Exception]:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
