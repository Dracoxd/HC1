import React, { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource as MapLibreGeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, CarFront, ChevronDown, ChevronUp, ExternalLink, LocateFixed, MapPin, PersonStanding, RefreshCw } from 'lucide-react';

type TravelMode = 'walking' | 'bicycling' | 'driving' | 'motorcycle';
type Renderer = 'maplibre' | 'leaflet';
type Position = { latitude: number; longitude: number; accuracy: number; heading?: number | null; source?: 'gps' | 'manual' };
type RouteManeuver = { instruction: string; length: number; time: number };
type OsrmRouteResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> };
    legs: Array<{
      steps: Array<{
        distance: number;
        duration: number;
        name: string;
        maneuver: { type: string; modifier?: string };
      }>;
    }>;
  }>;
  waypoints?: Array<{ location: [number, number] }>;
};
type RouteInfo = {
  distance: number;
  duration: number;
  approximate: boolean;
  startAccessDistance: number;
  endAccessDistance: number;
  straightLineDistance: number;
  maneuvers: RouteManeuver[];
};

type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const destination: L.LatLngTuple = [14.5472886, 121.0659399];
const destinationName = 'Mayor Moises R. Flores Health Center';
const wazeUrl = `https://www.waze.com/ul?ll=${destination[0]}%2C${destination[1]}&navigate=yes`;
const routingProfiles: Record<TravelMode, string> = {
  walking: 'routed-foot',
  bicycling: 'routed-bike',
  driving: 'routed-car',
  motorcycle: 'routed-car',
};
const routeColors: Record<TravelMode, string> = {
  walking: '#22c55e',
  bicycling: '#f59e0b',
  driving: '#38bdf8',
  motorcycle: '#ef4444',
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

function shouldAcceptPosition(current: Position, next: Position) {
  const movement = distanceBetween(current, next);
  if (next.accuracy < current.accuracy * 0.8) return true;
  if (next.accuracy <= 250 && movement > Math.max(40, current.accuracy, next.accuracy)) return true;
  return next.accuracy < current.accuracy;
}

function isValidCoordinate(longitude: number, latitude: number) {
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    && longitude >= -180 && longitude <= 180
    && latitude >= -90 && latitude <= 90;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

function maneuverInstruction(type: string, modifier?: string, street?: string) {
  const road = street ? ` onto ${street}` : '';
  if (type === 'depart') return `Head ${modifier?.replace('-', ' ') ?? 'ahead'}${street ? ` on ${street}` : ''}.`;
  if (type === 'arrive') return 'Arrive at the health center.';
  if (type === 'roundabout' || type === 'rotary') return `Enter the roundabout${road}.`;
  return `Turn ${modifier?.replace('-', ' ') ?? 'ahead'}${road}.`;
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
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 639px)').matches);
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
  const activeRouteRequestRef = useRef<{ position: Position; mode: TravelMode; controller: AbortController } | null>(null);
  const currentOriginRef = useRef(origin);
  const currentTravelModeRef = useRef(travelMode);
  const currentRendererRef = useRef(renderer);
  currentOriginRef.current = origin;
  currentTravelModeRef.current = travelMode;
  currentRendererRef.current = renderer;
  const shouldFitRouteRef = useRef(true);
  const manualOriginRef = useRef(false);
  const pinStartModeRef = useRef(false);
  const fallbackUsedRef = useRef(false);
  pinStartModeRef.current = pinStartMode;

  const setPinCursor = (enabled: boolean) => {
    mapLibreRef.current?.getCanvasContainer().classList.toggle('route-start-pin-mode', enabled);
    leafletMapRef.current?.getContainer().classList.toggle('route-start-pin-mode', enabled);
  };

  const clearRenderedRoute = () => {
    routePointsRef.current = [];
    routeLineRef.current?.remove();
    routeLineRef.current = null;
    accessLinesRef.current.forEach((line) => line.remove());
    accessLinesRef.current = [];
    (mapLibreRef.current?.getSource('route') as MapLibreGeoJSONSource | undefined)?.setData(emptyFeatures);
    (mapLibreRef.current?.getSource('access-links') as MapLibreGeoJSONSource | undefined)?.setData(emptyFeatures);
  };

  useEffect(() => () => {
    activeRouteRequestRef.current?.controller.abort();
    activeRouteRequestRef.current = null;
  }, []);

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
          setRoute(null);
          setRouteError('');
          clearRenderedRoute();
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
      setRoute(null);
      setRouteError('');
      clearRenderedRoute();
      shouldFitRouteRef.current = true;
      lastRouteRef.current = null;
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
    if (collapsed) return;
    const frame = requestAnimationFrame(() => {
      mapLibreRef.current?.resize();
      leafletMapRef.current?.invalidateSize({ pan: false });
    });
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
          const nextPosition: Position = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: nextAccuracy,
            heading: coords.heading,
            source: 'gps',
          };
          if (!isValidCoordinate(nextPosition.longitude, nextPosition.latitude) || !Number.isFinite(nextPosition.accuracy)) {
            setLocationError('Your device returned an invalid location. Retry GPS or pin your start manually.');
            setLocating(false);
            return;
          }
          setLocationError('');
          setOrigin((current) => {
            if (!current || current.source === 'manual' || shouldAcceptPosition(current, nextPosition)) return nextPosition;
            return current;
          });
        }
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location permission was denied. Enable it in browser settings or pin your start manually.' : 'Could not determine location. Check GPS or network reception.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
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
    if (origin.source !== 'manual' && origin.accuracy > 250) {
      activeRouteRequestRef.current?.controller.abort();
      activeRouteRequestRef.current = null;
      lastRouteRef.current = null;
      setRoute(null);
      setRouteError('');
      clearRenderedRoute();
      return;
    }

    const previous = lastRouteRef.current;
    const changedConfidence = previous && (previous.position.accuracy > 250) !== (origin.accuracy > 250);
    if (previous && !changedConfidence && previous.mode === travelMode && distanceBetween(previous.position, origin) < 40 && Date.now() - previous.timestamp < 20000) return;
    const activeRequest = activeRouteRequestRef.current;
    if (activeRequest && activeRequest.mode === travelMode
      && (activeRequest.position.accuracy > 250) === (origin.accuracy > 250)
      && distanceBetween(activeRequest.position, origin) < 40) return;

    const approximate = origin.source !== 'manual' && origin.accuracy > 250;
    const controller = new AbortController();
    if (activeRequest) activeRequest.controller.abort();
    activeRouteRequestRef.current = { position: origin, mode: travelMode, controller };
    const timeout = window.setTimeout(async () => {
      const requestDeadline = window.setTimeout(() => controller.abort('route-timeout'), 15000);
      setRouteError('');
      const profile = routingProfiles[travelMode];
      const coordinates = `${origin.longitude},${origin.latitude};${destination[1]},${destination[0]}`;
      const url = `https://routing.openstreetmap.de/${profile}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=false&continue_straight=false`;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Routing service is unavailable.');
        const result = await response.json() as OsrmRouteResponse;
        const trip = result.routes?.[0];
        if (result.code !== 'Ok' || !trip?.legs?.[0]) {
          throw new Error(result.message || 'No route was found for this travel mode.');
        }
        const points = trip.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngTuple);
        if (points.length < 2 || points.some(([latitude, longitude]) => !isValidCoordinate(longitude, latitude))) {
          throw new Error('The routing service returned an invalid path.');
        }
        const [startSnap, endSnap] = result.waypoints ?? [];
        if (!startSnap || !endSnap
          || !isValidCoordinate(startSnap.location[0], startSnap.location[1])
          || !isValidCoordinate(endSnap.location[0], endSnap.location[1])) {
          throw new Error('The routing service did not return valid route endpoints.');
        }
        const startAccessDistance = distanceBetweenLatLng(
          [origin.latitude, origin.longitude],
          [startSnap.location[1], startSnap.location[0]],
        );
        const endAccessDistance = distanceBetweenLatLng(
          destination,
          [endSnap.location[1], endSnap.location[0]],
        );
        const straightLineDistance = distanceBetweenLatLng([origin.latitude, origin.longitude], destination);
        const maximumStartSnapDistance = origin.source === 'manual'
          ? 250
          : Math.min(300, Math.max(100, origin.accuracy * 1.5));
        if (startAccessDistance > maximumStartSnapDistance) {
          throw new Error('The nearest mapped road is too far from your start point. Pin your location closer to a street and try again.');
        }
        if (endAccessDistance > 150) {
          throw new Error('The health center is too far from the nearest mapped road. Please report this map issue.');
        }
        const accessFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = { type: 'FeatureCollection', features: [] };
        if (startAccessDistance > 5 && startAccessDistance <= maximumStartSnapDistance) accessFeatures.features.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [[origin.longitude, origin.latitude], startSnap.location] },
        });
        if (endAccessDistance > 5 && endAccessDistance <= 150) accessFeatures.features.push({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [endSnap.location, [destination[1], destination[0]]] },
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
          const routeColor = routeColors[travelMode];
          map.setPaintProperty('route-line', 'line-color', routeColor);
          map.setPaintProperty('route-line-approx', 'line-color', routeColor);
          map.setPaintProperty('access-lines', 'line-color', routeColor);
          map.setLayoutProperty('route-line', 'visibility', approximate ? 'none' : 'visible');
          map.setLayoutProperty('route-line-approx', 'visibility', approximate ? 'visible' : 'none');
          if (shouldFitRouteRef.current) {
            map.fitBounds(mapLibreBounds([
              ...coordinates,
              [origin.longitude, origin.latitude],
              [destination[1], destination[0]],
            ]), { padding: 40, maxZoom: 17, duration: 0 });
            shouldFitRouteRef.current = false;
          }
        } else if (renderer === 'leaflet' && leafletMapRef.current) {
          const map = leafletMapRef.current;
          routeLineRef.current?.remove();
          accessLinesRef.current.forEach((line) => line.remove());
          accessLinesRef.current = [];
          const routeColor = routeColors[travelMode];
          routeLineRef.current = L.polyline(points, { color: approximate ? '#f0ad4e' : routeColor, weight: 6, opacity: 1, dashArray: approximate ? '10 8' : undefined }).addTo(map);
          accessFeatures.features.forEach((feature) => {
            const accessPoints = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple);
            accessLinesRef.current.push(L.polyline(accessPoints, { color: approximate ? '#f0ad4e' : routeColor, weight: 4, opacity: 0.95, dashArray: '3 7' }).addTo(map));
          });
          if (shouldFitRouteRef.current) {
            const bounds = routeLineRef.current.getBounds();
            accessLinesRef.current.forEach((line) => bounds.extend(line.getBounds()));
            bounds.extend([origin.latitude, origin.longitude]);
            bounds.extend(destination);
            map.fitBounds(bounds, { padding: [36, 36], maxZoom: 17 });
            shouldFitRouteRef.current = false;
          }
        }
        const maneuvers = trip.legs.flatMap((leg) => leg.steps)
          .filter((step) => step.distance > 0)
          .map((step) => ({
            instruction: maneuverInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
            length: step.distance / 1000,
            time: step.duration,
          }));
        lastRouteRef.current = { position: origin, mode: travelMode, timestamp: Date.now() };
        setRoute({ distance: trip.distance, duration: trip.duration, approximate, startAccessDistance, endAccessDistance, straightLineDistance, maneuvers });
      } catch (error) {
        if (controller.signal.reason === 'route-timeout') {
          setRoute(null);
          clearRenderedRoute();
          setRouteError('The routing service took too long to respond. Retry or open the route in a navigation app.');
          return;
        }
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRoute(null);
        clearRenderedRoute();
        setRouteError(error instanceof Error ? error.message : 'Could not calculate this route.');
      } finally {
        window.clearTimeout(requestDeadline);
        if (activeRouteRequestRef.current?.controller === controller) activeRouteRequestRef.current = null;
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      const active = activeRouteRequestRef.current;
      const currentOrigin = currentOriginRef.current;
      const confidenceChanged = Boolean(active && currentOrigin
        && (active.position.accuracy > 250) !== (currentOrigin.accuracy > 250));
      if (active?.controller === controller && (
        currentTravelModeRef.current !== travelMode
        || currentRendererRef.current !== renderer
        || !currentOrigin
        || confidenceChanged
        || distanceBetween(active.position, currentOrigin) >= 40
      )) {
        controller.abort();
        activeRouteRequestRef.current = null;
      }
    };
  }, [origin, travelMode, mapReady, renderer]);

  const retryLocation = () => {
    manualOriginRef.current = false;
    setPinStartMode(false);
    setPinCursor(false);
    setOrigin(null);
    setRoute(null);
    setLocationError('');
    setRouteError('');
    lastRouteRef.current = null;
    shouldFitRouteRef.current = true;
    clearRenderedRoute();
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
    clearRenderedRoute();
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
    clearRenderedRoute();
    setTravelMode(mode);
  };

  const locationStatus = origin?.source === 'manual' ? 'Start point pinned' : origin && origin.accuracy > 250 ? 'Weak GPS signal' : origin ? 'Live location' : locating ? 'Finding location' : 'Location unavailable';
  const googleMapsUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination[0]},${destination[1]}&travelmode=${travelMode === 'walking' ? 'walking' : travelMode === 'bicycling' ? 'bicycling' : 'driving'}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination[0]},${destination[1]}`;
  const locationStatusColor = origin?.source === 'manual' ? 'bg-teal-300' : origin && origin.accuracy > 250 ? 'bg-amber-300' : origin ? 'bg-emerald-300' : 'bg-slate-400';

  return (
    <section className="route-enter relative z-10 mx-auto w-full max-w-[1500px] px-4 py-3 sm:px-8">
    <aside aria-label="Live directions map" className="ml-auto max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[360px] overflow-y-auto rounded-sm border border-[#d7dfda] bg-[#fcfdfb] shadow-[0_10px_32px_rgba(23,58,55,0.18)]">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0f4d3c] text-white">
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

      <div className={collapsed ? 'hidden' : ''}>
        <div className="grid grid-cols-4 border-b border-slate-200" role="group" aria-label="Travel mode">
          {modes.map((mode) => (
            <button key={mode.id} type="button" onClick={() => selectTravelMode(mode.id)} aria-pressed={travelMode === mode.id} className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 border-r border-[#dfe6e1] py-2 text-[11px] font-bold last:border-r-0 sm:flex-row ${travelMode === mode.id ? 'bg-[#dce9e2] text-[#173a37]' : 'text-slate-600 hover:bg-[#f4f7f4]'}`}>
              {mode.icon}<span>{mode.label}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <div ref={mapElementRef} className="h-[190px] sm:h-[220px] w-full bg-slate-100" aria-label="Dark map showing your live location, the health center, and route" />
          {pinStartMode && <div className="absolute left-2 right-2 top-2 z-[1000] flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg"><span>Tap your actual location on the map</span><button type="button" onClick={() => { setPinStartMode(false); setPinCursor(false); }} className="text-teal-900 underline">Cancel</button></div>}
        </div>

        <div className="px-4 py-3">
          {mapError && <p role="alert" className="mb-2 text-xs text-rose-800">{mapError}</p>}
          {origin?.source !== 'manual' && origin && origin.accuracy > 250 && <p role="status" className="mb-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Your device reports about {formatDistance(origin.accuracy)} of location uncertainty. Directions are paused to avoid showing a misleading route; pin your start point or wait for a more accurate GPS fix.</p>}
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
          {origin?.source !== 'manual' && (!origin || origin.accuracy > 250) && !pinStartMode && <button type="button" onClick={beginManualPin} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-900 underline underline-offset-2"><MapPin className="w-3.5 h-3.5" />Pin my actual start on map</button>}
          <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />OpenStreetMap routes use walking, cycling, or road-vehicle paths; motorcycle uses the road-vehicle profile.</p>
        </div>
      </div>
    </aside>
    </section>
  );
};
