/* Translations for the app's shipped locales.
 *
 * `en` is the source: every other dictionary is a partial override, and a key
 * missing from a locale falls back to English (then to the caller's own
 * English label). Only the product detail page's Specifications vocabulary and
 * its section headings are translated so far; the rest of the app stays in
 * English, matching the Settings note that only English ships today.
 *
 * The active locale is the stored preference (`store.prefs.locale`), seeded to
 * 'en'. `t(key)` is the only entry point; `locale()` exposes the current code.
 */

import { store } from './store.js';

const EN = {
  specifications: 'Specifications',
  description: 'Description',
  reviews: 'Reviews',
  inStock: 'In stock',
  soldOut: 'Sold out',
  'spec.display': 'Display',
  'spec.processor': 'Processor',
  'spec.ram': 'RAM',
  'spec.storage': 'Storage',
  'spec.graphics': 'Graphics',
  'spec.battery': 'Battery',
  'spec.weight': 'Weight',
  'spec.os': 'Operating System',
  'spec.ports': 'Ports',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Camera',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Size options',
  'spec.fit': 'Fit',
  'spec.care': 'Care instructions',
  'spec.origin': 'Origin',
  'spec.dimensions': 'Dimensions',
  'spec.power': 'Power / Capacity',
  'spec.brand': 'Brand',
  'spec.model': 'Model',
  'spec.sku': 'Product ID',
  'spec.stock': 'Stock',
  'spec.warranty': 'Warranty',
};

const ES = {
  specifications: 'Especificaciones',
  description: 'Descripción',
  reviews: 'Reseñas',
  inStock: 'Disponible',
  soldOut: 'Agotado',
  'spec.display': 'Pantalla',
  'spec.processor': 'Procesador',
  'spec.ram': 'Memoria RAM',
  'spec.storage': 'Almacenamiento',
  'spec.graphics': 'Gráficos',
  'spec.battery': 'Batería',
  'spec.weight': 'Peso',
  'spec.os': 'Sistema operativo',
  'spec.ports': 'Puertos',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Cámara',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Tallas',
  'spec.fit': 'Corte',
  'spec.care': 'Cuidados',
  'spec.origin': 'Origen',
  'spec.dimensions': 'Dimensiones',
  'spec.power': 'Potencia / Capacidad',
  'spec.brand': 'Marca',
  'spec.model': 'Modelo',
  'spec.sku': 'ID de producto',
  'spec.stock': 'Disponibilidad',
  'spec.warranty': 'Garantía',
};

const PT_BR = {
  specifications: 'Especificações',
  description: 'Descrição',
  reviews: 'Avaliações',
  inStock: 'Em estoque',
  soldOut: 'Esgotado',
  'spec.display': 'Tela',
  'spec.processor': 'Processador',
  'spec.ram': 'Memória RAM',
  'spec.storage': 'Armazenamento',
  'spec.graphics': 'Gráficos',
  'spec.battery': 'Bateria',
  'spec.weight': 'Peso',
  'spec.os': 'Sistema operacional',
  'spec.ports': 'Portas',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Câmera',
  'spec.sim': 'SIM',
  'spec.material': 'Material',
  'spec.sizes': 'Tamanhos',
  'spec.fit': 'Caimento',
  'spec.care': 'Cuidados',
  'spec.origin': 'Origem',
  'spec.dimensions': 'Dimensões',
  'spec.power': 'Potência / Capacidade',
  'spec.brand': 'Marca',
  'spec.model': 'Modelo',
  'spec.sku': 'ID do produto',
  'spec.stock': 'Disponibilidade',
  'spec.warranty': 'Garantia',
};

const ID = {
  specifications: 'Spesifikasi',
  description: 'Deskripsi',
  reviews: 'Ulasan',
  inStock: 'Tersedia',
  soldOut: 'Habis',
  'spec.display': 'Layar',
  'spec.processor': 'Prosesor',
  'spec.ram': 'RAM',
  'spec.storage': 'Penyimpanan',
  'spec.graphics': 'Grafis',
  'spec.battery': 'Baterai',
  'spec.weight': 'Berat',
  'spec.os': 'Sistem operasi',
  'spec.ports': 'Port',
  'spec.chipset': 'Chipset',
  'spec.camera': 'Kamera',
  'spec.sim': 'SIM',
  'spec.material': 'Bahan',
  'spec.sizes': 'Ukuran',
  'spec.fit': 'Potongan',
  'spec.care': 'Perawatan',
  'spec.origin': 'Asal',
  'spec.dimensions': 'Dimensi',
  'spec.power': 'Daya / Kapasitas',
  'spec.brand': 'Merek',
  'spec.model': 'Model',
  'spec.sku': 'ID produk',
  'spec.stock': 'Stok',
  'spec.warranty': 'Garansi',
};

const DICTS = { en: EN, es: ES, 'pt-BR': PT_BR, id: ID };

/* Map any stored tag onto a shipped dictionary (language-subtag match). */
function normalize(code) {
  if (!code || typeof code !== 'string') return 'en';
  if (DICTS[code]) return code;
  const base = code.toLowerCase().split('-')[0];
  for (const key of Object.keys(DICTS)) {
    if (key.toLowerCase().split('-')[0] === base) return key;
  }
  return 'en';
}

export function locale() {
  const pref = store && store.prefs ? store.prefs.locale : 'en';
  return normalize(pref);
}

/* Look a key up; fall back to English, then to the key itself. */
export function t(key) {
  const dict = DICTS[locale()];
  if (dict && dict[key] !== undefined) return dict[key];
  if (EN[key] !== undefined) return EN[key];
  return key;
}
