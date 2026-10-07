/* Location taxonomy for the marketplace.
 *
 * One shared, dependency-free table of provinces, their cities and a
 * plausible coordinate per city. It is imported by the client catalog
 * (data.js assigns every product a { province, city } drawn from it) and by
 * the server (server.js needs the same province/city vocabulary to store and
 * filter products, and the same "is this a real city" check so a crafted
 * query cannot invent one). Keeping it in its own module with no imports
 * means both runtimes read the exact same list.
 *
 * This is a public place vocabulary, not user data: no coordinates of a
 * person, only the fixed center of a city, used to answer "which city is
 * nearest to the device" for the "Use my current location" button.
 */

export const LOCATIONS = [
  {
    id: 'dki-jakarta',
    name: 'DKI Jakarta',
    cities: [
      { id: 'jakarta-selatan', name: 'Jakarta Selatan' },
      { id: 'jakarta-pusat', name: 'Jakarta Pusat' },
      { id: 'jakarta-barat', name: 'Jakarta Barat' },
      { id: 'jakarta-timur', name: 'Jakarta Timur' },
      { id: 'jakarta-utara', name: 'Jakarta Utara' },
    ],
  },
  {
    id: 'jawa-barat',
    name: 'Jawa Barat',
    cities: [
      { id: 'bandung', name: 'Bandung' },
      { id: 'bekasi', name: 'Bekasi' },
      { id: 'bogor', name: 'Bogor' },
      { id: 'depok', name: 'Depok' },
    ],
  },
  {
    id: 'jawa-tengah',
    name: 'Jawa Tengah',
    cities: [
      { id: 'semarang', name: 'Semarang' },
      { id: 'solo', name: 'Solo' },
    ],
  },
  {
    id: 'di-yogyakarta',
    name: 'DI Yogyakarta',
    cities: [
      { id: 'yogyakarta', name: 'Yogyakarta' },
    ],
  },
  {
    id: 'jawa-timur',
    name: 'Jawa Timur',
    cities: [
      { id: 'surabaya', name: 'Surabaya' },
      { id: 'malang', name: 'Malang' },
    ],
  },
  {
    id: 'banten',
    name: 'Banten',
    cities: [
      { id: 'tangerang', name: 'Tangerang' },
      { id: 'serang', name: 'Serang' },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    cities: [
      { id: 'denpasar', name: 'Denpasar' },
    ],
  },
  {
    id: 'kepulauan-riau',
    name: 'Kepulauan Riau',
    cities: [
      { id: 'batam', name: 'Batam' },
      { id: 'tanjung-pinang', name: 'Tanjung Pinang' },
    ],
  },
  {
    id: 'sumatera-utara',
    name: 'Sumatera Utara',
    cities: [
      { id: 'medan', name: 'Medan' },
    ],
  },
  {
    id: 'sulawesi-selatan',
    name: 'Sulawesi Selatan',
    cities: [
      { id: 'makassar', name: 'Makassar' },
    ],
  },
];

/* Province names, in the decline order above. */
export const PROVINCES = LOCATIONS.map((p) => p.name);

/* The cities of one province, or an empty list for an unknown province. */
export function citiesByProvince(province) {
  const row = LOCATIONS.find((p) => p.name === province);
  return row ? row.cities.map((c) => c.name) : [];
}

/* The province a city belongs to, or null when the city is unknown. */
export function provinceByCity(city) {
  const row = LOCATIONS.find((p) => p.cities.some((c) => c.name === city));
  return row ? row.name : null;
}

/* Every city name in the taxonomy, in province order. */
export function allCities() {
  return LOCATIONS.flatMap((p) => p.cities.map((c) => c.name));
}

/* Fixed city-center coordinates, used only to answer "nearest city to the
 * device" for the "Use my current location" button. */
export const CITY_COORDS = {
  'Jakarta Selatan': [-6.2615, 106.8106],
  'Jakarta Pusat': [-6.1805, 106.8284],
  'Jakarta Barat': [-6.1683, 106.7588],
  'Jakarta Timur': [-6.225, 106.9004],
  'Jakarta Utara': [-6.1214, 106.7741],
  Bandung: [-6.9175, 107.6191],
  Bekasi: [-6.2383, 106.9756],
  Bogor: [-6.5971, 106.806],
  Depok: [-6.4025, 106.7942],
  Semarang: [-6.9932, 110.4203],
  Solo: [-7.5755, 110.8243],
  Yogyakarta: [-7.7956, 110.3695],
  Surabaya: [-7.2575, 112.7521],
  Malang: [-7.9666, 112.6326],
  Tangerang: [-6.1783, 106.6319],
  Serang: [-6.1104, 106.1503],
  Denpasar: [-8.6705, 115.2126],
  Batam: [1.1301, 104.0529],
  'Tanjung Pinang': [0.9186, 104.4665],
  Medan: [3.5952, 98.6722],
  Makassar: [-5.1477, 119.4327],
};

/* Squared distance is enough to pick a nearest neighbor; no need for trig. */
function dist2(a, b) {
  const dLat = a[0] - b[0];
  const dLng = a[1] - b[1];
  return dLat * dLat + dLng * dLng;
}

/* The taxonomy city closest to a device coordinate, or null when the
 * coordinate is not a usable finite pair. Used by "Use my current location";
 * the client validates the returned name against its own list before it
 * applies, so a stale table can never select a city this build does not know. */
export function nearestCity(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  let best = null;
  let bestD = Infinity;
  for (const [city, coord] of Object.entries(CITY_COORDS)) {
    const d = dist2([lat, lng], coord);
    if (d < bestD) {
      bestD = d;
      best = city;
    }
  }
  return best;
}
