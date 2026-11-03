'use client';

import 'leaflet/dist/leaflet.css';
import './tea-map.css';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  // The pin's accessible name; keyboard and screen-reader users reach pins by it.
  name: string;
  // Short text drawn on the pin itself, such as a tea count.
  text?: string;
  tone?: 'matcha' | 'hojicha' | 'neutral';
  // Extra lines for the tooltip and popup.
  description?: string;
  // Set: choosing the pin goes there. Unset: choosing it opens a popup.
  href?: string;
  link?: { label: string; href: string };
}

interface TeaMapProps {
  label: string;
  pins: MapPin[];
  className?: string;
}

// OSM's tile policy asks for the default max zoom, an attribution line, and no bulk prefetching;
// Leaflet only requests the tiles in view.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

function popupContent(pin: MapPin): HTMLElement {
  const box = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'font-semibold';
  title.textContent = pin.name;
  box.append(title);
  if (pin.description) {
    const detail = document.createElement('p');
    detail.textContent = pin.description;
    box.append(detail);
  }
  if (pin.link) {
    const link = document.createElement('a');
    link.className = 'tea-map-popup-link';
    link.href = pin.link.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = pin.link.label;
    box.append(link);
  }
  return box;
}

// Leaflet touches `window`, so it is imported inside the effect: the server render is just the
// empty, labelled container.
export function TeaMap({ label, pins, className }: TeaMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const node = container.current;
    if (!node) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    void import('leaflet').then((L) => {
      if (cancelled) return;
      const map = L.map(node, { scrollWheelZoom: false, worldCopyJump: false });
      L.tileLayer(TILES, {
        attribution: ATTRIBUTION,
        maxZoom: 19,
        className: 'tea-map-tiles',
      }).addTo(map);

      for (const pin of pins) {
        const el = document.createElement('span');
        el.className = 'tea-pin';
        el.dataset.tone = pin.tone ?? 'neutral';
        el.textContent = pin.text ?? '';
        const marker = L.marker([pin.lat, pin.lng], {
          title: pin.name,
          keyboard: true,
          icon: L.divIcon({
            html: el,
            className: 'tea-pin-icon',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
        });
        // The marker's element only exists once it is added, so the name is set then.
        marker.on('add', () =>
          marker
            .getElement()
            ?.setAttribute(
              'aria-label',
              pin.description ? `${pin.name}. ${pin.description}` : pin.name
            )
        );
        marker.addTo(map);
        if (pin.href) {
          const href = pin.href;
          marker.on('click', () => router.push(href));
        } else {
          marker.bindPopup(popupContent(pin));
        }
      }

      if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 14);
      else if (pins.length > 1) {
        map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), {
          padding: [40, 40],
          maxZoom: 12,
        });
      } else map.setView([30, 120], 3);

      teardown = () => map.remove();
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [pins, router]);

  return (
    <div
      ref={container}
      role="region"
      aria-label={label}
      className={cn('tea-map h-80 w-full overflow-hidden rounded-2xl sm:h-[28rem]', className)}
    />
  );
}
