import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi.js";
import { doctorApi } from "../../api/doctorApi.js";
import { appointmentApi } from "../../api/appointmentApi.js";
import { getApiErrorMessage } from "../../api/error.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { LoadingScreen } from "../../components/ui/LoadingScreen.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";

function normalizeDoctors(res) {
  const list = res?.data ?? res?.doctors ?? res ?? [];
  return Array.isArray(list) ? list : [];
}

export function PatientBrowseDoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [booking, setBooking] = useState({
    date: "",
    timeSlot: "",
    symptoms: "",
  });
  const [bookingBusy, setBookingBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await authApi.getDoctors();
        setDoctors(normalizeDoctors(res?.data ?? res));
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) =>
      `${d.fullName ?? ""} ${d.email ?? ""}`.toLowerCase().includes(q)
    );
  }, [doctors, query]);

  const dayOfWeek = useMemo(() => {
    if (!booking.date) return null;
    const d = new Date(`${booking.date}T00:00:00`);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }, [booking.date]);

  const timeSlotOptions = useMemo(() => {
    if (!dayOfWeek) return [];
    const slots = availability
      .filter((a) => a.dayOfWeek === dayOfWeek)
      .map((a) => `${a.startTime} - ${a.endTime}`);

    return Array.from(new Set(slots));
  }, [availability, dayOfWeek]);

  useEffect(() => {
    if (!selected) {
      setAvailability([]);
      setAvailabilityBusy(false);
      return;
    }

    (async () => {
      setAvailabilityBusy(true);
      try {
        const userId = selected._id ?? selected.id;
        const res = await doctorApi.getAvailabilityByUserId(userId);
        const list = Array.isArray(res?.availability) ? res.availability : [];
        setAvailability(list);
      } catch {
        // Not fatal; just show empty slots
        setAvailability([]);
      } finally {
        setAvailabilityBusy(false);
      }
    })();
  }, [selected]);

  async function submitBooking() {
    if (!selected) return;
    if (!booking.date || !booking.timeSlot || !booking.symptoms.trim()) {
      toast.error("Please select date, time, and symptoms.");
      return;
    }
    setBookingBusy(true);
    try {
      await appointmentApi.book({
        doctorId: selected._id ?? selected.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        symptoms: booking.symptoms,
      });
      toast.success("Appointment request submitted");
      setSelected(null);
      setBooking({ date: "", timeSlot: "", symptoms: "" });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBookingBusy(false);
    }
  }

  if (loading) return <LoadingScreen title="Loading doctors…" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Browse doctors
              </div>
              <div className="text-xs text-slate-500">
                All verified, active doctors on the platform.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="query"
                placeholder="Search by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <EmptyState
              title="No doctors found"
              description={
                doctors.length
                  ? "Try a different search."
                  : "No doctors are registered yet."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const id = d._id ?? d.id;
                const initials = (d.fullName ?? "D")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          Dr. {d.fullName ?? "—"}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {d.email ?? "—"}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setSelected(d)} className="w-full">
                      Book appointment
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(selected)}
        title="Book appointment"
        onClose={() => (bookingBusy ? null : setSelected(null))}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={bookingBusy}
            >
              Cancel
            </Button>
            <Button onClick={submitBooking} disabled={bookingBusy}>
              {bookingBusy ? "Booking…" : "Confirm"}
            </Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">
                Dr. {selected.fullName}
              </div>
              <div className="text-xs text-slate-600">{selected.email}</div>
            </div>

            <Input
              label="Date"
              name="date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={booking.date}
              onChange={(e) =>
                setBooking((b) => ({
                  ...b,
                  date: e.target.value,
                  timeSlot: "",
                }))
              }
            />

            <label className="block text-sm font-medium text-slate-700">
              Time slot
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                value={booking.timeSlot}
                onChange={(e) =>
                  setBooking((b) => ({ ...b, timeSlot: e.target.value }))
                }
                disabled={!booking.date || availabilityBusy}
              >
                <option value="">Select a time slot</option>
                {timeSlotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot.replace("-", "–")}
                  </option>
                ))}
              </select>
              {!booking.date ? (
                <div className="mt-1 text-xs text-slate-500">
                  Pick a date to see available slots.
                </div>
              ) : availabilityBusy ? (
                <div className="mt-1 text-xs text-slate-500">
                  Loading availability…
                </div>
              ) : timeSlotOptions.length === 0 ? (
                <div className="mt-1 text-xs text-amber-700">
                  No slots available for {dayOfWeek ?? "this day"}.
                </div>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Symptoms
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={booking.symptoms}
                onChange={(e) =>
                  setBooking((b) => ({ ...b, symptoms: e.target.value }))
                }
                placeholder="Briefly describe your symptoms…"
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
