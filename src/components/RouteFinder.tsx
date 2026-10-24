import React, { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource as MapLibreGeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, CarFront, ChevronDown, ChevronUp, ExternalLink, LocateFixed, MapPin, PersonStanding, RefreshCw } from 'lucide-react';

type TravelMode = 'walking' | 'bicycling' | 'driving' | 'motorcycle';
type Renderer = 'maplibre' | 'leaflet';
type Position = { latitude: number; longitude: number; accuracy: number; heading?: number | null; source?: 'gps' | 'manual' };
type ValhallaManeuver = { instruction: string; length: number; time: number };
type ValhallaResponse = {
  trip?: {
    summary: { length: number; time: number };
    locations: Array<{ lat: number; lon: number }>;
    legs: Array<{ shape: string; maneuvers: ValhallaManeuver[] }>;
  };
  status_message?: string;
};
type RouteInfo = {
  distance: number;
  duration: number;
  approximate: boolean;
  startAccessDistance: number;
  endAccessDistance: number;
  straightLineDistance: number;
  maneuvers: ValhallaManeuver[];
};

type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const destination: L.LatLngTuple = [14.5472886, 121.0659399];
const destinationName = 'Mayor Moises R. Flores Health Center';
const wazeUrl = `https://www.waze.com/ul?ll=${destination[0]}%2C${destination[1]}&navigate=yes`;
const costingProfiles: Record<TravelMode, string> = {
  walking: 'pedestrian',
  bicycling: 'bicycle',
  driving: 'auto',
  motorcycle: 'motor_scooter',
};
const modeLabels: Record<TravelMode, string> = {
  walking: 'Walk',
  bicycling: 'Bike',
  driving: 'Car',
  motorcycle: 'Motorcycle',
};
const modes: Array<{ id: TravelMode; label: string; icon: React.ReactNode }> = [
  { id: 'walking', label: 'Walk', icon: <PersonStanding className="w-4 h-4" /> },
  { id: 'bicycling', label: 'Bike', icon: <Bike className="w-4 h-4" /> },
  { id: 'driving', label: 'Car', icon: <CarFront className="w-4 h-4" /> },
  { id: 'motorcycle', label: 'Motorcycle', icon: <CarFront className="w-4 h-4" /> },
];
const emptyFeatures: RouteFeatureCollection = { type: 'FeatureCollection', features: [] };

function distanceBetween(a: Position, b: Position) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function distanceBetweenLatLng(a: L.LatLngTuple, b: L.LatLngTuple) {
  return distanceBetween(
    { latitude: a[0], longitude: a[1], accuracy: 0 },
    { latitude: b[0], longitude: b[1], accuracy: 0 },
  );
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

function decodePolyline6(encoded: string): L.LatLngTuple[] {
  const coordinates: L.LatLngTuple[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const readDelta = () => {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += readDelta();
    longitude += readDelta();
    coordinates.push([latitude / 1e6, longitude / 1e6]);
  }
  return coordinates;
}

function accuracyFeature(position: Position): GeoJSON.Feature<GeoJSON.Polygon> {
  const latitude = position.latitude * Math.PI / 180;
  const longitude = position.longitude * Math.PI / 180;
  const angularDistance = position.accuracy / 6_371_000;
  const coordinates: number[][] = [];
  for (let step = 0; step <= 64; step += 1) {
    const bearing = step / 64 * Math.PI * 2;
    const pointLatitude = Math.asin(Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing));
    const pointLongitude = longitude + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude), Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(pointLatitude));
    coordinates.push([pointLongitude * 180 / Math.PI, pointLatitude * 180 / Math.PI]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } };
}

function markerElement(color: string, label: string, heading?: number | null, userLocation = false) {
  const element = document.createElement('div');
  element.setAttribute('aria-label', label);
  element.title = label;
  element.className = userLocation ? 'route-user-marker' : '';
  Object.assign(element.style, {
    width: userLocation ? '22px' : '18px', height: userLocation ? '22px' : '18px', borderRadius: '50%', background: color,
    border: '3px solid white', boxShadow: '0 2px 8px rgba(15,23,42,.45)', transform: heading != null ? `rotate(${heading}deg)` : '',
  });
  if (userLocation && heading != null) element.innerHTML = '<span class="route-heading-arrow"></span>';
  return element;
}

function mapLibreBounds(points: [number, number][]) {
  const bounds = L.latLngBounds(points.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple));
  return [[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]] as [[number, number], [number, number]];
}

export const RouteFinder: React.FC = () => {
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [origin, setOrigin] = useState<Position | null>(null);
  const [locationError, setLocationError] = useState('');
  const [routeError, setRouteError] = useState('');
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [renderer, setRenderer] = useState<Renderer>('maplibre');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [trackingAttempt, setTrackingAttempt] = useState(0);
  const [pinStartMode, setPinStartMode] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<MapLibreMap | null>(null);
  const mapLibreMarkerConstructorRef = useRef<typeof MapLibreMarker | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const accessLinesRef = useRef<L.Polyline[]>([]);
  const libreUserMarkerRef = useRef<MapLibreMarker | null>(null);
  const libreDestinationMarkerRef = useRef<MapLibreMarker | null>(null);
  const routePointsRef = useRef<[number, number][]>([]);
  const lastRouteRef = useRef<{ position: Position; mode: TravelMode; timestamp: number } | null>(null);
  const shouldFitRouteRef = useRef(true);
  const manualOriginRef = useRef(false);
  const pinStartModeRef = useRef(false);
  const fallbackUsedRef = useRef(false);
  pinStartModeRef.current = pinStartMode;

  const setPinCursor = (enabled: boolean) => {
    mapLibreRef.current?.getCanvasContainer().classList.toggle('route-start-pin-mode', enabled);
    leafletMapRef.current?.getContainer().classList.toggle('route-start-pin-mode', enabled);
  };

  useEffect(() => {
    let disposed = false;
    let maplibreMap: MapLibreMap | null = null;
    let fallbackStarted = false;
    let fallbackTimer = 0;
    setMapReady(false);
    setMapError('');

    const activateLeafletFallback = (reason: string) => {
      if (disposed || fallbackStarted || fallbackUsedRef.current) return;
      fallbackStarted = true;
      fallbackUsedRef.current = true;
      maplibreMap?.remove();
      mapLibreRef.current = null;
      mapLibreMarkerConstructorRef.current = null;
      libreUserMarkerRef.current = null;
      libreDestinationMarkerRef.current = null;
      routePointsRef.current = [];
      lastRouteRef.current = null;
      shouldFitRouteRef.current = true;
      setRoute(null);
      setMapError(`MapLibre could not load (${reason}); switching to the working dark street map.`);
      setRenderer('leaflet');
    };

    if (renderer === 'maplibre') {
      fallbackTimer = window.setTimeout(() => {
        if (!maplibreMap?.isStyleLoaded()) activateLeafletFallback('map style timeout');
      }, 9000);
      void import('maplibre-gl').then((maplibre) => {
        if (disposed || !mapElementRef.current) return;
        maplibreMap = new maplibre.Map({
          container: mapElementRef.current,
          style: 'https://tiles.openfreemap.org/styles/dark',
          center: [destination[1], destination[0]],
          zoom: 15,
        });
        mapLibreRef.current = maplibreMap;
        mapLibreMarkerConstructorRef.current = maplibre.Marker;
        maplibreMap.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');
        maplibreMap.on('click', (event) => {
          if (!pinStartModeRef.current) return;
          manualOriginRef.current = true;
          setPinCursor(false);
          setOrigin({ latitude: event.lngLat.lat, longitude: event.lngLat.lng, accuracy: 0, source: 'manual' });
          setLocationError('');
          setPinStartMode(false);
          shouldFitRouteRef.current = true;
          lastRouteRef.current = null;
        });
        maplibreMap.on('error', (event) => {
          const detail = event.error?.message ?? 'unknown vector-map error';
          setMapError(`OpenFreeMap: ${detail}`);
          const sourceId = 'sourceId' in event ? String(event.sourceId) : '';
          if (!maplibreMap?.isStyleLoaded() || sourceId === 'openmaptiles') activateLeafletFallback(detail);
        });
        maplibreMap.on('load', () => {
          if (!maplibreMap || disposed) return;
          maplibreMap.addSource('route', { type: 'geojson', data: emptyFeatures });
          maplibreMap.addSource('access-links', { type: 'geojson', data: emptyFeatures });
          maplibreMap.addSource('accuracy', { type: 'geojson', data: emptyFeatures as GeoJSON.FeatureCollection<GeoJSON.Geometry> });
          maplibreMap.addLayer({ id: 'route-casing', type: 'line', source: 'route', paint: { 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.88 } });
          maplibreMap.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#38bdf8', 'line-width': 6, 'line-opacity': 1 } });
          maplibreMap.addLayer({ id: 'route-line-approx', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round', 'visibility': 'none' }, paint: { 'line-color': '#f0ad4e', 'line-width': 6, 'line-opacity': 1, 'line-dasharray': [2, 1.5] } });
          maplibreMap.addLayer({ id: 'access-lines', type: 'line', source: 'access-links', paint: { 'line-color': '#f0ad4e', 'line-width': 3, 'line-dasharray': [1, 2] } });
          maplibreMap.addLayer({ id: 'accuracy-fill', type: 'fill', source: 'accuracy', paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.14 } });
          maplibreMap.addLayer({ id: 'accuracy-outline', type: 'line', source: 'accuracy', paint: { 'line-color': '#38bdf8', 'line-width': 1 } });
          libreDestinationMarkerRef.current = new maplibre.Marker({ element: markerElement('#b84236', destinationName) }).setLngLat([destination[1], destination[0]]).addTo(maplibreMap);
          clearTimeout(fallbackTimer);
          setMapError('');
          setMapReady(true);
        });
      }).catch((error: unknown) => activateLeafletFallback(error instanceof Error ? error.message : 'MapLibre failed to initialize'));

      return () => {
        disposed = true;
        clearTimeout(fallbackTimer);
        maplibreMap?.remove();
        if (mapLibreRef.current === maplibreMap) {
          mapLibreRef.current = null;
          mapLibreMarkerConstructorRef.current = null;
          libreUserMarkerRef.current = null;
          libreDestinationMarkerRef.current = null;
        }
      };
    }

    if (!mapElementRef.current) return;
    const map = L.map(mapElementRef.current, { zoomControl: false, minZoom: 3 }).setView(destination, 15);
    leafletMapRef.current = map;
    const tiles = L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', { maxZoom: 19, className: 'map-dark-tiles', attribution: '&copy; OpenStreetMap contributors &middot; OSM.de tiles' });
    tiles.on('tileerror', () => setMapError('Map tiles could not load. Check your connection.'));
    tiles.on('tileload', () => setMapError(''));
    tiles.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    destinationMarkerRef.current = L.circleMarker(destination, { radius: 9, color: '#fff', weight: 3, fillColor: '#b84236', fillOpacity: 1 }).addTo(map).bindTooltip(destinationName);
    map.on('click', (event) => {
      if (!pinStartModeRef.current) return;
      setPinCursor(false);
      manualOriginRef.current = true;
      setOrigin({ latitude: event.latlng.lat, longitude: event.latlng.lng, accuracy: 0, source: 'manual' });
      setLocationError('');
      setPinStartMode(false);
      shouldFitRouteRef.current = true;
      lastRouteRef.current = null;
      routeLineRef.current?.remove();
      accessLinesRef.current.forEach((line) => line.remove());
      accessLinesRef.current = [];
    });
    setMapReady(true);
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      disposed = true;
      map.remove();
      leafletMapRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      destinationMarkerRef.current = null;
      routeLineRef.current = null;
      accessLinesRef.current = [];
    };
  }, [renderer]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [collapsed]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Location access is not supported. You can still pin your start on the map.');
      setLocating(false);
      return;
    }
    setLocationError('');
    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (!manualOriginRef.current) {
          const nextAccuracy = Math.max(coords.accuracy || 0, 1);
          if (nextAccuracy > 250) {
            setLocationError('Location accuracy is limited. Wait outdoors for a stronger GPS signal or pin your start precisely.');
          } else {
            setLocationError('');
          }
          setOrigin((current) => {
            if (!current || current.source === 'manual' || nextAccuracy > 250) {
              return {
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: nextAccuracy,
                heading: coords.heading,
                source: 'gps',
              };
            }
            const previousWeight = Math.min(current.accuracy, 100);
            const nextWeight = Math.min(nextAccuracy, 100);
            const totalWeight = previousWeight + nextWeight;
            return {
              latitude: (current.latitude * nextWeight + coords.latitude * previousWeight) / totalWeight,
              longitude: (current.longitude * nextWeight + coords.longitude * previousWeight) / totalWeight,
              accuracy: Math.min(current.accuracy * 0.75 + nextAccuracy * 0.25, nextAccuracy),
              heading: coords.heading ?? current.heading,
              source: 'gps',
            };
          });
        }
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location permission was denied. Enable it in browser settings or pin your start manually.' : 'Could not determine location. Check GPS or network reception.');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingAttempt]);

  useEffect(() => {
    const userColor = origin?.source === 'manual' ? '#0f766e' : origin && origin.accuracy > 250 ? '#c47a00' : '#1677c8';
    if (renderer === 'maplibre') {
      const map = mapLibreRef.current;
      if (!map || !mapReady || !origin) return;
      const Marker = mapLibreMarkerConstructorRef.current;
      if (!Marker) return;
      const location: [number, number] = [origin.longitude, origin.latitude];
      if (!libreUserMarkerRef.current) libreUserMarkerRef.current = new Marker({ element: markerElement(userColor, 'Your location', origin.heading, true) }).setLngLat(location).addTo(map);
      else {
        libreUserMarkerRef.current.setLngLat(location);
        const element = libreUserMarkerRef.current.getElement();
        element.style.background = userColor;
        element.style.transform = origin.heading != null ? `rotate(${origin.heading}deg)` : '';
      }
      const accuracySource = map.getSource('accuracy') as MapLibreGeoJSONSource | undefined;
      accuracySource?.setData(origin.source === 'gps' && origin.accuracy > 0 && origin.accuracy <= 250 ? accuracyFeature(origin) : emptyFeatures as GeoJSON.FeatureCollection<GeoJSON.Geometry>);
      return;
    }

    const map = leafletMapRef.current;
    if (!map || !origin) return;
    const userLatLng: L.LatLngTuple = [origin.latitude, origin.longitude];
    if (!userMarkerRef.current) userMarkerRef.current = L.circleMarker(userLatLng, { radius: 8, color: '#fff', weight: 3, fillColor: userColor, fillOpacity: 1, className: origin.source === 'gps' && origin.accuracy <= 250 ? 'route-live-marker' : '' }).addTo(map).bindTooltip('Your location');
    else {
      userMarkerRef.current.setLatLng(userLatLng);
      userMarkerRef.current.setStyle({ fillColor: userColor, className: origin.source === 'gps' && origin.accuracy <= 250 ? 'route-live-marker' : '' });
    }
    if (origin.source === 'gps' && origin.accuracy > 0 && origin.accuracy <= 250) {
      if (accuracyCircleRef.current) accuracyCircleRef.current.setLatLng(userLatLng).setRadius(origin.accuracy);
      else accuracyCircleRef.current = L.circle(userLatLng, { radius: origin.accuracy, color: '#1677c8', weight: 1, fillColor: '#1677c8', fillOpacity: 0.12 }).addTo(map);
    } else {
      accuracyCircleRef.current?.remove();
      accuracyCircleRef.current = null;
    }
  }, [origin, renderer, mapReady]);

  useEffect(() => {
    if (!origin || !mapReady) return;
    const previous = lastRouteRef.current;
    const changedConfidence = previous && (previous.position.accuracy > 250) !== (origin.accuracy > 250);
    if (previous && !changedConfidence && previous.mode === travelMode && distanceBetween(previous.position, origin) < 40 && Date.now() - previous.timestamp < 20000) return;

    const approximate = origin.source !== 'manual' && origin.accuracy > 250;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setRouteError('');
      lastRouteRef.current = { position: origin, mode: travelMode, timestamp: Date.now() };
      const costing = costingProfiles[travelMode];
      const request = {
        locations: [
          { lat: origin.latitude, lon: origin.longitude, type: 'break' },
          { lat: destination[0], lon: destination[1], type: 'break' },
        ],
        costing,
        units: 'kilometers',
        directions_options: { language: 'en-US', units: 'kilometers' },
      };
      const url = `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(request))}`;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Routing service is unavailable.');
        const result = await response.json() as ValhallaResponse;
        const trip = result.trip;
        if (!trip?.legs?.[0]) throw new Error(result.status_message || 'No route was found for this mode.');
        const points = decodePolyline6(trip.legs[0].shape);
        if (points.length < 2) throw new Error('The routing service returned an incomplete path.');
        const startSnap = trip.locations[0];
        const endSnap = trip.locations[1];
        const startAccessDistance = distanceBetweenLatLng([origin.latitude, origin.longitude], [startSnap.lat, startSnap.lon]);
        const endAccessDistance = distanceBetweenLatLng(destination, [endSnap.lat, endSnap.lon]);
        const straightLineDistance = distanceBetweenLatLng([origin.latitude, origin.longitude], destination);
        const accessFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: 'FeatureCollection', features: [] };
        if (startAccessDistance > 5 && startAccessDistance <= 250) accessFeatures.features.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [[origin.longitude, origin.latitude], [startSnap.lon, startSnap.lat]] },
        });
        if (endAccessDistance > 5 && endAccessDistance <= 250) accessFeatures.features.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [[endSnap.lon, endSnap.lat], [destination[1], destination[0]]] },
        });

        if (renderer === 'maplibre' && mapLibreRef.current) {
          const map = mapLibreRef.current;
          const routeSource = map.getSource('route') as MapLibreGeoJSONSource | undefined;
          const accessSource = map.getSource('access-links') as MapLibreGeoJSONSource | undefined;
          if (!routeSource || !accessSource) throw new Error('Map is still loading. Try again shortly.');
          const coordinates = points.map(([lat, lon]) => [lon, lat] as [number, number]);
          routePointsRef.current = coordinates;
          routeSource.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
          accessSource.setData(accessFeatures);
          const routeColor = travelMode === 'walking' ? '#22c55e' : travelMode === 'bicycling' ? '#f59e0b' : travelMode === 'motorcycle' ? '#ef4444' : '#38bdf8';
          map.setPaintProperty('route-line', 'line-color', routeColor);
          map.setLayoutProperty('route-line', 'visibility', approximate ? 'none' : 'visible');
          map.setLayoutProperty('route-line-approx', 'visibility', approximate ? 'visible' : 'none');
          if (shouldFitRouteRef.current) {
            map.fitBounds(mapLibreBounds(coordinates), { padding: 40, maxZoom: 17, duration: 0 });
            shouldFitRouteRef.current = false;
          }
        } else if (renderer === 'leaflet' && leafletMapRef.current) {
          const map = leafletMapRef.current;
          routeLineRef.current?.remove();
          accessLinesRef.current.forEach((line) => line.remove());
          accessLinesRef.current = [];
          const routeColor = travelMode === 'walking' ? '#22c55e' : travelMode === 'bicycling' ? '#f59e0b' : travelMode === 'motorcycle' ? '#ef4444' : '#38bdf8';
          routeLineRef.current = L.polyline(points, { color: approximate ? '#f0ad4e' : routeColor, weight: 6, opacity: 1, dashArray: approximate ? '10 8' : undefined }).addTo(map);
          accessFeatures.features.forEach((feature) => {
            const accessPoints = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple);
            accessLinesRef.current.push(L.polyline(accessPoints, { color: approximate ? '#f0ad4e' : '#38bdf8', weight: 4, opacity: 0.95, dashArray: '3 7' }).addTo(map));
          });
          if (shouldFitRouteRef.current) {
            const bounds = routeLineRef.current.getBounds();
            accessLinesRef.current.forEach((line) => bounds.extend(line.getBounds()));
            map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
            shouldFitRouteRef.current = false;
          }
        }
        const maneuvers = trip.legs.flatMap((leg) => leg.maneuvers).filter((maneuver) => maneuver.length > 0);
        setRoute({ distance: trip.summary.length * 1000, duration: trip.summary.time, approximate, startAccessDistance, endAccessDistance, straightLineDistance, maneuvers });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRoute(null);
        setRouteError(error instanceof Error ? error.message : 'Could not calculate this route.');
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [origin, travelMode, mapReady, renderer]);

  const retryLocation = () => {
    manualOriginRef.current = false;
    setPinStartMode(false);
    setPinCursor(false);
    setOrigin(null);
    setRoute(null);
    lastRouteRef.current = null;
    shouldFitRouteRef.current = true;
    routeLineRef.current?.remove();
    routeLineRef.current = null;
    accessLinesRef.current.forEach((line) => line.remove());
    accessLinesRef.current = [];
    (mapLibreRef.current?.getSource('route') as MapLibreGeoJSONSource | undefined)?.setData(emptyFeatures);
    setTrackingAttempt((attempt) => attempt + 1);
  };

  const beginManualPin = () => {
    manualOriginRef.current = false;
    setPinStartMode(true);
    setPinCursor(true);
  };

  const returnToGps = () => {
    manualOriginRef.current = false;
    setPinStartMode(false);
    setPinCursor(false);
    setOrigin(null);
    setRoute(null);
    lastRouteRef.current = null;
    setLocating(true);
    setTrackingAttempt((attempt) => attempt + 1);
  };

  const recenterMap = () => {
    if (renderer === 'maplibre' && mapLibreRef.current) {
      const map = mapLibreRef.current;
      if (routePointsRef.current.length) map.fitBounds(mapLibreBounds(routePointsRef.current), { padding: 40, maxZoom: 17 });
      else if (origin) map.fitBounds([[origin.longitude, origin.latitude], [destination[1], destination[0]]], { padding: 40, maxZoom: 16 });
      else map.flyTo({ center: [destination[1], destination[0]], zoom: 15 });
      return;
    }
    const map = leafletMapRef.current;
    if (!map) return;
    if (routeLineRef.current) {
      const bounds = routeLineRef.current.getBounds();
      accessLinesRef.current.forEach((line) => bounds.extend(line.getBounds()));
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
    } else if (origin) map.fitBounds(L.latLngBounds([origin.latitude, origin.longitude], destination), { padding: [36, 36], maxZoom: 16 });
    else map.setView(destination, 15);
  };

  const selectTravelMode = (mode: TravelMode) => {
    if (mode === travelMode) return;
    setRoute(null);
    setRouteError('');
    lastRouteRef.current = null;
    shouldFitRouteRef.current = true;
    routeLineRef.current?.remove();
    routeLineRef.current = null;
    accessLinesRef.current.forEach((line) => line.remove());
    accessLinesRef.current = [];
    setTravelMode(mode);
  };

  const locationStatus = origin?.source === 'manual' ? 'Start point pinned' : origin && origin.accuracy > 250 ? 'Weak GPS signal' : origin ? 'Live location' : locating ? 'Finding location' : 'Location unavailable';
  const googleMapsUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination[0]},${destination[1]}&travelmode=${travelMode === 'walking' ? 'walking' : travelMode === 'bicycling' ? 'bicycling' : 'driving'}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination[0]},${destination[1]}`;
  const locationStatusColor = origin?.source === 'manual' ? 'bg-teal-300' : origin && origin.accuracy > 250 ? 'bg-amber-300' : origin ? 'bg-emerald-300' : 'bg-slate-400';

  return (
    <aside aria-label="Live directions map" className="fixed z-40 bottom-4 right-4 sm:bottom-6 sm:right-6 w-[min(390px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white border border-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.18)] rounded-md">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-[#123b39] text-white">
        <div className="min-w-0">
          <div className="text-sm font-bold">Navigate to health center</div>
          <div className="text-[11px] text-white/75 truncate">{destinationName}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/80"><span className={`h-1.5 w-1.5 rounded-full ${locationStatusColor} ${origin?.source === 'gps' && origin.accuracy <= 250 ? 'animate-pulse' : ''}`} />{locationStatus}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={recenterMap} aria-label="Recenter map" title="Recenter map" className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md"><LocateFixed className="w-4 h-4" /></button>
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand map' : 'Collapse map'} title={collapsed ? 'Expand map' : 'Collapse map'} className="p-2 text-white/85 hover:text-white hover:bg-white/10 rounded-md">{collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
        </div>
      </header>

      {!collapsed && <>
        <div className="grid grid-cols-4 border-b border-slate-200" role="group" aria-label="Travel mode">
          {modes.map((mode) => (
            <button key={mode.id} type="button" onClick={() => selectTravelMode(mode.id)} aria-pressed={travelMode === mode.id} className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-r last:border-r-0 border-slate-200 ${travelMode === mode.id ? 'bg-[#e5f0eb] text-teal-950' : 'text-slate-600 hover:bg-slate-50'}`}>
              {mode.icon}<span>{mode.label}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <div ref={mapElementRef} className="h-[260px] w-full bg-slate-100" aria-label="Dark map showing your live location, the health center, and route" />
          {pinStartMode && <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg"><span>Tap your actual location on the map</span><button type="button" onClick={() => { setPinStartMode(false); setPinCursor(false); }} className="text-teal-900 underline">Cancel</button></div>}
        </div>

        <div className="px-4 py-3">
          {mapError && <p role="alert" className="mb-2 text-xs text-rose-800">{mapError}</p>}
          {route && <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><MapPin className="w-4 h-4 text-teal-800" /><span>{modeLabels[travelMode]} · {formatDistance(route.distance)} · about {formatDuration(route.duration)}</span></div>}
          {(travelMode === 'driving' || travelMode === 'motorcycle') && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2"><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 underline underline-offset-2">Open navigation <ExternalLink className="w-3.5 h-3.5" /></a><a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 underline underline-offset-2">Open in Waze <ExternalLink className="w-3.5 h-3.5" /></a></div>}
          {route?.maneuvers[0] && <p className="mt-2 border-l-2 border-teal-700 pl-3 text-xs font-semibold text-slate-700">{route.maneuvers[0].instruction}</p>}
          {route && route.distance > route.straightLineDistance * 1.5 && <p className="mt-1 text-[11px] text-slate-600">Straight-line distance is {formatDistance(route.straightLineDistance)}; this route follows connected mapped streets.</p>}
          {route && (route.startAccessDistance > 20 || route.endAccessDistance > 20) && <p className="mt-1 text-[11px] text-slate-600">Dotted links show the straight-line gap to nearest mapped roads ({formatDistance(route.startAccessDistance)} from start, {formatDistance(route.endAccessDistance)} at clinic).</p>}
          {locating && <p className="text-xs text-slate-600">Requesting your location…</p>}
          {locationError && <div className="flex items-center justify-between gap-3"><p role="alert" className="text-xs text-rose-800">{locationError}</p><button type="button" onClick={retryLocation} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-teal-900"><RefreshCw className="w-3.5 h-3.5" />Retry</button></div>}
          {routeError && <p role="alert" className="mt-1 text-xs text-rose-800">{routeError}</p>}
          {origin?.source === 'manual' && <p className="mt-1 text-[11px] font-semibold text-teal-900">Start point selected manually; no GPS accuracy is implied.</p>}
          {origin?.source !== 'manual' && origin && <p className={`mt-1 text-[11px] ${origin.accuracy > 250 ? 'font-semibold text-amber-800' : 'text-slate-500'}`}>{origin.accuracy > 250 ? 'Approximate start location' : 'GPS accuracy'} · about {formatDistance(origin.accuracy)}{route?.approximate ? ' · path is approximate' : ''}</p>}
          {origin?.source === 'manual' && <button type="button" onClick={returnToGps} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-900 underline underline-offset-2"><LocateFixed className="w-3.5 h-3.5" />Use live GPS instead</button>}
          {origin?.source !== 'manual' && origin && origin.accuracy > 250 && !pinStartMode && <button type="button" onClick={beginManualPin} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-900 underline underline-offset-2"><MapPin className="w-3.5 h-3.5" />Pin my actual start on map</button>}
          <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />Live OpenStreetMap routing by travel mode. Routes and estimates change for walking, cycling, driving, and motorcycle travel.</p>
        </div>
      </>}
    </aside>
  );
};

