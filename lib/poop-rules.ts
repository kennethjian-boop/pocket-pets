/**
 * Scheduled poop events are generated on the device (10:00 and 16:00 Singapore
 * time) and are not written to Supabase; the care RPC only records when Clean was
 * last used. Without this, a reload regenerated already-cleaned poop. Any event
 * scheduled at or before the last authoritative Clean counts as cleaned.
 */
export interface PoopEventLike {
  id: string;
  scheduledAt: string;
  createdAt: string;
  cleanedAt: string | null;
}

export function markPoopCleanedBy<T extends PoopEventLike>(events: T[], lastCleanMs: number | null | undefined): T[] {
  if (!lastCleanMs || !Number.isFinite(lastCleanMs) || lastCleanMs <= 0) return events;
  return events.map((event) => {
    if (event.cleanedAt) return event;
    const scheduled = new Date(event.scheduledAt).getTime();
    if (Number.isNaN(scheduled) || scheduled > lastCleanMs) return event;
    return { ...event, cleanedAt: new Date(lastCleanMs).toISOString() };
  });
}
