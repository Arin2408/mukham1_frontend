"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Search } from "lucide-react";
import { Header } from "@/components/Header";
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

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      mapInstance = L.map("map").setView([20.5937, 78.9629], 5);
      mapRef.current = mapInstance;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance);

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
        markerRef.current = L.marker([lat, lng]).addTo(mapInstance);
      });
    };

    initializeMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

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

          markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
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
      <Header />
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Location Selection</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Interactive Map</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search location (e.g., Hyderabad)"
                  value={locationData.location_name}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      location_name: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchLocation();
                    }
                  }}
                  disabled={isSearching}
                />
                <Button onClick={searchLocation} disabled={isSearching}>
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>

              <div id="map" className="h-96 border rounded-md" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Submit Location</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="location_name" className="text-sm font-medium">
                  Location Name
                </label>
                <Input
                  id="location_name"
                  value={locationData.location_name}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      location_name: e.target.value,
                    }))
                  }
                  placeholder="Enter location name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="organization" className="text-sm font-medium">
                  Organization
                </label>
                <Input
                  id="organization"
                  placeholder="Organization"
                  value={locationData.org.name}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium">
                  Latitude
                </label>
                <Input
                  id="latitude"
                  placeholder="Latitude"
                  value={locationData.latitude}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      latitude: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium">
                  Longitude
                </label>
                <Input
                  id="longitude"
                  placeholder="Longitude"
                  value={locationData.longitude}
                  onChange={(e) =>
                    setLocationData((prev) => ({
                      ...prev,
                      longitude: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
