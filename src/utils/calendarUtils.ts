export function createOutlookCalendarUrl(app: {
  type: string;
  date: string;
  time: string;
  duration?: number;
  description?: string;
  staffName?: string;
  videoLink?: string;
}) {
  const title = app.type === 'signing' ? "Deed Signature Ceremony - Masina Conveyancers" : "Conveyancing Legal Consultation";
  const startDate = new Date(`${app.date}T${app.time}:00`);
  const endDate = new Date(startDate.getTime() + (app.duration || 45) * 60000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: `Legal consultation regarding conveyancing matter.\nAssigned Lawyer: ${app.staffName || 'Legal Team'}\nNotes: ${app.description || 'N/A'}\nMeeting Link: ${app.videoLink || 'N/A'}`,
    location: app.videoLink || 'Masina Conveyancing Offices, Sandton'
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function createGoogleCalendarUrl(app: {
  type: string;
  date: string;
  time: string;
  duration?: number;
  description?: string;
  staffName?: string;
  videoLink?: string;
}) {
  const title = app.type === 'signing' ? "Deed Signature Ceremony - Masina Conveyancers" : "Conveyancing Legal Consultation";
  const startDate = new Date(`${app.date}T${app.time}:00`);
  const endDate = new Date(startDate.getTime() + (app.duration || 45) * 60000);

  const formatGDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;
  const details = `Legal consultation regarding conveyancing matter.\nAssigned Lawyer: ${app.staffName || 'Legal Team'}\nNotes: ${app.description || 'N/A'}\nMeeting Link: ${app.videoLink || 'N/A'}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details,
    location: app.videoLink || 'Masina Conveyancing Offices, Sandton'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile(app: {
  id: string;
  type: string;
  date: string;
  time: string;
  duration?: number;
  description?: string;
  staffName?: string;
  videoLink?: string;
}) {
  const title = app.type === 'signing' ? "Deed Signature Ceremony - Masina Conveyancers" : "Conveyancing Legal Consultation";
  const startDate = new Date(`${app.date}T${app.time}:00`);
  const endDate = new Date(startDate.getTime() + (app.duration || 45) * 60000);

  const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const csContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Masina Conveyance Portal//EN',
    'BEGIN:VEVENT',
    `UID:appointment-${app.id}@masina.co.za`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(app.description || 'Conveyancing Appointment').replace(/\n/g, ' ')}`,
    `LOCATION:${app.videoLink || 'Masina Law Offices'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([csContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Consultation-${app.date}-${app.time.replace(':', '')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
