"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Search } from "lucide-react";
import { Header } from "@/components/Header";
import "leaflet/dist/leaflet.css";
import { useToast } from "hooks/use-toast";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

// Utility function to get access token from localStorage
const getAccessToken = () => localStorage.getItem("access_token");

// Token verification function
const verifyToken = async (token, router, toast) => {
  if (!token) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "No token found. Please login again.",
    });
    router.push("/login");
    return false;
  }

  try {
    const decodedToken = jwtDecode(token);
    if (Date.now() >= decodedToken.exp * 1000) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Session expired. Please login again.",
      });
      localStorage.removeItem("access_token");
      router.push("/login");
      return false;
    }

    const response = await fetch("http://127.0.0.1:8000/api/token/verify/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Invalid token");
    }

    return true;
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message,
    });
    localStorage.removeItem("access_token");
    router.push("/login");
    return false;
  }
};

export default function MapPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { toast } = useToast();
  const router = useRouter();
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
  useEffect(() => {
    const fetchOrganization = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const tokenValid = await verifyToken(token, router, toast);
      if (!tokenValid) return;

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/organisations/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch organization");

        const data = await response.json();

        // Assuming the response is an array of organizations and we take the first one
        if (data.length > 0) {
          setLocationData((prev) => ({
            ...prev,
            org: { id: data[0].org_id, name: data[0].name } // Set the organization name from the first record
          }));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    };

    fetchOrganization();
  }, [router, toast]);

  // Map initialization (same as before)
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

  // Search location (same as before)
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
          description: "Location not found. Please try a different search term.",
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

    const token = getAccessToken();
    const tokenValid = await verifyToken(token, router, toast);
    if (!tokenValid) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/locations/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location_name: locationData.location_name.trim(),
          org: locationData.org.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save location");
      }

      const data = await response.json();
      setSubmittedData(data);

      toast({
        title: "Success",
        description: "Location saved successfully!",
      });

      setLocationData({
        location_name: "",
        org: locationData.org.name , // Keep organization name
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
        description: error.message,
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

              <Input
                placeholder="Organization"
                value={locationData.org.name}
                onChange={(e) =>
                  setLocationData((prev) => ({
                    ...prev,
                    org: e.target.value,
                  }))
                }
                readOnly // Set this to readOnly since org is fetched automatically
              />
              <Input
                placeholder="Latitude"
                value={locationData.latitude}
                onChange={(e) =>
                  setLocationData((prev) => ({
                    ...prev,
                    latitude: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="Longitude"
                value={locationData.longitude}
                onChange={(e) =>
                  setLocationData((prev) => ({
                    ...prev,
                    longitude: e.target.value,
                  }))
                }
              />

              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Card>
        </div>

        {submittedData && (
          <Card className="p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Submitted Data</h2>
            <pre>{JSON.stringify(submittedData, null, 2)}</pre>
          </Card>
        )}
      </div>
    </>
  );
}