"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// @ts-ignore
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface Property {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    pricePerYear: number;
    city: string;
    image?: string;
}

interface MapProps {
    properties: Property[];
    onPropertyClick?: (propertyId: string) => void;
    onBoundsChange?: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
    onPolygonChange?: (polygon: [number, number][] | null) => void;
    center?: [number, number];
    zoom?: number;
    autoFit?: boolean;
}

export function Map({ properties, onPropertyClick, onBoundsChange, onPolygonChange, center = [7.4905, 9.0765], zoom = 6, autoFit = true }: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const draw = useRef<any>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState("streets-v12");
    const [isDrawing, setIsDrawing] = useState(false);
    const [activePOIs, setActivePOIs] = useState<string[]>([]);
    const [commuteOrigin, setCommuteOrigin] = useState<[number, number] | null>(null);
    const [isCommuteMode, setIsCommuteMode] = useState(false);

    // Use refs for callbacks to avoid stale closures in map event listeners
    const onBoundsChangeRef = useRef(onBoundsChange);
    const onPropertyClickRef = useRef(onPropertyClick);
    const onPolygonChangeRef = useRef(onPolygonChange);

    useEffect(() => {
        onBoundsChangeRef.current = onBoundsChange;
        onPropertyClickRef.current = onPropertyClick;
        onPolygonChangeRef.current = onPolygonChange;
    }, [onBoundsChange, onPropertyClick, onPolygonChange]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: center,
            zoom: zoom,
        });

        const mapInstance = map.current;

        mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        });
        mapInstance.addControl(geolocate, "top-right");

        // Initialize Draw
        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            },
            defaultMode: 'simple_select'
        });
        mapInstance.addControl(draw.current, "top-right");

        const updatePolygon = () => {
            const data = draw.current.getAll();
            if (data.features.length > 0) {
                const coords = data.features[0].geometry.coordinates[0];
                onPolygonChangeRef.current?.(coords);
                setIsDrawing(true);
            } else {
                onPolygonChangeRef.current?.(null);
                setIsDrawing(false);
            }
        };

        mapInstance.on('draw.create', updatePolygon);
        mapInstance.on('draw.delete', updatePolygon);
        mapInstance.on('draw.update', updatePolygon);

        mapInstance.on("load", () => {
            setMapLoaded(true);
        });

        mapInstance.on("moveend", () => {
            if (onBoundsChangeRef.current && mapInstance) {
                const bounds = mapInstance.getBounds();
                if (bounds) {
                    onBoundsChangeRef.current({
                        neLat: bounds.getNorthEast().lat,
                        neLng: bounds.getNorthEast().lng,
                        swLat: bounds.getSouthWest().lat,
                        swLng: bounds.getSouthWest().lng,
                    });
                }
            }
        });

        return () => {
            mapInstance?.remove();
            map.current = null;
        };
    }, []);

    // Update markers and clustering when properties change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const mapInstance = map.current;

        const onDataLoad = () => {
            // Transform properties to GeoJSON
            const geojson: GeoJSON.FeatureCollection = {
                type: "FeatureCollection",
                features: properties
                    .filter(p => p.latitude && p.longitude)
                    .map((p) => ({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [p.longitude, p.latitude],
                        },
                        properties: {
                            id: p.id,
                            title: p.title,
                            price: p.pricePerYear,
                            city: p.city,
                            image: p.image,
                            priceAbbr: p.pricePerYear >= 1000000
                                ? `₦${(p.pricePerYear / 1000000).toFixed(1)}M`
                                : `₦${(p.pricePerYear / 1000).toFixed(0)}k`,
                        },
                    })),
            };

            // Create custom white card marker (Google Flights style)
            if (!mapInstance.hasImage("price-card")) {
                const width = 100;
                const height = 60;
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    // Add shadow
                    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 2;

                    ctx.fillStyle = "#FFFFFF";
                    ctx.beginPath();
                    // Draw rounded rectangle
                    const r = 8;
                    ctx.moveTo(r, 0);
                    ctx.lineTo(width - r, 0);
                    ctx.quadraticCurveTo(width, 0, width, r);
                    ctx.lineTo(width, height - r);
                    ctx.quadraticCurveTo(width, height, width - r, height);
                    ctx.lineTo(r, height);
                    ctx.quadraticCurveTo(0, height, 0, height - r);
                    ctx.lineTo(0, r);
                    ctx.quadraticCurveTo(0, 0, r, 0);
                    ctx.fill();

                    const imageData = ctx.getImageData(0, 0, width, height);
                    mapInstance.addImage("price-card", imageData, {
                        pixelRatio: 2,
                        stretchX: [[width / 3, (width * 2) / 3]],
                        stretchY: [[height / 3, (height * 2) / 3]],
                        content: [8, 8, width - 8, height - 8]
                    });
                }
            }

            // Update or add source
            if (mapInstance.getSource("properties")) {
                (mapInstance.getSource("properties") as mapboxgl.GeoJSONSource).setData(geojson);
            } else {
                mapInstance.addSource("properties", {
                    type: "geojson",
                    data: geojson,
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50,
                });

                // Cluster Layer (Circles)
                mapInstance.addLayer({
                    id: "clusters",
                    type: "circle",
                    source: "properties",
                    filter: ["has", "point_count"],
                    paint: {
                        "circle-color": [
                            "step",
                            ["get", "point_count"],
                            "#00A651",
                            10,
                            "#f1f075",
                            30,
                            "#f28cb1",
                        ],
                        "circle-radius": [
                            "step",
                            ["get", "point_count"],
                            20,
                            100,
                            30,
                            750,
                            40,
                        ],
                        "circle-stroke-width": 2,
                        "circle-stroke-color": "#fff",
                    },
                });

                // Cluster Count Text
                mapInstance.addLayer({
                    id: "cluster-count",
                    type: "symbol",
                    source: "properties",
                    filter: ["has", "point_count"],
                    layout: {
                        "text-field": "{point_count}",
                        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                        "text-size": 14,
                    },
                    paint: {
                        "text-color": "#ffffff",
                    },
                });

                // Unclustered Point Layer (Price Tags as Pills)
                mapInstance.addLayer({
                    id: "unclustered-point",
                    type: "symbol",
                    source: "properties",
                    filter: ["!", ["has", "point_count"]],
                    layout: {
                        "icon-image": "price-card",
                        "icon-size": 0.8,
                        "icon-text-fit": "both",
                        "icon-text-fit-padding": [10, 12, 10, 12],
                        "text-field": [
                            "format",
                            ["get", "city"],
                            { "font-scale": 0.7, "text-color": "#64748b" },
                            "\n",
                            {},
                            ["get", "priceAbbr"],
                            { "font-scale": 1.1, "text-color": "#00A651" }
                        ],
                        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                        "text-size": 11,
                        "text-anchor": "center",
                        "text-line-height": 1.2,
                    },
                    paint: {},
                });

                // Click on cluster to zoom in
                mapInstance.on("click", "clusters", (e) => {
                    const features = mapInstance.queryRenderedFeatures(e.point, {
                        layers: ["clusters"],
                    });
                    const clusterId = features[0].properties?.cluster_id;
                    (mapInstance.getSource("properties") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
                        clusterId,
                        (err, zoom) => {
                            if (err || zoom === null || zoom === undefined) return;
                            mapInstance.easeTo({
                                center: (features[0].geometry as any).coordinates,
                                zoom: zoom,
                            });
                        }
                    );
                });

                // Hover popups for unclustered points
                const popup = new mapboxgl.Popup({
                    offset: 15,
                    closeButton: false,
                    closeOnClick: false,
                    maxWidth: "240px",
                });

                mapInstance.on("mouseenter", "unclustered-point", (e) => {
                    mapInstance.getCanvas().style.cursor = "pointer";
                    if (!e.features || !e.features[0]) return;

                    const feature = e.features[0];
                    const coords = (feature.geometry as any).coordinates.slice();
                    const props = feature.properties;

                    popup.setLngLat(coords).setHTML(`
                        <div style="overflow: hidden; border-radius: 12px; font-family: sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: white;">
                            <img src="${props?.image || "https://images.unsplash.com/photo-1600585154340-be6191da96a0?auto=format&fit=crop&w=800&q=80"}" 
                                 style="width: 100%; height: 120px; object-fit: cover; display: block;" 
                                 alt="${props?.title}"/>
                            <div style="padding: 12px;">
                                <h4 style="font-size: 14px; font-weight: 700; margin: 0; color: #1a237e; line-height: 1.3;">
                                    ${props?.title}
                                </h4>
                                <div style="display: flex; align-items: baseline; gap: 4px; margin-top: 8px;">
                                    <span style="font-size: 16px; font-weight: 800; color: #00A651;">
                                        ${props?.priceAbbr}
                                    </span>
                                    <span style="font-size: 11px; color: #64748b;">/year</span>
                                </div>
                            </div>
                        </div>
                    `).addTo(mapInstance);
                });

                mapInstance.on("mouseleave", "unclustered-point", () => {
                    mapInstance.getCanvas().style.cursor = "";
                    popup.remove();
                });

                // Click on unclustered point
                mapInstance.on("click", "unclustered-point", (e) => {
                    const id = e.features?.[0].properties?.id;
                    if (id && onPropertyClickRef.current) {
                        onPropertyClickRef.current(id);
                    }
                });
            }
        };

        if (mapInstance.isStyleLoaded()) {
            onDataLoad();
        } else {
            mapInstance.on("style.load", onDataLoad);
        }

        // Fit bounds to show all properties
        if (autoFit && properties.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            properties.forEach((property) => {
                if (property.latitude && property.longitude) {
                    bounds.extend([property.longitude, property.latitude]);
                }
            });
            mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        }
    }, [properties, mapLoaded, onPropertyClick, autoFit, mapStyle]);

    // Style Switcher
    const changeStyle = (styleId: string) => {
        setMapStyle(styleId);
        map.current?.setStyle(`mapbox://styles/mapbox/${styleId}`);
    };

    // POI Toggle Logic
    const togglePOI = (category: string) => {
        setActivePOIs(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Fetch and show POIs
    useEffect(() => {
        if (!map.current || !mapLoaded || activePOIs.length === 0) {
            if (map.current?.getSource('pois')) {
                (map.current.getSource('pois') as mapboxgl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
            }
            return;
        }

        const fetchPOIs = async () => {
            const center = map.current?.getCenter();
            if (!center) return;

            const categoryStr = activePOIs.join(',');
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${categoryStr}.json?proximity=${center.lng},${center.lat}&access_token=${mapboxgl.accessToken}&limit=20`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                if (map.current?.getSource('pois')) {
                    (map.current.getSource('pois') as mapboxgl.GeoJSONSource).setData(data);
                } else {
                    map.current?.addSource('pois', {
                        type: 'geojson',
                        data: data
                    });

                    map.current?.addLayer({
                        id: 'pois-layer',
                        type: 'symbol',
                        source: 'pois',
                        layout: {
                            'icon-image': ['match', ['get', 'category'], 'school', 'school', 'cafe', 'cafe', 'hospital', 'hospital', 'dot-11'],
                            'icon-size': 1.5,
                            'text-field': ['get', 'text'],
                            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                            'text-offset': [0, 1.25],
                            'text-anchor': 'top',
                            'text-size': 10
                        },
                        paint: {
                            'text-color': '#475569',
                            'text-halo-color': '#fff',
                            'text-halo-width': 1
                        }
                    });
                }
            } catch (e) {
                console.error("POI fetch error", e);
            }
        };

        fetchPOIs();
    }, [activePOIs, mapLoaded]);

    // Isochrone / Commute Filter
    useEffect(() => {
        if (!map.current || !mapLoaded || !commuteOrigin) {
            if (map.current?.getSource('isochrone')) {
                (map.current.getSource('isochrone') as mapboxgl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
            }
            return;
        }

        const fetchIsochrone = async () => {
            const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${commuteOrigin[0]},${commuteOrigin[1]}?contours_minutes=15&polygons=true&access_token=${mapboxgl.accessToken}`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                if (map.current?.getSource('isochrone')) {
                    (map.current.getSource('isochrone') as mapboxgl.GeoJSONSource).setData(data);
                } else {
                    map.current?.addSource('isochrone', {
                        type: 'geojson',
                        data: data
                    });

                    map.current?.addLayer({
                        id: 'isochrone-layer',
                        type: 'fill',
                        source: 'isochrone',
                        layout: {},
                        paint: {
                            'fill-color': '#00A651',
                            'fill-opacity': 0.2,
                            'fill-outline-color': '#00A651'
                        }
                    }, 'clusters'); // Place below properties
                }
            } catch (e) {
                console.error("Isochrone fetch error", e);
            }
        };

        fetchIsochrone();
    }, [commuteOrigin, mapLoaded]);

    // Handle map click for commute mode
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const mapInstance = map.current;

        const onMapClick = (e: mapboxgl.MapMouseEvent & any) => {
            if (isCommuteMode) {
                setCommuteOrigin([e.lngLat.lng, e.lngLat.lat]);
                setIsCommuteMode(false);
            }
        };

        mapInstance.on('click', onMapClick);
        return () => {
            mapInstance.off('click', onMapClick);
        };
    }, [isCommuteMode, mapLoaded]);

    // Add 3D buildings on style change
    useEffect(() => {
        if (!map.current) return;
        const mapInstance = map.current;

        const onStyleLoad = () => {
            // Add 3D building layer
            const layers = mapInstance.getStyle().layers;
            const labelLayerId = layers?.find(
                (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
            )?.id;

            if (!mapInstance.getLayer("3d-buildings")) {
                mapInstance.addLayer(
                    {
                        id: "3d-buildings",
                        source: "composite",
                        "source-layer": "building",
                        filter: ["==", "extrude", "true"],
                        type: "fill-extrusion",
                        minzoom: 15,
                        paint: {
                            "fill-extrusion-color": "#aaa",
                            "fill-extrusion-height": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                15,
                                0,
                                15.05,
                                ["get", "height"],
                            ],
                            "fill-extrusion-base": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                15,
                                0,
                                15.05,
                                ["get", "min_height"],
                            ],
                            "fill-extrusion-opacity": 0.6,
                        },
                    },
                    labelLayerId
                );
            }
        };

        mapInstance.on("style.load", onStyleLoad);
        return () => {
            mapInstance.off("style.load", onStyleLoad);
        };
    }, []);

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg" style={{ minHeight: "400px" }}>
            <style jsx global>{`
                .mapboxgl-popup-content {
                    padding: 0 !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .mapboxgl-popup-tip {
                    display: none !important;
                }
            `}</style>

            {/* Style Switcher & POI Toggles */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-4">
                {/* Map Styles */}
                <div className="flex flex-col gap-2">
                    {[
                        { id: "streets-v12", label: "Street", icon: "📍" },
                        { id: "satellite-streets-v12", label: "Satellite", icon: "🛰️" },
                        { id: "light-v11", label: "Light", icon: "⚪" },
                        { id: "dark-v11", label: "Dark", icon: "⚫" },
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => changeStyle(style.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 ${mapStyle === style.id
                                ? "bg-[var(--color-brand-blue)] text-white scale-105"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <span>{style.icon}</span>
                            <span className="hidden md:inline">{style.label}</span>
                        </button>
                    ))}
                </div>

                {/* Neighborhood Context */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Neighborhood</p>
                    {[
                        { id: "school", label: "Schools", icon: "🏫" },
                        { id: "cafe", label: "Cafes", icon: "☕" },
                        { id: "hospital", label: "Hospitals", icon: "🏥" },
                        { id: "grocery", label: "Groceries", icon: "🛒" },
                    ].map((poi) => (
                        <button
                            key={poi.id}
                            onClick={() => togglePOI(poi.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 ${activePOIs.includes(poi.id)
                                ? "bg-green-600 text-white scale-105"
                                : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <span>{poi.icon}</span>
                            <span className="hidden md:inline">{poi.label}</span>
                        </button>
                    ))}
                    {/* Commute Filter */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Commute</p>
                        <button
                            onClick={() => setIsCommuteMode(!isCommuteMode)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-2 ${isCommuteMode
                                ? "bg-amber-500 text-white scale-105 animate-pulse"
                                : commuteOrigin
                                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <span>🚗</span>
                            <span className="hidden md:inline">
                                {isCommuteMode ? "Click Map..." : commuteOrigin ? "15m Drive Area" : "Set Commute"}
                            </span>
                        </button>
                        {commuteOrigin && (
                            <button
                                onClick={() => setCommuteOrigin(null)}
                                className="px-3 py-1 text-[10px] font-bold text-red-500 hover:text-red-700 underline flex justify-center"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isCommuteMode && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <span>Click anywhere on the map to set your commute center</span>
                </div>
            )}

            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
