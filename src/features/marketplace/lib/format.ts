export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(price);
  } catch {
    // An ISO-shaped code Intl does not know still shows something readable.
    return `${currency} ${price.toFixed(2)}`;
  }
}

const regions = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string): string {
  try {
    return regions.of(code) ?? code;
  } catch {
    return code;
  }
}

// "Singapore, Japan and 3 more" keeps a long ships-to list to one line.
export function shipsToLabel(codes: string[], shown = 3): string {
  const names = codes.slice(0, shown).map(countryName);
  const more = codes.length - names.length;
  return more > 0 ? `${names.join(', ')} and ${more} more` : names.join(', ');
}
