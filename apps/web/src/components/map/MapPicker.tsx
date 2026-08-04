"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLocation?: { lat: number; lng: number };
    className?: string;
}

export default function MapPicker({ onLocationSelect, initialLocation, className }: MapPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Default center (Abuja, Nigeria)
    const defaultCenter: [number, number] = [7.4913, 9.0765];
    const initialCenter: [number, number] = initialLocation
        ? [initialLocation.lng, initialLocation.lat]
        : defaultCenter;

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: initialCenter,
            zoom: initialLocation ? 14 : 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            })
        );

        map.current.on("load", () => {
            setMapLoaded(true);

            // If we have an initial location, place the marker
            if (initialLocation) {
                placeMarker(initialLocation.lng, initialLocation.lat);
            }
        });

        map.current.on("click", (e) => {
            const { lng, lat } = e.lngLat;
            placeMarker(lng, lat);
            onLocationSelect(lat, lng);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    const placeMarker = (lng: number, lat: number) => {
        if (!map.current) return;

        if (marker.current) {
            marker.current.setLngLat([lng, lat]);
        } else {
            const el = document.createElement("div");
            el.className = "marker";
            el.style.width = "40px";
            el.style.height = "40px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = "#00A651"; // Brand Green
            el.style.border = "4px solid white";
            el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
            el.style.cursor = "pointer";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";

            // Inner dot
            const dot = document.createElement("div");
            dot.style.width = "10px";
            dot.style.height = "10px";
            dot.style.borderRadius = "50%";
            dot.style.backgroundColor = "white";
            el.appendChild(dot);

            marker.current = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(map.current);
        }

        map.current.easeTo({
            center: [lng, lat],
            duration: 500
        });
    };

    return (
        <div className={`relative ${className}`}>
            <div
                ref={mapContainer}
                className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-200"
                style={{ minHeight: "400px" }}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-200 shadow-sm pointer-events-none">
                <p className="text-xs font-semibold text-gray-700 text-center">
                    Click on the map to set the precise location of the property
                </p>
            </div>
        </div>
    );
}
