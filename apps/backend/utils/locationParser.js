const https = require('https');
const http = require('http');

const ALLOWED_MAPS_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
  'g.co',
]);

const VALID_SOURCES = new Set([
  'gps',
  'map_pin',
  'maps_link',
  'post_order',
  'search',
  'whatsapp',
]);

function isFiniteCoord(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function roundCoord(val) {
  return Math.round(Number(val) * 1e6) / 1e6;
}

function buildGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${roundCoord(lat)},${roundCoord(lng)}`;
}

/**
 * Extract latitude and longitude from a Google Maps URL or raw "lat, lng" text.
 * Supports:
 * - https://www.google.com/maps?q=30.0444,31.2357
 * - https://maps.google.com/?q=30.0444,31.2357
 * - https://www.google.com/maps/place/.../@30.0444,31.2357,17z
 * - https://www.google.com/maps/search/?api=1&query=30.0444,31.2357
 * - ...!3d30.0444!4d31.2357...
 * - ll=30.0444,31.2357 / center=30.0444,31.2357
 * - Raw "30.0444, 31.2357"
 */
function extractCoordinatesFromText(rawInput) {
  if (typeof rawInput !== 'string') return null;
  const text = rawInput.trim();
  if (!text) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  })();

  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/i,
    /@(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|center|daddr|saddr)=(?:loc:)?(-?\d{1,2}\.\d+)\s*[,+\s]\s*(-?\d{1,3}\.\d+)/i,
    /\/maps\/(?:place|search|dir)\/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isFiniteCoord(lat, lng)) {
        return {
          lat: roundCoord(lat),
          lng: roundCoord(lng),
        };
      }
    }
  }

  return null;
}

function isAllowedMapsUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_MAPS_HOSTS.has(host) || host.endsWith('.google.com');
  } catch {
    return false;
  }
}

/**
 * Safely follows HTTP redirects for allowlisted Google Maps short links
 * (maps.app.goo.gl / goo.gl/maps) without downloading response bodies.
 */
function followAllowlistedRedirects(initialUrl, maxHops = 5, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let currentUrl = initialUrl;
    let hops = 0;

    const step = () => {
      if (hops >= maxHops || !isAllowedMapsUrl(currentUrl)) {
        resolve(currentUrl);
        return;
      }

      const directCoords = extractCoordinatesFromText(currentUrl);
      if (directCoords) {
        resolve(currentUrl);
        return;
      }

      let parsed;
      try {
        parsed = new URL(currentUrl);
      } catch {
        resolve(currentUrl);
        return;
      }

      const transport = parsed.protocol === 'http:' ? http : https;
      const req = transport.request(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          path: `${parsed.pathname}${parsed.search}`,
          method: 'HEAD',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MaxPLocationResolver/1.0)',
          },
        },
        (res) => {
          res.resume();
          const locationHeader = res.headers?.location;
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            locationHeader
          ) {
            try {
              const nextUrl = new URL(locationHeader, currentUrl).toString();
              if (!isAllowedMapsUrl(nextUrl)) {
                resolve(currentUrl);
                return;
              }
              currentUrl = nextUrl;
              hops += 1;
              step();
              return;
            } catch {
              resolve(currentUrl);
              return;
            }
          }
          resolve(currentUrl);
        },
      );

      req.on('timeout', () => {
        req.destroy();
        resolve(currentUrl);
      });
      req.on('error', () => {
        resolve(currentUrl);
      });
      req.end();
    };

    step();
  });
}

async function resolveLocationLink(rawInput) {
  if (typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 2000) return null;

  const direct = extractCoordinatesFromText(trimmed);
  if (direct) {
    return {
      lat: direct.lat,
      lng: direct.lng,
      googleMapsUrl: buildGoogleMapsUrl(direct.lat, direct.lng),
      source: 'maps_link',
    };
  }

  // Extract first URL if pasted with surrounding text (e.g. from WhatsApp share)
  const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
  const candidateUrl = urlMatch ? urlMatch[0] : trimmed;

  if (!isAllowedMapsUrl(candidateUrl)) {
    return null;
  }

  const finalUrl = await followAllowlistedRedirects(candidateUrl);
  const resolved = extractCoordinatesFromText(finalUrl);
  if (!resolved) {
    return null;
  }

  return {
    lat: resolved.lat,
    lng: resolved.lng,
    googleMapsUrl: buildGoogleMapsUrl(resolved.lat, resolved.lng),
    source: 'maps_link',
  };
}

/**
 * Normalize customer location payload from request body or shippingAddress.
 */
function normalizeCustomerLocation(input, fallbackShippingAddress = null) {
  const candidates = [];
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    candidates.push(input);
  }
  if (
    fallbackShippingAddress &&
    typeof fallbackShippingAddress === 'object' &&
    !Array.isArray(fallbackShippingAddress)
  ) {
    if (
      fallbackShippingAddress.location &&
      typeof fallbackShippingAddress.location === 'object'
    ) {
      candidates.push(fallbackShippingAddress.location);
    }
    if (
      fallbackShippingAddress.lat !== undefined ||
      fallbackShippingAddress.lng !== undefined ||
      fallbackShippingAddress.googleMapsUrl
    ) {
      candidates.push(fallbackShippingAddress);
    }
  }

  for (const candidate of candidates) {
    let lat = candidate.lat !== undefined ? Number(candidate.lat) : NaN;
    let lng = candidate.lng !== undefined ? Number(candidate.lng) : NaN;

    if (!isFiniteCoord(lat, lng)) {
      const linkSource =
        typeof candidate.googleMapsUrl === 'string'
          ? candidate.googleMapsUrl
          : typeof candidate.mapsUrl === 'string'
            ? candidate.mapsUrl
            : typeof candidate.url === 'string'
              ? candidate.url
              : '';
      const parsed = extractCoordinatesFromText(linkSource);
      if (parsed) {
        lat = parsed.lat;
        lng = parsed.lng;
      }
    }

    if (isFiniteCoord(lat, lng)) {
      const normalizedLat = roundCoord(lat);
      const normalizedLng = roundCoord(lng);
      const rawSource = String(candidate.source || 'map_pin').trim().toLowerCase();
      const accuracyNum = Number(candidate.accuracy);
      const label =
        typeof candidate.label === 'string'
          ? candidate.label.trim().slice(0, 255)
          : undefined;

      return {
        lat: normalizedLat,
        lng: normalizedLng,
        googleMapsUrl: buildGoogleMapsUrl(normalizedLat, normalizedLng),
        source: VALID_SOURCES.has(rawSource) ? rawSource : 'map_pin',
        ...(Number.isFinite(accuracyNum) && accuracyNum >= 0
          ? { accuracy: Math.round(accuracyNum) }
          : {}),
        ...(label ? { label } : {}),
        capturedAt:
          typeof candidate.capturedAt === 'string' && candidate.capturedAt.trim()
            ? candidate.capturedAt.trim().slice(0, 40)
            : new Date().toISOString(),
      };
    }
  }

  return null;
}

module.exports = {
  isFiniteCoord,
  buildGoogleMapsUrl,
  extractCoordinatesFromText,
  isAllowedMapsUrl,
  resolveLocationLink,
  normalizeCustomerLocation,
};
