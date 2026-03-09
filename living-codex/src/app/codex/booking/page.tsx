"use client";

import { useState } from "react";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export default function BookingPage() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  // Generate demo slots for the next 2 weeks
  const slots: TimeSlot[] = generateSlots();

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot, notes }),
      });
      const data = await res.json();
      if (data.success) setConfirmed(true);
    } catch {}
    setLoading(false);
  };

  if (confirmed) {
    const slot = slots.find((s) => s.id === selectedSlot);
    return (
      <div className="min-h-screen bg-codex-deep flex items-center justify-center px-6">
        <div className="text-center max-w-lg animate-fade-in">
          <div className="text-5xl mb-6">{"\u2727"}</div>
          <h1 className="font-cormorant text-3xl text-codex-gold mb-4">Session Booked</h1>
          <div className="codex-divider" />
          <div className="codex-card mt-8 text-left">
            <p className="text-xs tracking-widest uppercase text-codex-cream/30 mb-2">Your Threshold Session</p>
            <p className="font-cormorant text-xl text-codex-gold">{slot?.date}</p>
            <p className="text-sm text-codex-cream/60 mt-1">{slot?.time} EST · 90 minutes</p>
            <p className="text-sm text-codex-cream/40 mt-4">
              A confirmation email has been sent with a calendar invite and preparation details.
            </p>
          </div>
          <a href="/codex/portal" className="codex-btn-primary mt-8 inline-block">Return to Portal</a>
        </div>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {};
  slots.forEach((s) => {
    if (!slotsByDate[s.date]) slotsByDate[s.date] = [];
    slotsByDate[s.date].push(s);
  });

  return (
    <div className="min-h-screen bg-codex-deep">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-4xl mb-4">{"\u{1F702}"}</div>
          <h1 className="font-cormorant text-3xl md:text-4xl text-codex-gold mb-3">
            Schedule Your Threshold Session
          </h1>
          <p className="codex-body text-sm max-w-lg mx-auto">
            A 90-minute guided session where April walks you through your Mirror Report
            and opens the field for your journey.
          </p>
        </div>

        {/* Date/Time Selection */}
        <div className="space-y-8 mb-12">
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date}>
              <h3 className="font-cormorant text-lg text-codex-gold/70 mb-3">{date}</h3>
              <div className="flex flex-wrap gap-3">
                {dateSlots.map((slot) => (
                  <button
                    key={slot.id}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all duration-300 ${
                      selectedSlot === slot.id
                        ? "border-codex-gold/60 bg-codex-wine/40 text-codex-gold"
                        : slot.available
                        ? "border-codex-muted/30 text-codex-cream/60 hover:border-codex-gold/30"
                        : "border-codex-muted/10 text-codex-cream/15 cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Booking form */}
        {selectedSlot && (
          <div className="max-w-md mx-auto animate-fade-up">
            <div className="codex-card">
              <h3 className="font-cormorant text-xl text-codex-gold mb-4">Confirm Your Session</h3>
              <div className="mb-4 p-3 bg-codex-deep/50 rounded-lg">
                <p className="text-sm text-codex-cream/70">
                  {slots.find((s) => s.id === selectedSlot)?.date} at{" "}
                  {slots.find((s) => s.id === selectedSlot)?.time} EST
                </p>
                <p className="text-xs text-codex-cream/30 mt-1">90 minutes · Virtual (Zoom link sent upon confirmation)</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs tracking-widest uppercase text-codex-cream/30 mb-2">
                  Anything you want April to know beforehand? (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-24 bg-codex-deep/50 border border-codex-muted/30 rounded-lg p-3
                             text-codex-cream/80 text-sm resize-none focus:outline-none focus:border-codex-gold/30
                             placeholder:text-codex-cream/15 placeholder:italic"
                  placeholder="Optional notes..."
                />
              </div>

              <button
                onClick={handleBook}
                disabled={loading}
                className="codex-btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Booking..." : "Confirm Session"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const times = ["10:00 AM", "1:00 PM", "3:30 PM"];

  for (let d = 3; d <= 17; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const day = date.getDay();

    // Skip weekends
    if (day === 0 || day === 6) continue;

    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    times.forEach((time, i) => {
      slots.push({
        id: `${d}-${i}`,
        date: dateStr,
        time,
        available: Math.random() > 0.3, // Demo availability
      });
    });
  }

  return slots;
}
