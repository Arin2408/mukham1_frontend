"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import {
  AxiosPost,
  AxiosGet,
  AxiosDelete,
  AxiosPut,
  useAuth,
} from "@/context/AuthContext";
import { DEFAULT_GEOFENCE_RADIUS_METERS } from "@/lib/geo";

// Allowed geofence radius range (matches backend validation)
const MIN_RADIUS_METERS = 10;
const MAX_RADIUS_METERS = 5000;

const isValidRadius = (value) => {
  const radius = Number(value);
  return (
    Number.isInteger(radius) &&
    radius >= MIN_RADIUS_METERS &&
    radius <= MAX_RADIUS_METERS
  );
};
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";

export default function MapPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const layersRef = useRef({});

  const { toast } = useToast();
  const { orgId } = useAuth();

  const [locationData, setLocationData] = useState({
    location_name: "",
    org: {
      id: "",
      name: "",
    },
    latitude: "",
    longitude: "",
    radius_meters: String(DEFAULT_GEOFENCE_RADIUS_METERS),
  });

  const [submittedData, setSubmittedData] = useState(null);

  // Radius edits for saved locations: { [location_id]: "150" }
  const [radiusEdits, setRadiusEdits] = useState({});
  const [savingRadiusId, setSavingRadiusId] = useState(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [mapStyle, setMapStyle] = useState("streets");

  // Saved locations
  const [savedLocations, setSavedLocations] = useState([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState(null);

  // ---------------------------------------------------------
  // FETCH ORGANIZATION DETAILS
  // ---------------------------------------------------------

  const fetchOrganizationDetails = useCallback(async () => {
    if (!orgId) return;

    try {
      const data = await AxiosGet(`organisations/${orgId}/`);

      setLocationData((prev) => ({
        ...prev,
        org: {
          id: orgId,
          name: data.name,
        },
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to fetch organization",
      });
    }
  }, [orgId, toast]);

  // ---------------------------------------------------------
  // FETCH SAVED LOCATIONS
  // ---------------------------------------------------------

  const fetchSavedLocations = useCallback(async () => {
    if (!orgId) return;

    setIsLocationsLoading(true);

    try {
      const data = await AxiosGet("locations/");

      /*
        Backend already filters locations according to
        authenticated organization.

        Extra frontend filter is kept here as a safety check.
      */

      const locations = Array.isArray(data) ? data : [];

      const organizationLocations = locations.filter((location) => {
        if (!location.org) return true;

        if (typeof location.org === "object") {
          return (
            String(location.org.id) === String(orgId)
          );
        }

        return String(location.org) === String(orgId);
      });

      setSavedLocations(organizationLocations);
    } catch (error) {
      console.error("Failed to fetch saved locations:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to fetch saved locations",
      });

      setSavedLocations([]);
    } finally {
      setIsLocationsLoading(false);
    }
  }, [orgId, toast]);

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    if (!orgId) return;

    fetchOrganizationDetails();
    fetchSavedLocations();
  }, [
    orgId,
    fetchOrganizationDetails,
    fetchSavedLocations,
  ]);

  // ---------------------------------------------------------
  // MAP INITIALIZATION
  // ---------------------------------------------------------

  useEffect(() => {
    let mapInstance;

    const initializeMap = async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;

      // Custom map pin
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

      // Remove existing map if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Create map
      mapInstance = L.map("map", {
        zoomControl: false,
        maxZoom: 22,
      }).setView(
        [20.5937, 78.9629],
        5
      );

      mapRef.current = mapInstance;

      // -------------------------------------------------------
      // STREET MAP
      // -------------------------------------------------------

      const streets = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 22,
          maxNativeZoom: 19,
          attribution:
            "© OpenStreetMap contributors",
        }
      );

      // -------------------------------------------------------
      // SATELLITE MAP
      // -------------------------------------------------------

      const satelliteImagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 22,
          maxNativeZoom: 19,
          attribution: "Tiles © Esri",
        }
      );

      const satelliteLabels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 22,
          maxNativeZoom: 19,
          zIndex: 1000,
          attribution: "Labels © Esri",
        }
      );

      const satellite = L.layerGroup([
        satelliteImagery,
        satelliteLabels,
      ]);

      layersRef.current = {
        streets,
        satellite,
      };

      // Default street map
      streets.addTo(mapInstance);

      // Zoom control
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(mapInstance);

      // -------------------------------------------------------
      // MAP CLICK
      // -------------------------------------------------------

      mapInstance.on("click", (e) => {
        const { lat, lng } = e.latlng;

        setLocationData((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));

        if (markerRef.current) {
          mapInstance.removeLayer(
            markerRef.current
          );
        }

        markerRef.current = L.marker(
          [lat, lng],
          {
            icon: customPin,
          }
        ).addTo(mapInstance);
      });
    };

    initializeMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // ---------------------------------------------------------
  // TOGGLE MAP STYLE
  // ---------------------------------------------------------

  const toggleMapStyle = () => {
    const newStyle =
      mapStyle === "streets"
        ? "satellite"
        : "streets";

    const map = mapRef.current;

    if (map && layersRef.current) {
      if (newStyle === "satellite") {
        map.removeLayer(
          layersRef.current.streets
        );

        layersRef.current.satellite.addTo(map);
      } else {
        map.removeLayer(
          layersRef.current.satellite
        );

        layersRef.current.streets.addTo(map);
      }

      setMapStyle(newStyle);
    }
  };

  // ---------------------------------------------------------
  // SEARCH LOCATION
  // ---------------------------------------------------------

  const searchLocation = async () => {
    if (!locationData.location_name.trim()) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationData.location_name
        )}`
      );

      const data = await response.json();

      if (data && data[0]) {
        const {
          lat,
          lon,
        } = data[0];

        if (mapRef.current) {
          mapRef.current.setView(
            [lat, lon],
            13
          );

          if (markerRef.current) {
            mapRef.current.removeLayer(
              markerRef.current
            );
          }

          setLocationData((prev) => ({
            ...prev,
            latitude:
              parseFloat(lat).toFixed(6),
            longitude:
              parseFloat(lon).toFixed(6),
          }));

          const leaflet =
            await import("leaflet");

          const L = leaflet.default;

          const searchPin = L.divIcon({
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

          markerRef.current =
            L.marker(
              [lat, lon],
              {
                icon: searchPin,
              }
            ).addTo(mapRef.current);
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
      console.error(
        "Location search error:",
        error
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Error searching location. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE LOCATION
  // ---------------------------------------------------------

  const handleDeleteLocation = async (
    locationId
  ) => {
    if (!locationId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this location?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingLocationId(locationId);

    try {
      await AxiosDelete(
        `locations/${locationId}/`
      );

      // Immediately remove from UI
      setSavedLocations((prev) =>
        prev.filter(
          (location) =>
            String(location.location_id) !==
            String(locationId)
        )
      );

      toast({
        title: "Success",
        description:
          "Location deleted successfully!",
      });
    } catch (error) {
      console.error(
        "Delete location error:",
        error
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail ||
          "Failed to delete location",
      });
    } finally {
      setDeletingLocationId(null);
    }
  };

  // ---------------------------------------------------------
  // UPDATE GEOFENCE RADIUS OF A SAVED LOCATION
  // ---------------------------------------------------------

  const handleUpdateRadius = async (locationId) => {
    const value = radiusEdits[locationId];

    if (!isValidRadius(value)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Radius must be a whole number between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} metres.`,
      });
      return;
    }

    setSavingRadiusId(locationId);

    try {
      const updated = await AxiosPut(`locations/${locationId}/`, {
        radius_meters: Number(value),
      });

      setSavedLocations((prev) =>
        prev.map((location) =>
          location.location_id === locationId
            ? { ...location, radius_meters: updated.radius_meters }
            : location
        )
      );

      setRadiusEdits((prev) => {
        const next = { ...prev };
        delete next[locationId];
        return next;
      });

      toast({
        title: "Success",
        description: `Check-in radius updated to ${updated.radius_meters}m.`,
      });
    } catch (error) {
      console.error("Update radius error:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.radius_meters?.[0] ||
          error.response?.data?.detail ||
          "Failed to update radius",
      });
    } finally {
      setSavingRadiusId(null);
    }
  };

  // ---------------------------------------------------------
  // SAVE LOCATION
  // ---------------------------------------------------------

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
        description:
          "Please provide all required information.",
      });

      setIsLoading(false);
      return;
    }

    if (!isValidRadius(locationData.radius_meters)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Check-in radius must be a whole number between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} metres.`,
      });

      setIsLoading(false);
      return;
    }

    try {
      const response = await AxiosPost(
        "locations/",
        {
          location_name:
            locationData.location_name.trim(),

          org: locationData.org.id,

          latitude:
            locationData.latitude,

          longitude:
            locationData.longitude,

          radius_meters: Number(
            locationData.radius_meters
          ),
        }
      );

      setSubmittedData(response);

      toast({
        title: "Success",
        description:
          "Location saved successfully!",
      });

      // -----------------------------------------------------
      // IMPORTANT:
      // Refresh Saved Locations after successful POST
      // -----------------------------------------------------

      await fetchSavedLocations();

      // Reset form
      setLocationData((prev) => ({
        location_name: "",
        org: {
          id: orgId,
          name: prev.org.name,
        },
        latitude: "",
        longitude: "",
        radius_meters: String(DEFAULT_GEOFENCE_RADIUS_METERS),
      }));

      // Remove temporary marker
      if (
        markerRef.current &&
        mapRef.current
      ) {
        mapRef.current.removeLayer(
          markerRef.current
        );

        markerRef.current = null;
      }
    } catch (error) {
      console.error(
        "Save location error:",
        error
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.radius_meters?.[0] ||
          error.response?.data?.latitude?.[0] ||
          error.response?.data?.longitude?.[0] ||
          "Failed to save location",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <>
      <Sidebar />

      <div className="lg:ml-[var(--sidebar-w)] transition-[margin] duration-300 p-6 lg:p-10 space-y-8 min-h-screen bg-background">

        {/* PAGE HEADER */}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight page-title">
            Location Selection
          </h1>
        </div>

        <div className="flex flex-col gap-8">

          {/* =================================================
              MAP
          ================================================= */}

          <Card className="p-6 relative group overflow-hidden">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-lg font-semibold flex items-center gap-2">

                <div className="w-1.5 h-6 bg-primary rounded-full" />

                Interactive Map Exploration

              </h2>

              {/* Map Style Toggle */}

              <Button
                onClick={toggleMapStyle}
                variant="outline"
                className="bg-foreground/5 border-foreground/10 hover:bg-primary hover:text-white transition-all gap-2"
              >

                <div
                  className={`w-3 h-3 rounded-full ${
                    mapStyle === "satellite"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  } animate-pulse`}
                />

                {mapStyle === "streets"
                  ? "Switch to Bird's Eye"
                  : "Switch to Standard Map"}

              </Button>

            </div>

            {/* isolate: keeps Leaflet's internal z-indexes (400-1000) from covering the navbar */}
            <div className="space-y-4 relative isolate">

              <div
                id="map"
                className="h-[600px] border-foreground/10 rounded-xl overflow-hidden shadow-2xl"
              />

              {/* Instructions */}

              <div className="absolute top-4 left-4 z-[1000] p-3 bg-background/80 backdrop-blur-md rounded-lg border border-foreground/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">

                <p className="text-xs font-bold text-foreground/70">
                  Protocol
                </p>

                <p className="text-xs text-foreground">
                  Click anywhere on the map to set coordinates
                </p>

              </div>

            </div>

          </Card>

          {/* =================================================
              SAVED LOCATIONS
          ================================================= */}

          <Card className="p-8">

            <div className="flex justify-between items-center mb-6">

              <div>

                <h2 className="text-lg font-semibold">
                  Saved Locations
                </h2>

                <p className="text-sm text-foreground/50 mt-1">
                  Locations configured for this organization
                </p>

              </div>

              <div className="text-primary font-semibold">
                {savedLocations.length}{" "}
                {savedLocations.length === 1
                  ? "Site"
                  : "Sites"}
              </div>

            </div>

            {isLocationsLoading ? (

              <div className="py-8 text-center text-foreground/50">
                Loading saved locations...
              </div>

            ) : savedLocations.length === 0 ? (

              <div className="py-8 text-center text-foreground/50">
                No locations saved yet.
              </div>

            ) : (

              <div className="space-y-3">

                {savedLocations.map(
                  (location) => (

                    <div
                      key={location.location_id}
                      className="flex items-center justify-between p-4 rounded-lg bg-foreground/5 border border-foreground/10 hover:border-primary/30 transition-all"
                    >

                      <div className="flex items-center gap-4">

                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">

                          <MapPin className="w-5 h-5 text-primary" />

                        </div>

                        <div>

                          <p className="font-semibold text-foreground">
                            {location.location_name}
                          </p>

                          <p className="text-xs text-foreground/50 mt-1">

                            Lat:{" "}
                            {location.latitude}

                            {"  |  "}

                            Long:{" "}
                            {location.longitude}

                          </p>

                          {/* Check-in radius (editable) */}

                          <div className="flex items-center gap-2 mt-2">

                            <label
                              htmlFor={`radius-${location.location_id}`}
                              className="text-xs text-muted-foreground"
                            >
                              Check-in radius (m)
                            </label>

                            <Input
                              id={`radius-${location.location_id}`}
                              type="number"
                              min={MIN_RADIUS_METERS}
                              max={MAX_RADIUS_METERS}
                              className="h-8 w-24 bg-foreground/5 border-foreground/10 text-xs"
                              value={
                                radiusEdits[location.location_id] ??
                                String(
                                  location.radius_meters ??
                                    DEFAULT_GEOFENCE_RADIUS_METERS
                                )
                              }
                              onChange={(e) =>
                                setRadiusEdits((prev) => ({
                                  ...prev,
                                  [location.location_id]: e.target.value,
                                }))
                              }
                            />

                            {radiusEdits[location.location_id] !== undefined &&
                              String(radiusEdits[location.location_id]) !==
                                String(location.radius_meters) && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    savingRadiusId === location.location_id
                                  }
                                  onClick={() =>
                                    handleUpdateRadius(location.location_id)
                                  }
                                  className="h-8 px-3 text-xs"
                                >
                                  {savingRadiusId === location.location_id
                                    ? "Saving..."
                                    : "Save"}
                                </Button>
                              )}

                          </div>

                        </div>

                      </div>

                      {/* Delete */}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={
                          deletingLocationId ===
                          location.location_id
                        }
                        onClick={() =>
                          handleDeleteLocation(
                            location.location_id
                          )
                        }
                        className="text-foreground/50 hover:text-red-400 hover:bg-red-500/10"
                      >

                        <Trash2
                          className={`w-4 h-4 ${
                            deletingLocationId ===
                            location.location_id
                              ? "animate-pulse"
                              : ""
                          }`}
                        />

                      </Button>

                    </div>

                  )
                )}

              </div>

            )}

          </Card>

          {/* =================================================
              SUBMIT LOCATION
          ================================================= */}

          <Card className="p-8">

            <h2 className="text-lg font-semibold mb-6">
              Submit Location
            </h2>

            <form
              className="space-y-8"
              onSubmit={handleSubmit}
            >

              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-end">

                {/* LOCATION NAME */}

                <div className="space-y-2 md:col-span-3">

                  <label
                    htmlFor="location_name_input"
                    className="text-sm font-medium"
                  >
                    Location Search & Name
                  </label>

                  <div className="flex gap-2">

                    <Input
                      id="location_name_input"
                      value={
                        locationData.location_name
                      }
                      onChange={(e) =>
                        setLocationData(
                          (prev) => ({
                            ...prev,
                            location_name:
                              e.target.value,
                          })
                        )
                      }
                      className="h-11 bg-foreground/5 border-foreground/10 w-full"
                      placeholder="Search address or enter name..."
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter"
                        ) {
                          e.preventDefault();
                          searchLocation();
                        }
                      }}
                      required
                    />

                    <Button
                      type="button"
                      onClick={searchLocation}
                      disabled={isSearching}
                      className="h-11 px-4 bg-foreground/5 border-foreground/10 hover:bg-primary transition-all"
                    >

                      <Search
                        className={`w-4 h-4 ${
                          isSearching
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                    </Button>

                  </div>

                </div>

                {/* ORGANIZATION */}

                <div className="space-y-2 md:col-span-3">

                  <label
                    htmlFor="organization"
                    className="text-sm font-medium"
                  >
                    Organization
                  </label>

                  <Input
                    id="organization"
                    placeholder="Organization"
                    className="h-11 bg-foreground/5 border-foreground/10 w-full"
                    value={
                      locationData.org.name
                    }
                    readOnly
                  />

                </div>

                {/* LATITUDE */}

                <div className="space-y-2 md:col-span-2">

                  <label
                    htmlFor="latitude"
                    className="text-sm font-medium"
                  >
                    Latitude
                  </label>

                  <Input
                    id="latitude"
                    placeholder="Latitude"
                    className="h-11 bg-foreground/5 border-foreground/10 w-full"
                    value={
                      locationData.latitude
                    }
                    onChange={(e) =>
                      setLocationData(
                        (prev) => ({
                          ...prev,
                          latitude:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />

                </div>

                {/* LONGITUDE */}

                <div className="space-y-2 md:col-span-2">

                  <label
                    htmlFor="longitude"
                    className="text-sm font-medium"
                  >
                    Longitude
                  </label>

                  <Input
                    id="longitude"
                    placeholder="Longitude"
                    className="h-11 bg-foreground/5 border-foreground/10 w-full"
                    value={
                      locationData.longitude
                    }
                    onChange={(e) =>
                      setLocationData(
                        (prev) => ({
                          ...prev,
                          longitude:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />

                </div>

                {/* CHECK-IN RADIUS */}

                <div className="space-y-2 md:col-span-2">

                  <label
                    htmlFor="radius_meters"
                    className="text-sm font-medium"
                  >
                    Check-in Radius (metres)
                  </label>

                  <Input
                    id="radius_meters"
                    type="number"
                    min={MIN_RADIUS_METERS}
                    max={MAX_RADIUS_METERS}
                    placeholder={String(DEFAULT_GEOFENCE_RADIUS_METERS)}
                    className="h-11 bg-foreground/5 border-foreground/10 w-full"
                    value={
                      locationData.radius_meters
                    }
                    onChange={(e) =>
                      setLocationData(
                        (prev) => ({
                          ...prev,
                          radius_meters:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />

                  <p className="text-xs text-muted-foreground">
                    Employees must be within this distance of the office to check in ({MIN_RADIUS_METERS} to {MAX_RADIUS_METERS}m).
                  </p>

                </div>

              </div>

              {/* SUBMIT */}

              <div className="flex justify-start">

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-12 h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/10 transition-all active:scale-95"
                >

                  <Save className="mr-2 h-4 w-4" />

                  {isLoading
                    ? "Submitting..."
                    : "Submit Location Protocol"}

                </Button>

              </div>

            </form>

          </Card>

        </div>

      </div>
    </>
  );
}