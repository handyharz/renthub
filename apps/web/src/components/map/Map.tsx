"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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

const formatAbbrPrice = (price: number): string => {
    if (!price || isNaN(price)) return "₦0";
    if (price >= 1000000) {
        const val = price / 1000000;
        return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
    }
    if (price >= 1000) {
        return `₦${(price / 1000).toFixed(0)}k`;
    }
    return `₦${price.toLocaleString()}`;
};

export function Map({
    properties,
    onPropertyClick,
    onBoundsChange,
    onPolygonChange,
    center = [7.4905, 9.0765],
    zoom = 6,
    autoFit = true,
}: MapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const draw = useRef<any>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const popupsRef = useRef<mapboxgl.Popup[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapStyle, setMapStyle] = useState("streets-v12");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    // Callbacks refs to prevent stale closures
    const onBoundsChangeRef = useRef(onBoundsChange);
    const onPropertyClickRef = useRef(onPropertyClick);
    const onPolygonChangeRef = useRef(onPolygonChange);

    useEffect(() => {
        onBoundsChangeRef.current = onBoundsChange;
        onPropertyClickRef.current = onPropertyClick;
        onPolygonChangeRef.current = onPolygonChange;
    }, [onBoundsChange, onPropertyClick, onPolygonChange]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
            if (!token) {
                setMapError("Mapbox access token is not configured.");
                return;
            }
            mapboxgl.accessToken = token;

            const mapInstance = new mapboxgl.Map({
                container: mapContainer.current,
                style: `mapbox://styles/mapbox/${mapStyle}`,
                center: center,
                zoom: zoom,
                attributionControl: false,
            });

            map.current = mapInstance;

            // Navigation Controls
            mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

            // Geolocate
            const geolocate = new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true,
            });
            mapInstance.addControl(geolocate, "top-right");

            // Polygon Draw Control
            try {
                draw.current = new MapboxDraw({
                    displayControlsDefault: false,
                    controls: {
                        polygon: true,
                        trash: true,
                    },
                    defaultMode: "simple_select",
                });
                mapInstance.addControl(draw.current, "top-right");

                const updatePolygon = () => {
                    if (!draw.current) return;
                    const data = draw.current.getAll();
                    if (data.features.length > 0) {
                        const coords = data.features[0].geometry.coordinates[0];
                        onPolygonChangeRef.current?.(coords);
                    } else {
                        onPolygonChangeRef.current?.(null);
                    }
                };

                mapInstance.on("draw.create", updatePolygon);
                mapInstance.on("draw.delete", updatePolygon);
                mapInstance.on("draw.update", updatePolygon);
            } catch (drawErr) {
                console.warn("MapboxDraw control initialization skipped:", drawErr);
            }

            mapInstance.on("load", () => {
                setMapLoaded(true);
            });

            mapInstance.on("moveend", () => {
                if (onBoundsChangeRef.current && mapInstance) {
                    try {
                        const bounds = mapInstance.getBounds();
                        if (bounds) {
                            onBoundsChangeRef.current({
                                neLat: bounds.getNorthEast().lat,
                                neLng: bounds.getNorthEast().lng,
                                swLat: bounds.getSouthWest().lat,
                                swLng: bounds.getSouthWest().lng,
                            });
                        }
                    } catch (boundsErr) {
                        console.warn("Could not retrieve map bounds:", boundsErr);
                    }
                }
            });

            mapInstance.on("error", (e) => {
                console.warn("Mapbox internal event error:", e);
            });
        } catch (err: any) {
            console.error("Failed to initialize Mapbox GL:", err);
            setMapError(err?.message || "Could not load map engine.");
        }

        return () => {
            try {
                markersRef.current.forEach((m) => m.remove());
                markersRef.current = [];
                popupsRef.current.forEach((p) => p.remove());
                popupsRef.current = [];
                map.current?.remove();
                map.current = null;
            } catch (cleanupErr) {
                console.warn("Map cleanup error:", cleanupErr);
            }
        };
    }, []);

    // Render Airbnb-style HTML Pill Markers for all properties
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const mapInstance = map.current;

        // Clear existing markers & popups
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        popupsRef.current.forEach((p) => p.remove());
        popupsRef.current = [];

        const bounds = new mapboxgl.LngLatBounds();
        let validCoordsCount = 0;

        properties.forEach((property) => {
            const lat = Number(property.latitude);
            const lng = Number(property.longitude);

            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

            bounds.extend([lng, lat]);
            validCoordsCount++;

            const isSelected = selectedPropertyId === property.id;
            const priceText = formatAbbrPrice(property.pricePerYear);

            // Create custom Airbnb-style DOM element
            const el = document.createElement("div");
            el.className = "airbnb-pill-marker";
            el.innerHTML = `
                <div class="pill-content ${isSelected ? "selected" : ""}">
                    <span class="pill-price">${priceText}</span>
                </div>
            `;

            // Hover & Click Popup Card (Airbnb Style)
            const popup = new mapboxgl.Popup({
                offset: [0, -14],
                closeButton: true,
                closeOnClick: false,
                maxWidth: "280px",
                className: "airbnb-popup",
            }).setHTML(`
                <div style="overflow: hidden; border-radius: 18px; font-family: inherit; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.08);">
                    <div style="position: relative; width: 100%; height: 130px; background: #f1f5f9;">
                        <img src="${property.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"}" 
                             style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                             alt="${property.title}"/>
                        <span style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                            ${property.city || "Nigeria"}
                        </span>
                    </div>
                    <div style="padding: 12px 14px;">
                        <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px;">
                            <span style="font-size: 16px; font-weight: 900; color: #00A651;">
                                ₦${(property.pricePerYear || 0).toLocaleString()}
                            </span>
                            <span style="font-size: 11px; font-weight: 600; color: #64748b;">/yr</span>
                        </div>
                        <h4 style="font-size: 13px; font-weight: 800; margin: 0; color: #0f172a; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${property.title}
                        </h4>
                        <div style="display: flex; gap: 6px; margin-top: 10px;">
                            <a href="/properties/${property.id}/tour" style="flex: 1; text-align: center; background: #f1f5f9; color: #0f172a; font-size: 11px; font-weight: 800; padding: 6px 8px; border-radius: 10px; text-decoration: none; border: 1px solid #e2e8f0;">
                                Tour
                            </a>
                            <a href="/properties/${property.id}" style="flex: 1; text-align: center; background: #00A651; color: white; font-size: 11px; font-weight: 800; padding: 6px 8px; border-radius: 10px; text-decoration: none;">
                                View Home
                            </a>
                        </div>
                    </div>
                </div>
            `);

            popupsRef.current.push(popup);

            // Interaction listeners
            el.addEventListener("mouseenter", () => {
                // Show popup on hover
                popup.setLngLat([lng, lat]).addTo(mapInstance);
                el.querySelector(".pill-content")?.classList.add("hovered");
            });

            el.addEventListener("mouseleave", () => {
                // Remove popup unless clicked
                if (selectedPropertyId !== property.id) {
                    popup.remove();
                    el.querySelector(".pill-content")?.classList.remove("hovered");
                }
            });

            el.addEventListener("click", (e) => {
                e.stopPropagation();
                setSelectedPropertyId(property.id);
                popup.setLngLat([lng, lat]).addTo(mapInstance);
                if (onPropertyClickRef.current) {
                    onPropertyClickRef.current(property.id);
                }
            });

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: "center",
            })
                .setLngLat([lng, lat])
                .addTo(mapInstance);

            markersRef.current.push(marker);
        });

        // Fit bounds to show all properties smoothly
        if (autoFit && validCoordsCount > 0 && !bounds.isEmpty()) {
            try {
                mapInstance.fitBounds(bounds, {
                    padding: { top: 70, bottom: 70, left: 70, right: 70 },
                    maxZoom: 13,
                    duration: 1200,
                });
            } catch (boundsErr) {
                console.warn("Could not fit map bounds:", boundsErr);
            }
        }
    }, [properties, mapLoaded, autoFit, selectedPropertyId]);

    // Handle Style Change
    const changeStyle = (styleId: string) => {
        if (!map.current) return;
        setMapStyle(styleId);
        map.current.setStyle(`mapbox://styles/mapbox/${styleId}`);
    };

    // 3D Buildings Layer Safely
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const mapInstance = map.current;

        const onStyleLoad = () => {
            try {
                const style = mapInstance.getStyle?.();
                if (!style || !style.layers) return;

                const layers = style.layers;
                const labelLayerId = layers.find(
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
            } catch (bldErr) {
                console.warn("3D buildings layer error:", bldErr);
            }
        };

        mapInstance.on("style.load", onStyleLoad);
        return () => {
            mapInstance.off("style.load", onStyleLoad);
        };
    }, [mapLoaded]);

    if (mapError) {
        return (
            <div className="w-full h-full min-h-[400px] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                    <span className="text-xl">⚠️</span>
                </div>
                <h4 className="text-base font-extrabold text-[var(--text-primary)] mb-1">
                    Map Preview Unavailable
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                    {mapError}. Please check your internet connection or use Grid View to browse all homes.
                </p>
                <button
                    onClick={() => {
                        setMapError(null);
                        window.location.reload();
                    }}
                    className="px-4 py-2 rounded-xl bg-[var(--color-brand-green)] text-white text-xs font-bold"
                >
                    Retry Map
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xs" style={{ minHeight: "450px" }}>
            <style jsx global>{`
                .airbnb-pill-marker {
                    cursor: pointer;
                    z-index: 10;
                    transition: transform 0.15s ease, z-index 0.15s ease;
                }
                .airbnb-pill-marker:hover {
                    z-index: 50;
                }
                .pill-content {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px 11px;
                    border-radius: 9999px;
                    background-color: #ffffff;
                    color: #0f172a;
                    font-weight: 800;
                    font-size: 12px;
                    letter-spacing: -0.01em;
                    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    user-select: none;
                    white-space: nowrap;
                }
                .pill-content:hover,
                .pill-content.hovered {
                    background-color: #0f172a;
                    color: #ffffff;
                    transform: scale(1.12);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
                }
                .pill-content.selected {
                    background-color: #00a651;
                    color: #ffffff;
                    transform: scale(1.12);
                    box-shadow: 0 6px 20px rgba(0, 166, 81, 0.4);
                }
                .airbnb-popup .mapboxgl-popup-content {
                    padding: 0 !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                }
                .airbnb-popup .mapboxgl-popup-close-button {
                    right: 8px;
                    top: 8px;
                    background: rgba(0, 0, 0, 0.6);
                    color: #ffffff;
                    border-radius: 9999px;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    border: none;
                    cursor: pointer;
                    z-index: 20;
                    backdrop-filter: blur(4px);
                }
                .airbnb-popup .mapboxgl-popup-tip {
                    display: none !important;
                }
            `}</style>

            {/* Floating Map Style Switcher (Top Left) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] shadow-md">
                {[
                    { id: "streets-v12", label: "Streets", icon: "🗺️" },
                    { id: "satellite-streets-v12", label: "Satellite", icon: "🛰️" },
                    { id: "light-v11", label: "Light", icon: "☀️" },
                    { id: "dark-v11", label: "Dark", icon: "🌙" },
                ].map((style) => (
                    <button
                        key={style.id}
                        onClick={() => changeStyle(style.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                            mapStyle === style.id
                                ? "bg-[var(--color-brand-green)] text-white shadow-2xs"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                        }`}
                    >
                        <span>{style.icon}</span>
                        <span className="hidden sm:inline">{style.label}</span>
                    </button>
                ))}
            </div>

            {/* Container */}
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
