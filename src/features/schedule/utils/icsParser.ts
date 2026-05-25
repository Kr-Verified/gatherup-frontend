export interface ImportedSchedule {
  title: string;
  startDate: string;
  endDate: string;
  color: string;
}

function unfoldIcs(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function toDateOnly(value: string): { date: string; allDay: boolean } | null {
  if (/^\d{8}$/.test(value)) {
    return {
      date: `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`,
      allDay: true,
    };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const date = value.endsWith('Z')
    ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
    : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));

  return {
    date: date.toISOString().slice(0, 10),
    allDay: false,
  };
}

function subtractOneDay(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() - 1);
  return next.toISOString().slice(0, 10);
}

export function parseIcsSchedules(text: string): ImportedSchedule[] {
  if (text.length > 1_000_000) {
    throw new Error('ICS 파일은 1MB 이하만 가져올 수 있습니다.');
  }

  const lines = unfoldIcs(text);
  const schedules: ImportedSchedule[] = [];
  let event: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      event = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (event) {
        const startRaw = event.DTSTART;
        const endRaw = event.DTEND || event.DTSTART;
        const start = startRaw ? toDateOnly(startRaw) : null;
        const end = endRaw ? toDateOnly(endRaw) : null;

        if (start && end) {
          schedules.push({
            title: unescapeText(event.SUMMARY || '가져온 일정'),
            startDate: start.date,
            endDate: start.allDay && end.allDay && end.date > start.date ? subtractOneDay(end.date) : end.date,
            color: '#06b6d4',
          });
        }
      }
      event = null;
      continue;
    }
    if (!event) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const rawKey = line.slice(0, separatorIndex);
    const key = rawKey.split(';')[0];
    const value = line.slice(separatorIndex + 1);
    if (['SUMMARY', 'DTSTART', 'DTEND'].includes(key)) {
      event[key] = value;
    }
  }

  return schedules.slice(0, 100);
}
