// Shared GPS helpers for attendance check-in / check-out.
// The backend is the final authority on geofencing; these values only let
// the UI reject obviously bad readings early.

// Used when an office has no radius set (matches the backend default)
export const DEFAULT_GEOFENCE_RADIUS_METERS = 100;

// Keep in sync with backend GEOFENCE_MAX_ACCURACY_METERS (default 100)
export const GPS_MAX_ACCURACY_METERS = 100;

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

// Resolve with { latitude, longitude, accuracy }, or null if location is
// unavailable / denied. Never rejects, so callers can continue without GPS
// where that is allowed (e.g. check-out).
export const getCurrentCoords = () =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      () => resolve(null),
      GPS_OPTIONS
    );
  });

// Radius of the employee's assigned office, falling back to the default
export const officeRadius = (officeLocation) =>
  Number(officeLocation?.radius_meters) || DEFAULT_GEOFENCE_RADIUS_METERS;
