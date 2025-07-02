export function Iso8601ToCDMX(iso8601: string): string{
  if (!iso8601) return '';

  const date = new Date(iso8601);

  // Formatear fecha en zona horaria de CDMX (UTC-6)
  const mexicoCityTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);

  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const timeWithMs = mexicoCityTime.replace(/(\d{2}:\d{2}:\d{2})/, `$1.${milliseconds}`);

  return timeWithMs.replace(' ', 'T') + '-06:00';
}

export function FormatForDisplayUser(iso8601CDMX: string, sec: boolean = false): string {
  if(!iso8601CDMX) return '';

  const date = new Date(iso8601CDMX);

  if (isNaN(date.getTime())) {
    console.log('Fecha inválida:', iso8601CDMX);
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const baseFormat = `${day}/${month}/${year} ${hours}:${minutes}`;

  if (sec) {
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${baseFormat}:${seconds}`;
  }

  return baseFormat;
}
