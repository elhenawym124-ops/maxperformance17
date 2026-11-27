const {
  extractCoordinatesFromText,
  isAllowedMapsUrl,
  normalizeCustomerLocation,
  buildGoogleMapsUrl,
} = require('../../utils/locationParser');

describe('locationParser', () => {
  test('extracts coordinates from standard Google Maps URL formats', () => {
    expect(
      extractCoordinatesFromText('https://www.google.com/maps?q=30.04442,31.235712'),
    ).toEqual({ lat: 30.04442, lng: 31.235712 });

    expect(
      extractCoordinatesFromText(
        'https://www.google.com/maps/place/Cairo/@30.0444,31.2357,17z/data=!3m1!4b1!4m6!3m5!1s0x0!8m2!3d30.051234!4d31.241234',
      ),
    ).toEqual({ lat: 30.051234, lng: 31.241234 });

    expect(
      extractCoordinatesFromText('https://maps.google.com/?ll=29.9602,31.2569'),
    ).toEqual({ lat: 29.9602, lng: 31.2569 });

    expect(extractCoordinatesFromText('30.0444, 31.2357')).toEqual({
      lat: 30.0444,
      lng: 31.2357,
    });
  });

  test('rejects invalid coordinates and zero island', () => {
    expect(extractCoordinatesFromText('0.0, 0.0')).toBeNull();
    expect(extractCoordinatesFromText('95.123, 31.235')).toBeNull();
    expect(extractCoordinatesFromText('not a location')).toBeNull();
  });

  test('allowlists only Google Maps hosts for SSRF protection', () => {
    expect(isAllowedMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isAllowedMapsUrl('https://maps.google.com/?q=30.04,31.23')).toBe(true);
    expect(isAllowedMapsUrl('http://127.0.0.1:8080/internal')).toBe(false);
    expect(isAllowedMapsUrl('https://evil.example.com/maps?q=30,31')).toBe(false);
  });

  test('normalizes customerLocation payload from object or shippingAddress fallback', () => {
    const fromDirect = normalizeCustomerLocation({
      lat: 30.0444199,
      lng: 31.2357111,
      accuracy: 18.4,
      source: 'gps',
      label: 'مدينة نصر، القاهرة',
    });

    expect(fromDirect).toMatchObject({
      lat: 30.04442,
      lng: 31.235711,
      accuracy: 18,
      source: 'gps',
      label: 'مدينة نصر، القاهرة',
      googleMapsUrl: buildGoogleMapsUrl(30.04442, 31.235711),
    });

    const fromShipping = normalizeCustomerLocation(null, {
      street: '10 Abbas El Akkad',
      location: {
        googleMapsUrl: 'https://www.google.com/maps?q=30.06,31.33',
        source: 'maps_link',
      },
    });

    expect(fromShipping).toMatchObject({
      lat: 30.06,
      lng: 31.33,
      source: 'maps_link',
      googleMapsUrl: 'https://www.google.com/maps?q=30.06,31.33',
    });
  });
});
