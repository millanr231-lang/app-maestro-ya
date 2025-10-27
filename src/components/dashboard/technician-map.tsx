'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

// --- MOCK DATA ---
interface MockTechnician {
  id: string;
  nombre: string;
  rol: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

const initialMockData: MockTechnician[] = [
  { id: 'tec001', nombre: 'Carlos Gómez', rol: 'Plomería', latitude: -0.180653, longitude: -78.467834, timestamp: new Date() },
  { id: 'tec002', nombre: 'Sofía Torres', rol: 'Electricidad', latitude: -0.2033, longitude: -78.4903, timestamp: new Date() },
  { id: 'tec003', nombre: 'Luis Fernández', rol: 'Maestro General', latitude: -0.1534, longitude: -78.4844, timestamp: new Date() },
];

const getRandomCoordinate = (coord: number) => coord + (Math.random() - 0.5) * 0.01;

// Fix for default Leaflet icon not showing up in Next.js
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;


export default function TechnicianMap() {
    const [technicians, setTechnicians] = useState<MockTechnician[]>(initialMockData);
    const mapCenter: [number, number] = [-0.180653, -78.467834]; // Default center on Quito
    
    // Fix para "Map container is already initialized" durante Hot Reload/dev
    useEffect(() => {
        // Elimina el _leaflet_id si existe (solo aplica en recarga/desarrollo)
        if (typeof window !== "undefined") {
            const container = document.getElementsByClassName("leaflet-container");
            if (container.length > 0) {
                // Esto previene que Leaflet duplique su ID interno (solo frontend, sin afectar nada)
                for (let i = 0; i < container.length; i++) {
                    container[i].removeAttribute("_leaflet_id");
                }
            }
        }
    }, []);

    const handleRefresh = () => {
        setTechnicians(prevTechnicians => 
            prevTechnicians.map(tech => ({
                ...tech,
                latitude: getRandomCoordinate(tech.latitude),
                longitude: getRandomCoordinate(tech.longitude),
                timestamp: new Date(),
            }))
        );
    };
    
    return (
        <div className="relative h-full w-full">
            <MapContainer
                key="tecnico-map"
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {technicians.map((tech) => (
                    <Marker key={tech.id} position={[tech.latitude, tech.longitude]}>
                        <Popup>
                            <div className="text-sm">
                                <p className="font-bold">{tech.nombre}</p>
                                <p className="text-muted-foreground">{tech.rol}</p>
                                <p className="text-xs mt-1">Última act: {tech.timestamp.toLocaleTimeString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute top-2 left-2 z-[1000] w-full max-w-md p-2">
                <Alert>
                    <AlertTitle className="font-semibold">Modo de Simulación</AlertTitle>
                    <AlertDescription className="text-xs">
                        Esta es una demostración. Las ubicaciones de los técnicos son ficticias y se actualizan manualmente.
                    </AlertDescription>
                </Alert>
            </div>
            
             <div className="absolute bottom-2 right-2 z-[1000]">
                <Button onClick={handleRefresh} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refrescar Posiciones
                </Button>
            </div>
        </div>
    );
}
