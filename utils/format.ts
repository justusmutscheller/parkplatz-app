export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string, locale: string = 'de-DE'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(dateString: string, locale: string = 'de-DE'): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string, locale: string = 'de-DE'): string {
  return `${formatDate(dateString, locale)}, ${formatTime(dateString, locale)}`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatPhoneNumber(phone: string): string {
  if (phone.startsWith('+49')) {
    const rest = phone.slice(3);
    return `+49 ${rest.slice(0, 3)} ${rest.slice(3)}`;
  }
  return phone;
}
