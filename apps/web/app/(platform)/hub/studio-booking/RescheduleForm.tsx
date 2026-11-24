// "New time: <day> <time> > Reschedule" for one coming booking (Bookings and Alerts). Who may
// move which booking is decided in rescheduleBooking (@cds/db).
import type { BookingView } from "@cds/db";
import { Button } from "@cds/ui/hub";
import { rescheduleBookingAction } from "../../../actions/studio";

const FIELD =
  "min-h-9 rounded border border-hub-border-strong bg-hub-surface px-2";

export function RescheduleForm({
  b,
  back,
}: {
  b: BookingView;
  /** "/hub/alerts" acts in place there. */
  back?: string;
}) {
  return (
    <form
      action={rescheduleBookingAction}
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <input type="hidden" name="bookingId" value={b.id} />
      {back ? <input type="hidden" name="back" value={back} /> : null}
      <label className="flex items-center gap-2">
        New time
        <input
          type="date"
          name="date"
          required
          defaultValue={b.date}
          className={FIELD}
        />
      </label>
      <input
        aria-label="Time"
        type="time"
        name="time"
        required
        step={300}
        defaultValue={b.time}
        className={FIELD}
      />
      <Button type="submit" size="sm" variant="secondary">
        Reschedule
      </Button>
    </form>
  );
}
