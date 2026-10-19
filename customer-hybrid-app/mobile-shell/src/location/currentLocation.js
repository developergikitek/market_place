import * as Location from 'expo-location';

const TIMEOUT_MS = 5000;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

/** Swiggy-style label: a short area title plus the full address line under it. */
function toDeliveryLabel(place) {
  if (!place) return null;
  // Locality first (e.g. "Sector 16A"), then city ("Noida"); the subregion is a county-level
  // name ("Gautam Buddha Nagar") that people don't recognise as their area
  const title =
    place.district || place.city || place.subregion || place.street || place.name || 'Current location';
  const parts = [place.name, place.street, place.district, place.city, place.region, place.postalCode]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i && part !== title);
  const address = place.formattedAddress || parts.join(', ');
  return { title, address };
}

/**
 * Resolves the user's delivery location for the header.
 * Returns { status: 'found', title, address } or { status: 'denied' | 'unavailable' }.
 * Never throws and never waits longer than ~5s, so app launch can't hang on GPS.
 */
export async function fetchDeliveryLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { status: 'denied' };

    // Last known fix is instant; a fresh balanced-accuracy fix replaces it when available
    const position =
      (await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), TIMEOUT_MS)) ||
      (await Location.getLastKnownPositionAsync());
    if (!position) return { status: 'unavailable' };

    const [place] = await withTimeout(
      Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      TIMEOUT_MS
    ) || [];
    const label = toDeliveryLabel(place);
    return label ? { status: 'found', ...label } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
