import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Minus, Plus, Search } from "lucide-react";
import { searchOsmPlaces } from "../utils/locationCaptureSettings";

const TILE_SIZE = 256;
const DEFAULT_CAIRO = { lat: 30.0444, lng: 31.2357 };

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * scale;
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  };
}

export interface InteractiveOsmMapProps {
  lat?: number;
  lng?: number;
  onSelect: (coords: { lat: number; lng: number; source: "map_pin" | "gps" | "search" }) => void;
  heightClassName?: string;
  prefersArabic?: boolean;
  onRequestGps?: () => void;
  gpsLoading?: boolean;
}

/**
 * Lightweight zero-dependency interactive OpenStreetMap slippy-tile map.
 * Supports pointer drag-to-pan, tap/click to drop pin, zoom +/-, GPS recenter, and Nominatim search.
 */
export const InteractiveOsmMap: React.FC<InteractiveOsmMapProps> = ({
  lat,
  lng,
  onSelect,
  heightClassName = "h-56 sm:h-64",
  prefersArabic = true,
  onRequestGps,
  gpsLoading = false,
}) => {
  const hasInitial =
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);

  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    hasInitial ? { lat: lat!, lng: lng! } : DEFAULT_CAIRO,
  );
  const [zoom, setZoom] = useState(hasInitial ? 16 : 12);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; label: string }>
  >([]);
  const [searching, setSearching] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 360, height: 240 });
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startWorldX: number;
    startWorldY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (hasInitial && lat !== undefined && lng !== undefined) {
      setCenter((prev) =>
        Math.abs(prev.lat - lat) > 0.00001 || Math.abs(prev.lng - lng) > 0.00001
          ? { lat, lng }
          : prev,
      );
      setZoom((prev) => (prev < 15 ? 16 : prev));
    }
  }, [hasInitial, lat, lng]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  const centerWorld = useMemo(
    () => latLngToWorld(center.lat, center.lng, zoom),
    [center.lat, center.lng, zoom],
  );

  const tiles = useMemo(() => {
    const halfW = viewportSize.width / 2;
    const halfH = viewportSize.height / 2;
    const minTileX = Math.floor((centerWorld.x - halfW) / TILE_SIZE) - 1;
    const maxTileX = Math.floor((centerWorld.x + halfW) / TILE_SIZE) + 1;
    const minTileY = Math.floor((centerWorld.y - halfH) / TILE_SIZE) - 1;
    const maxTileY = Math.floor((centerWorld.y + halfH) / TILE_SIZE) + 1;
    const maxIndex = Math.pow(2, zoom);

    const list: Array<{ key: string; url: string; left: number; top: number }> = [];
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (ty < 0 || ty >= maxIndex) continue;
        const wrappedX = ((tx % maxIndex) + maxIndex) % maxIndex;
        const left = tx * TILE_SIZE - centerWorld.x + halfW;
        const top = ty * TILE_SIZE - centerWorld.y + halfH;
        list.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          left,
          top,
        });
      }
    }
    return list;
  }, [centerWorld.x, centerWorld.y, viewportSize.height, viewportSize.width, zoom]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWorldX: centerWorld.x,
      startWorldY: centerWorld.y,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.moved = true;
    }
    const nextCoords = worldToLatLng(
      drag.startWorldX - dx,
      drag.startWorldY - dy,
      zoom,
    );
    setCenter(nextCoords);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if already released
    }

    if (drag.moved) {
      onSelect({ lat: center.lat, lng: center.lng, source: "map_pin" });
      return;
    }

    // Tap / Click to drop pin directly at clicked point
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickOffsetX = e.clientX - rect.left - rect.width / 2;
    const clickOffsetY = e.clientY - rect.top - rect.height / 2;
    const clickedCoords = worldToLatLng(
      centerWorld.x + clickOffsetX,
      centerWorld.y + clickOffsetY,
      zoom,
    );
    setCenter(clickedCoords);
    onSelect({ lat: clickedCoords.lat, lng: clickedCoords.lng, source: "map_pin" });
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchOsmPlaces(
        searchQuery,
        prefersArabic ? "ar" : "en",
      );
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  }, [prefersArabic, searchQuery]);

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder={
                prefersArabic
                  ? "ابحث بالشارع أو المنطقة أو الكمبوند..."
                  : "Search street, district, or landmark..."
              }
              className="w-full rounded-xl border border-border bg-background py-2 pe-3 ps-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching || searchQuery.trim().length < 3}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted px-3 text-xs font-semibold text-foreground transition hover:bg-muted/80 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : prefersArabic ? (
              "بحث"
            ) : (
              "Search"
            )}
          </button>
        </div>

        {searchResults.length > 0 ? (
          <div
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-border bg-card shadow-lg divide-y divide-border/60"
            style={{
              backgroundColor: "var(--color-card, var(--color-background, #ffffff))",
              color: "var(--color-foreground, #111827)",
            }}
          >
            {searchResults.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lng}-${idx}`}
                type="button"
                onClick={() => {
                  setCenter({ lat: item.lat, lng: item.lng });
                  setZoom(16);
                  setSearchResults([]);
                  onSelect({ lat: item.lat, lng: item.lng, source: "search" });
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-start text-xs text-foreground hover:bg-muted/60 transition"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-2">{item.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Interactive Tile Canvas */}
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="application"
        aria-label={prefersArabic ? "خريطة تحديد الموقع" : "Location picker map"}
        className={`relative w-full ${heightClassName} select-none overflow-hidden rounded-xl border border-border/80 bg-muted/40 touch-none cursor-grab active:cursor-grabbing`}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            loading="lazy"
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: `${tile.left}px`,
              top: `${tile.top}px`,
            }}
          />
        ))}

        {/* Center Draggable Pin Indicator */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow-md">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background/90">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="h-2.5 w-0.5 bg-primary" />
          </div>
        </div>

        {/* Zoom & GPS Controls */}
        <div className="absolute bottom-2.5 end-2.5 z-10 flex flex-col gap-1.5">
          {onRequestGps ? (
            <button
              type="button"
              onClick={onRequestGps}
              disabled={gpsLoading}
              title={prefersArabic ? "موقعي الحالي" : "My current location"}
              aria-label={prefersArabic ? "موقعي الحالي" : "My current location"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card/95 text-primary shadow-sm transition hover:bg-card active:scale-95 disabled:opacity-60"
            >
              {gpsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            aria-label={prefersArabic ? "تكبير الخريطة" : "Zoom in"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card/95 text-foreground shadow-sm transition hover:bg-card active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(6, z - 1))}
            aria-label={prefersArabic ? "تصغير الخريطة" : "Zoom out"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-card/95 text-foreground shadow-sm transition hover:bg-card active:scale-95"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Attribution & hint */}
        <div className="pointer-events-none absolute bottom-1.5 start-2 rounded bg-card/85 px-1.5 py-0.5 text-[10px] text-muted-foreground">
          © OpenStreetMap
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {prefersArabic
          ? "اسحب الخريطة أو اضغط على موقعك بالضبط لتثبيت الدبوس."
          : "Drag the map or tap your exact building to place the pin."}
      </p>
    </div>
  );
};

export default InteractiveOsmMap;
