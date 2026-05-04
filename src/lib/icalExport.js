// .ics generator for the Health Tracker. We write the file to the
// app's cache directory and surface it via expo-sharing — iOS routes
// .ics files to Calendar / Mail / any other handler the user has, so we
// don't need to integrate with a specific calendar API.
//
// Spec: RFC 5545. We only emit VEVENT bodies; the wrapping VCALENDAR is
// minimal but compliant. All-day events use DATE form; we use DATETIME
// at 09:00 local so the reminder feels like a morning to-do.

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { findType, durationLabel } from "./healthRecordTypes";

function pad(n) { return n < 10 ? "0" + n : "" + n; }

// Local-time format for floating events: 20260514T090000
function formatLocal(date) {
  return date.getFullYear()
    + pad(date.getMonth() + 1)
    + pad(date.getDate())
    + "T"
    + pad(date.getHours())
    + pad(date.getMinutes())
    + pad(date.getSeconds());
}

// UTC stamp for DTSTAMP / UID — RFC 5545 requires Z-suffixed UTC.
function formatUTC(date) {
  return date.getUTCFullYear()
    + pad(date.getUTCMonth() + 1)
    + pad(date.getUTCDate())
    + "T"
    + pad(date.getUTCHours())
    + pad(date.getUTCMinutes())
    + pad(date.getUTCSeconds())
    + "Z";
}

// Escape commas, semicolons, backslashes, and newlines per RFC 5545.
function escapeText(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Long lines must be folded at 75 octets. Simple ASCII-only fold.
function fold(line) {
  if (line.length <= 75) return line;
  const out = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    out.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) out.push(" " + rest);
  return out.join("\r\n");
}

function eventLines(petName, record, now) {
  const due = new Date(record.nextDue);
  due.setHours(9, 0, 0, 0); // 9am local = a morning reminder
  const end = new Date(due.getTime() + 60 * 60 * 1000);
  const type = findType(record.type);
  const label = record.customLabel || type?.label || record.type;
  const summary = `${petName}: ${label}`;
  const desc = [
    `Pet: ${petName}`,
    `Type: ${label}`,
    record.dateGiven ? `Last given: ${record.dateGiven}` : null,
    record.durationMonths ? `Cadence: ${durationLabel(record.durationMonths)}` : null,
    record.notes ? `Notes: ${record.notes}` : null,
    "Logged in FloofLife — verify with your vet.",
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VEVENT",
    `UID:${record.id || (Date.now() + "@" + petName)}@flooflife`,
    `DTSTAMP:${formatUTC(now)}`,
    `DTSTART:${formatLocal(due)}`,
    `DTEND:${formatLocal(end)}`,
    fold(`SUMMARY:${escapeText(summary)}`),
    fold(`DESCRIPTION:${desc}`),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
  ];
}

// Produce an .ics body for the records that have a future nextDue.
// Past-due records are still included so the user sees "you missed
// these" in their calendar — calendars handle past events fine.
export function generateICS(petName, records) {
  const now = new Date();
  const valid = (records || []).filter((r) => r?.nextDue);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FloofLife//Health Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const r of valid) lines.push(...eventLines(petName, r, now));
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// Write the .ics to a temporary file and trigger the system share sheet.
// Returns true on success, false if the user cancelled or sharing isn't
// available (rare on iOS — share is always available).
export async function shareCalendarExport(petName, records) {
  const ics = generateICS(petName, records);
  const slug = (petName || "pet").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const path = `${FileSystem.cacheDirectory}flooflife-${slug}-health.ics`;
  await FileSystem.writeAsStringAsync(path, ics, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(path, {
    mimeType: "text/calendar",
    dialogTitle: `${petName} — health calendar`,
    UTI: "com.apple.ical.ics",
  });
  return true;
}
