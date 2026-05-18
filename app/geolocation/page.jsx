"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AxiosPost, AxiosGet, useAuth } from "@/context/AuthContext";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function MapPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { toast } = useToast();
  const router = useRouter();
  const { orgId } = useAuth(); // Get orgId from AuthContext

  const [locationData, setLocationData] = useState({
    location_name: "",
    org: { id: "", name: "" },
    latitude: "",
    longitude: "",
  });
  const [submittedData, setSubmittedData] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState("streets"); // 'streets' or 'satellite'
  const layersRef = useRef({});

  // Fetch organization details on mount
  const fetchOrganizationDetails = useCallback(async () => {
    try {
      const data = await AxiosGet(`organisations/${orgId}/`);
      setLocationData((prev) => ({
        ...prev,
        org: { id: orgId, name: data.name },
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail || "Failed to fetch organization",
      });
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [fetchOrganizationDetails]);

  // Map initialization
  useEffect(() => {
    let mapInstance;
    let L;

    const initializeMap = async () => {
      const leaflet = await import("leaflet");
      L = leaflet.default;

      // Define a beautiful custom SVG pin
      const customPin = L.divIcon({
        className: "custom-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping"></div>
            <div class="relative w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-2xl">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div class="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-primary"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      mapInstance = L.map("map", {
        zoomControl: false,
        maxZoom: 22,
      }).setView([20.5937, 78.9629], 5);
      mapRef.current = mapInstance;

      // Define Layers
      const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution: "© OpenStreetMap contributors",
      });

      const satelliteImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution: 'Tiles &copy; Esri'
      });

      const satelliteLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 22,
        maxNativeZoom: 19,
        zIndex: 1000,
        attribution: 'Labels &copy; Esri'
      });

      const satellite = L.layerGroup([satelliteImagery, satelliteLabels]);

      layersRef.current = { streets, satellite };
      
      // Default to streets
      streets.addTo(mapInstance);
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      mapInstance.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setLocationData((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));

        if (markerRef.current) {
          mapInstance.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([lat, lng], { icon: customPin }).addTo(mapInstance);
      });
    };

    initializeMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Handle Layer Toggle
  const toggleMapStyle = () => {
    const newStyle = mapStyle === "streets" ? "satellite" : "streets";
    const map = mapRef.current;
    if (map && layersRef.current) {
      if (newStyle === "satellite") {
        map.removeLayer(layersRef.current.streets);
        layersRef.current.satellite.addTo(map);
      } else {
        map.removeLayer(layersRef.current.satellite);
        layersRef.current.streets.addTo(map);
      }
      setMapStyle(newStyle);
    }
  };

  // Search location
  const searchLocation = async () => {
    if (!locationData.location_name) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationData.location_name
        )}`
      );
      const data = await response.json();

      if (data && data[0]) {
        const { lat, lon, display_name } = data[0];

        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 13);

          if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
          }

          setLocationData((prev) => ({
            ...prev,
            latitude: parseFloat(lat).toFixed(6),
            longitude: parseFloat(lon).toFixed(6),
          }));

          // Re-import L or use the one from scope to create customPin
          const leaflet = await import("leaflet");
          const L_instance = leaflet.default;
          const searchPin = L_instance.divIcon({
            className: "custom-pin",
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping"></div>
                <div class="relative w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-2xl">
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div class="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-primary"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          markerRef.current = L_instance.marker([lat, lon], { icon: searchPin }).addTo(mapRef.current);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Location not found. Please try a different search term.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error searching location. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission with API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !locationData.location_name.trim() ||
      !locationData.org.id ||
      !locationData.latitude ||
      !locationData.longitude
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide all required information.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await AxiosPost("locations/", {
        location_name: locationData.location_name.trim(),
        org: locationData.org.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      setSubmittedData(response);

      toast({
        title: "Success",
        description: "Location saved successfully!",
      });

      setLocationData({
        location_name: "",
        org: { id: orgId, name: locationData.org.name },
        latitude: "",
        longitude: "",
      });

      if (markerRef.current && mapRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Failed to save location",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-64 p-6 lg:p-10 space-y-8 min-h-screen bg-[#02040a]">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Location Selection</h1>
        </div>

        <div className="flex flex-col gap-8">
          <Card className="p-6 relative group overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Interactive Map Exploration
              </h2>
              
              {/* Layer Toggle Button */}
              <Button 
                onClick={toggleMapStyle}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-primary hover:text-white transition-all gap-2"
              >
                <div className={`w-3 h-3 rounded-full ${mapStyle === 'satellite' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                {mapStyle === 'streets' ? 'Switch to Bird\'s Eye' : 'Switch to Standard Map'}
              </Button>
            </div>
            
            <div className="space-y-4 relative">
              <div id="map" className="h-[600px] border-white/10 rounded-xl overflow-hidden shadow-2xl" />
              
              {/* Floating Instructions Overlay */}
              <div className="absolute top-4 left-4 z-[1000] p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">Protocol</p>
                <p className="text-xs text-white">Click anywhere on the map to set coordinates</p>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-lg font-semibold mb-6">Submit Location</h2>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-end">
                <div className="space-y-2 md:col-span-3">
                  <label htmlFor="location_name_input" className="text-sm font-medium">Location Search & Name</label>
                  <div className="flex gap-2">
                    <Input
                      id="location_name_input"
                      value={locationData.location_name}
                      onChange={(e) => setLocationData(prev => ({ ...prev, location_name: e.target.value }))}
                      className="h-11 bg-white/5 border-white/10 w-full"
                      placeholder="Search address or enter name..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchLocation())}
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={searchLocation} 
                      disabled={isSearching}
                      className="h-11 px-4 bg-white/5 border-white/10 hover:bg-primary transition-all"
                    >
                      <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <label htmlFor="organization" className="text-sm font-medium">Organization</label>
                  <Input
                    id="organization"
                    placeholder="Organization"
                    className="h-11 bg-white/5 border-white/10 w-full"
                    value={locationData.org.name}
                    readOnly
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="latitude" className="text-sm font-medium">Latitude</label>
                  <Input
                    id="latitude"
                    placeholder="Latitude"
                    className="h-11 bg-white/5 border-white/10 w-full"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="longitude" className="text-sm font-medium">Longitude</label>
                  <Input
                    id="longitude"
                    placeholder="Longitude"
                    className="h-11 bg-white/5 border-white/10 w-full"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <Button type="submit" disabled={isLoading} className="px-12 h-11 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-all active:scale-95">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Submitting..." : "Submit Location Protocol"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
