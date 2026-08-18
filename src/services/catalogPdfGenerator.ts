import { jsPDF } from 'jspdf';

export type CatalogViewMode = 'stock' | 'sold' | 'incoming';

export interface CatalogListingItem {
  id: string;
  businessId?: string;
  title: string;
  description?: string | null;
  price?: number | null;
  status: string;
  soldAt?: string | Date | null;
  year?: number | null;
  mileage?: number | null;
  powerHp?: number | null;
  fuelType?: string | null;
  gearbox?: string | null;
  bodyType?: string | null;
  color?: string | null;
  make?: { id?: string; name: string } | null;
  model?: { id?: string; name: string } | null;
  makeName?: string | null;
  modelName?: string | null;
  images?: { url: string }[];
  attributeValues?: {
    attribute?: {
      name: string;
      type: string;
    };
    attributeId?: string;
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
  }[];
}

export interface StrippedCharInfo {
  char: string;
  codePoint: string;
  count: number;
}

export interface NormalizedCharInfo {
  char: string;
  codePoint: string;
  replacement: string;
  count: number;
}

export interface GenerateCatalogOptions {
  businessId: string;
  businessName?: string;
  viewMode?: CatalogViewMode;
  apiBaseUrl?: string;
  listings?: CatalogListingItem[];
  concurrency?: number;
  onProgress?: (progress: {
    stage: 'fonts' | 'fetch_data' | 'fetch_images' | 'drawing' | 'done';
    completed: number;
    total: number;
  }) => void;
  fontData?: {
    regularBase64: string;
    regularBytes?: Uint8Array;
    semiBoldBase64: string;
    semiBoldBytes?: Uint8Array;
  };
}

export interface CatalogGenerationResult {
  pdfBuffer: Uint8Array;
  pageCount: number;
  totalBytes: number;
  wallClockMs: number;
  noImagePageCount: number;
  availableCount: number;
  normalizedCharactersTotal: number;
  normalizedCharacters: NormalizedCharInfo[];
  strippedCharactersTotal: number;
  strippedCharacters: StrippedCharInfo[];
}

const COLOR_MAP: Record<string, string> = {
  BLACK: 'Negru',
  NEGRU: 'Negru',
  GREY: 'Gri',
  GRAY: 'Gri',
  GRI: 'Gri',
  WHITE: 'Alb',
  ALB: 'Alb',
  BLUE: 'Albastru',
  ALBASTRU: 'Albastru',
  RED: 'Roșu',
  ROSU: 'Roșu',
  'ROȘU': 'Roșu',
  BROWN: 'Maro',
  MARO: 'Maro',
  SILVER: 'Argintiu',
  ARGINTIU: 'Argintiu',
  ORANGE: 'Portocaliu',
  PORTOCALIU: 'Portocaliu',
  GREEN: 'Verde',
  VERDE: 'Verde',
  PURPLE: 'Mov',
  MOV: 'Mov',
  GOLD: 'Auriu',
  AURIU: 'Auriu',
  BEIGE: 'Bej',
  BEJ: 'Bej',
  YELLOW: 'Galben',
  GALBEN: 'Galben',
  OTHER: 'Altă',
  ALTA: 'Altă',
  'ALTĂ': 'Altă',
};

const FUEL_TYPE_MAP: Record<string, string> = {
  PETROL: 'Benzină',
  BENZINA: 'Benzină',
  'BENZINĂ': 'Benzină',
  DIESEL: 'Diesel',
  PETROL_LPG: 'Benzină + GPL',
  'BENZINA_GPL': 'Benzină + GPL',
  'BENZINĂ_GPL': 'Benzină + GPL',
  'BENZINA + GPL': 'Benzină + GPL',
  'BENZINĂ + GPL': 'Benzină + GPL',
  LPG: 'GPL',
  GPL: 'GPL',
  HYBRID: 'Hibrid',
  HIBRID: 'Hibrid',
  PLUGIN_HYBRID: 'Plug-in Hybrid',
  'PLUG-IN HYBRID': 'Plug-in Hybrid',
  'PLUG_IN_HYBRID': 'Plug-in Hybrid',
  MILD_HYBRID: 'Mild Hybrid',
  'MILD HYBRID': 'Mild Hybrid',
  'MILD_HYBRID': 'Mild Hybrid',
  ELECTRIC: 'Electric',
};

const GEARBOX_MAP: Record<string, string> = {
  MANUAL: 'Manuală',
  MANUALA: 'Manuală',
  'MANUALĂ': 'Manuală',
  AUTOMATIC: 'Automată',
  AUTOMATA: 'Automată',
  'AUTOMATĂ': 'Automată',
};

const BODY_TYPE_MAP: Record<string, string> = {
  SUV: 'SUV',
  SEDAN: 'Berlină',
  BERLINA: 'Berlină',
  'BERLINĂ': 'Berlină',
  HATCHBACK: 'Hatchback',
  BREAK: 'Break',
  COUPE: 'Coupe',
  CABRIO: 'Cabrio',
  MONOVOLUM: 'Monovolum',
  VAN: 'Van',
  PICKUP: 'Pickup',
};

const RO_MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

function normalizeRoDiacritics(str: string): string {
  if (!str) return '';
  return str
    .replace(/ş/g, 'ș')
    .replace(/Ş/g, 'Ș')
    .replace(/ţ/g, 'ț')
    .replace(/Ţ/g, 'Ț');
}

export function formatSoldMonthYear(soldAt: string | Date | null | undefined): string {
  if (!soldAt) return '';
  const d = new Date(soldAt);
  if (Number.isNaN(d.getTime())) return '';
  const month = RO_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `Vândut: ${month} ${year}`;
}

export function transformCloudinaryUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/image/upload/')) {
    if (url.includes('/c_fill,w_800,h_600')) return url;
    return url.replace('/image/upload/', '/image/upload/c_fill,w_800,h_600,q_auto,f_jpg/');
  }
  return url;
}

function stripHtml(html: string): string {
  if (!html) return '';
  let text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n');
  text = text.replace(/<[^>]*>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n+/g, '\n');
  return text.trim();
}

function getAttrValue(listing: CatalogListingItem, name: string): string | null {
  if (!listing.attributeValues) return null;
  const lower = name.toLowerCase();
  const av = listing.attributeValues.find(
    (item) => item.attribute?.name?.toLowerCase() === lower || item.attributeId === `attr:${name}`
  );
  if (!av) return null;
  if (av.stringValue !== null && av.stringValue !== undefined && av.stringValue.trim() !== '') {
    return av.stringValue.trim();
  }
  if (av.numberValue !== null && av.numberValue !== undefined) {
    return String(av.numberValue);
  }
  if (av.booleanValue !== null && av.booleanValue !== undefined) {
    return av.booleanValue ? 'Da' : 'Nu';
  }
  return null;
}

function formatEur(price: number | null | undefined): string {
  if (price === null || price === undefined || Number.isNaN(price) || price <= 0) return '';
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(price) + ' €';
}

export function extractSpecifications(item: CatalogListingItem): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];

  // 1. An (year)
  const rawYear = item.year ?? getAttrValue(item, 'year') ?? getAttrValue(item, 'An');
  if (rawYear && !Number.isNaN(Number(rawYear)) && Number(rawYear) > 1900) {
    specs.push({ label: 'An', value: String(rawYear) });
  }

  // 2. Kilometraj (mileage)
  const rawMileage = item.mileage ?? getAttrValue(item, 'mileage') ?? getAttrValue(item, 'Kilometraj');
  if (rawMileage !== null && rawMileage !== undefined && rawMileage !== '') {
    const num = Number(rawMileage);
    if (!Number.isNaN(num) && num >= 0) {
      specs.push({
        label: 'Kilometraj',
        value: new Intl.NumberFormat('ro-RO').format(num) + ' km',
      });
    }
  }

  // 3. Putere (powerHp)
  const rawPower =
    item.powerHp ??
    getAttrValue(item, 'powerHp') ??
    getAttrValue(item, 'Putere (CP)') ??
    getAttrValue(item, 'Putere');
  if (rawPower !== null && rawPower !== undefined && rawPower !== '') {
    const num = Number(rawPower);
    if (!Number.isNaN(num) && num > 0) {
      specs.push({ label: 'Putere', value: `${num} CP` });
    }
  }

  // 4. Combustibil (fuel)
  const rawFuel = item.fuelType ?? getAttrValue(item, 'fuelType') ?? getAttrValue(item, 'Combustibil');
  if (rawFuel) {
    const normalizedKey = rawFuel.toUpperCase().trim();
    const mapped = FUEL_TYPE_MAP[normalizedKey] || rawFuel;
    specs.push({ label: 'Combustibil', value: normalizeRoDiacritics(mapped) });
  }

  // 5. Cutie de viteze (transmission)
  const rawGear = item.gearbox ?? getAttrValue(item, 'gearbox') ?? getAttrValue(item, 'Cutie de viteze');
  if (rawGear) {
    const normalizedKey = rawGear.toUpperCase().trim();
    const mapped = GEARBOX_MAP[normalizedKey] || rawGear;
    specs.push({ label: 'Cutie de viteze', value: normalizeRoDiacritics(mapped) });
  }

  // 6. Caroserie (bodyType)
  const rawBody = item.bodyType ?? getAttrValue(item, 'bodyType') ?? getAttrValue(item, 'Caroserie');
  if (rawBody) {
    const normalizedKey = rawBody.toUpperCase().trim();
    const mapped = BODY_TYPE_MAP[normalizedKey] || rawBody;
    specs.push({ label: 'Caroserie', value: normalizeRoDiacritics(mapped) });
  }

  // 7. Culoare (color)
  const rawColor = item.color ?? getAttrValue(item, 'color') ?? getAttrValue(item, 'Culoare');
  if (rawColor) {
    const normalizedKey = rawColor.toUpperCase().trim();
    const mapped = COLOR_MAP[normalizedKey] || rawColor;
    specs.push({ label: 'Culoare', value: normalizeRoDiacritics(mapped) });
  }

  return specs;
}

// --- TrueType / OpenType font cmap parser ---
function readUInt16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

function readUInt32BE(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] << 24) >>> 0) +
    (data[offset + 1] << 16) +
    (data[offset + 2] << 8) +
    data[offset + 3]
  );
}

function readTag(data: Uint8Array, offset: number): string {
  return String.fromCharCode(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
}

export function parseFontCmap(data: Uint8Array): Set<number> {
  const numTables = readUInt16BE(data, 4);
  let cmapOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const tag = readTag(data, 12 + i * 16);
    if (tag === 'cmap') {
      cmapOffset = readUInt32BE(data, 12 + i * 16 + 8);
      break;
    }
  }
  if (!cmapOffset) return new Set();

  const numSubtables = readUInt16BE(data, cmapOffset + 2);
  const supported = new Set<number>();

  for (let i = 0; i < numSubtables; i++) {
    const subtableOffset = cmapOffset + readUInt32BE(data, cmapOffset + 4 + i * 8 + 4);
    const format = readUInt16BE(data, subtableOffset);

    if (format === 4) {
      const segCount = readUInt16BE(data, subtableOffset + 6) / 2;
      const endCodes: number[] = [];
      for (let s = 0; s < segCount; s++) {
        endCodes.push(readUInt16BE(data, subtableOffset + 14 + s * 2));
      }
      const startCodes: number[] = [];
      const startOffset = subtableOffset + 16 + segCount * 2;
      for (let s = 0; s < segCount; s++) {
        startCodes.push(readUInt16BE(data, startOffset + s * 2));
      }
      for (let s = 0; s < segCount; s++) {
        const start = startCodes[s];
        const end = endCodes[s];
        if (start === 0xffff) continue;
        for (let cp = start; cp <= end; cp++) {
          supported.add(cp);
        }
      }
    } else if (format === 12) {
      const nGroups = readUInt32BE(data, subtableOffset + 12);
      for (let g = 0; g < nGroups; g++) {
        const start = readUInt32BE(data, subtableOffset + 16 + g * 12);
        const end = readUInt32BE(data, subtableOffset + 16 + g * 12 + 4);
        for (let cp = start; cp <= end; cp++) {
          supported.add(cp);
        }
      }
    }
  }
  return supported;
}

async function loadFontFile(fontRelativePath: string): Promise<{ base64: string; bytes: Uint8Array }> {
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const path = await import('path');
    const resolvedPath = path.resolve(fontRelativePath.replace(/^\//, ''));
    const buf = fs.readFileSync(resolvedPath);
    return {
      base64: buf.toString('base64'),
      bytes: new Uint8Array(buf),
    };
  } else {
    const res = await fetch(fontRelativePath);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      base64: btoa(binary),
      bytes,
    };
  }
}

async function fetchImageBuffer(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const transformed = transformCloudinaryUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(transformed, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  let completedCount = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        console.warn(`Worker error on item ${idx}:`, err);
      } finally {
        completedCount++;
        onProgress?.(completedCount, items.length);
      }
    }
  }

  const workers = [];
  const workerCount = Math.min(limit, items.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

export async function generateCatalogPdf(
  options: GenerateCatalogOptions
): Promise<CatalogGenerationResult> {
  const t0 = performance.now();
  const {
    businessId,
    businessName = 'Catalog Vehicule',
    viewMode = 'stock',
    apiBaseUrl = 'http://localhost:5000/api',
    concurrency = 8,
    onProgress,
    fontData,
  } = options;

  // 1. Fetch data if not supplied
  let rawListings = options.listings;
  if (!rawListings) {
    onProgress?.({ stage: 'fetch_data', completed: 0, total: 1 });
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    let fetchUrl = '';
    if (token) {
      if (viewMode === 'sold') {
        fetchUrl = `${apiBaseUrl}/listings/status/sold`;
      } else if (viewMode === 'incoming') {
        fetchUrl = `${apiBaseUrl}/listings/status/incoming`;
      } else {
        fetchUrl = `${apiBaseUrl}/listings`;
      }
    } else {
      if (viewMode === 'sold') {
        fetchUrl = `${apiBaseUrl}/public/listings/status/sold?businessId=${encodeURIComponent(
          businessId
        )}&limit=500`;
      } else if (viewMode === 'incoming') {
        fetchUrl = `${apiBaseUrl}/listings/status/incoming?businessId=${encodeURIComponent(
          businessId
        )}`;
      } else {
        fetchUrl = `${apiBaseUrl}/public/listings/search?businessId=${encodeURIComponent(
          businessId
        )}&limit=500`;
      }
    }

    const res = await fetch(fetchUrl, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch listings for businessId ${businessId}: HTTP ${res.status}`);
    }
    const json = await res.json();
    rawListings = (Array.isArray(json) ? json : json.data || []) as CatalogListingItem[];
    onProgress?.({ stage: 'fetch_data', completed: 1, total: 1 });
  }

  // 2. Strict status filter per viewMode
  let filteredListings: CatalogListingItem[] = [];
  if (viewMode === 'sold') {
    filteredListings = rawListings.filter((l) => l.status === 'SOLD' || !l.status);
  } else if (viewMode === 'incoming') {
    filteredListings = rawListings.filter((l) => l.status === 'INCOMING' || !l.status);
  } else {
    filteredListings = rawListings.filter(
      (l) => l.status === 'AVAILABLE' || l.status === 'RESERVED' || !l.status
    );
  }
  const availableCount = filteredListings.length;

  // 3. Sort
  // - sold: soldAt descending
  // - incoming and stock: make alphabetically, then price descending
  if (viewMode === 'sold') {
    filteredListings.sort((a, b) => {
      const timeA = a.soldAt ? new Date(a.soldAt).getTime() : 0;
      const timeB = b.soldAt ? new Date(b.soldAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return a.id.localeCompare(b.id);
    });
  } else {
    filteredListings.sort((a, b) => {
      const makeA = a.make?.name || a.makeName || '';
      const makeB = b.make?.name || b.makeName || '';
      const makeCmp = makeA.localeCompare(makeB, 'ro', { sensitivity: 'base' });
      if (makeCmp !== 0) return makeCmp;

      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
      if (priceB !== priceA) return priceB - priceA;

      return a.id.localeCompare(b.id);
    });
  }

  // 4. Load fonts and build font-based Unicode sanitizer
  onProgress?.({ stage: 'fonts', completed: 0, total: 2 });
  const regFont = fontData?.regularBytes
    ? { base64: fontData.regularBase64, bytes: fontData.regularBytes }
    : await loadFontFile('public/fonts/Inter-Regular.ttf');
  const semiFont = fontData?.semiBoldBytes
    ? { base64: fontData.semiBoldBase64, bytes: fontData.semiBoldBytes }
    : await loadFontFile('public/fonts/Inter-SemiBold.ttf');
  onProgress?.({ stage: 'fonts', completed: 2, total: 2 });

  const supportedCodePoints = parseFontCmap(regFont.bytes);

  // Track normalized vs stripped characters
  const normalizedCharMap = new Map<string, { char: string; codePoint: string; replacement: string; count: number }>();
  let normalizedCharactersTotal = 0;

  const strippedCharMap = new Map<string, { char: string; codePoint: string; count: number }>();
  let strippedCharactersTotal = 0;

  function sanitizeFontText(rawText: string | null | undefined, isMultiline = false): string {
    if (!rawText) return '';

    // Stage 1: NORMALIZE
    // Standardize Romanian diacritics then apply Unicode NFKC (Compatibility Decomposition + Composition)
    const roNorm = normalizeRoDiacritics(rawText);
    const nfkcNorm = roNorm.normalize('NFKC');

    // Detect characters converted to renderable equivalents via NFKC
    const origChars = Array.from(roNorm);
    for (const ch of origChars) {
      const cp = ch.codePointAt(0);
      if (!cp) continue;
      if (!supportedCodePoints.has(cp) && cp !== 10 && cp !== 13 && cp !== 9 && cp !== 32) {
        const decomp = ch.normalize('NFKC');
        if (decomp !== ch && Array.from(decomp).every((c) => supportedCodePoints.has(c.codePointAt(0)!))) {
          const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
          const existing = normalizedCharMap.get(hex);
          if (existing) {
            existing.count++;
          } else {
            normalizedCharMap.set(hex, { char: ch, codePoint: hex, replacement: decomp, count: 1 });
          }
          normalizedCharactersTotal++;
        }
      }
    }

    // Stage 2: STRIP (only what is STILL unrenderable after normalization)
    const normChars = Array.from(nfkcNorm);
    const keptChars: string[] = [];

    for (const ch of normChars) {
      const cp = ch.codePointAt(0);
      if (!cp) continue;
      if (cp === 10 || cp === 13 || cp === 9 || cp === 32 || supportedCodePoints.has(cp)) {
        keptChars.push(ch);
      } else {
        const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
        const existing = strippedCharMap.get(hex);
        if (existing) {
          existing.count++;
        } else {
          strippedCharMap.set(hex, { char: ch, codePoint: hex, count: 1 });
        }
        strippedCharactersTotal++;
      }
    }

    const filtered = keptChars.join('');
    if (isMultiline) {
      const lines = filtered.split(/[\r\n]+/);
      const cleanedLines = lines
        .map((l) => l.replace(/[ \t]+/g, ' ').trim())
        .filter((l) => l.length > 0);
      return cleanedLines.join('\n');
    } else {
      return filtered.replace(/[\r\n\t]+/g, ' ').replace(/[ \t]+/g, ' ').trim();
    }
  }

  // 5. Concurrently fetch primary images
  onProgress?.({ stage: 'fetch_images', completed: 0, total: filteredListings.length });
  const images = await mapConcurrent(
    filteredListings,
    concurrency,
    async (item) => {
      const firstImageUrl = item.images?.[0]?.url;
      if (!firstImageUrl) return null;
      return fetchImageBuffer(firstImageUrl);
    },
    (completed, total) => {
      onProgress?.({ stage: 'fetch_images', completed, total });
    }
  );

  // 6. Draw PDF natively with jsPDF
  onProgress?.({ stage: 'drawing', completed: 0, total: filteredListings.length });
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.addFileToVFS('Inter-Regular.ttf', regFont.base64);
  doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
  doc.addFileToVFS('Inter-SemiBold.ttf', semiFont.base64);
  doc.addFont('Inter-SemiBold.ttf', 'Inter', 'bold');

  let noImagePageCount = 0;
  const totalPages = filteredListings.length;
  const sanitizedBusinessName = sanitizeFontText(businessName, false) || 'Catalog Vehicule';

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const item = filteredListings[i];
    const imgBuf = images[i];
    if (!imgBuf) {
      noImagePageCount++;
    }

    // --- A. Header: Dealer business name only ---
    doc.setFont('Inter', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(sanitizedBusinessName, 20, 16);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(20, 20, 190, 20);

    let currentY = 25;

    // --- B. Image: 130mm wide, 4:3 (130 x 97.5mm), horizontally centred (X = 40mm) ---
    if (imgBuf) {
      doc.addImage(imgBuf, 'JPEG', 40, currentY, 130, 97.5);
      currentY += 97.5 + 7;
    }

    // --- C. Title and Price / Sold Date ---
    const cleanTitle = sanitizeFontText(item.title || 'Vehicul', false);
    doc.setFont('Inter', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900

    const titleLines = doc.splitTextToSize(cleanTitle, 170);
    doc.text(titleLines, 20, currentY);
    currentY += titleLines.length * 6 + 1;

    // Price and/or Sale Date Row
    const formattedPrice = formatEur(item.price);
    const isSold = viewMode === 'sold' && !!item.soldAt;
    const soldDateStr = isSold ? formatSoldMonthYear(item.soldAt) : '';

    if (formattedPrice || soldDateStr) {
      if (formattedPrice) {
        doc.setFont('Inter', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(formattedPrice, 20, currentY);
      }

      if (soldDateStr) {
        doc.setFont('Inter', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        if (formattedPrice) {
          doc.text(soldDateStr, 190, currentY, { align: 'right' });
        } else {
          doc.text(soldDateStr, 20, currentY);
        }
      }

      currentY += 6.5;
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, currentY, 190, currentY);
    currentY += 5.5;

    // --- D. Specifications (Collapsible label/value pairs) ---
    const rawSpecs = extractSpecifications(item);
    const specs = rawSpecs
      .map((s) => ({
        label: sanitizeFontText(s.label, false),
        value: sanitizeFontText(s.value, false),
      }))
      .filter((s) => s.label.length > 0 && s.value.length > 0);

    if (specs.length > 0) {
      doc.setFont('Inter', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Specificații', 20, currentY);
      currentY += 5;

      const numRows = Math.ceil(specs.length / 2);
      for (let sIdx = 0; sIdx < specs.length; sIdx++) {
        const spec = specs[sIdx];
        const col = sIdx % 2;
        const row = Math.floor(sIdx / 2);

        const xCol = col === 0 ? 20 : 105;
        const yRow = currentY + row * 6.5;

        // Label
        doc.setFont('Inter', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(spec.label, xCol, yRow);

        // Value
        doc.setFont('Inter', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(spec.value, xCol + 80, yRow, { align: 'right' });
      }

      currentY += numRows * 6.5 + 2;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, currentY, 190, currentY);
      currentY += 5.5;
    }

    // --- E. Description (Truncated to remaining vertical space) ---
    let rawDesc = item.description ? stripHtml(item.description) : '';
    rawDesc = rawDesc.replace(/^descriere\s*:?\s*/i, '').trim();

    const cleanDesc = sanitizeFontText(rawDesc, true);
    if (cleanDesc && cleanDesc.length > 0) {
      doc.setFont('Inter', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Descriere', 20, currentY);
      currentY += 5;

      doc.setFont('Inter', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700

      const descLines = doc.splitTextToSize(cleanDesc, 170);
      const bottomLimit = 276;
      const lineHeight = 4.2;
      const availableSpace = bottomLimit - currentY;
      const maxLines = Math.max(0, Math.floor(availableSpace / lineHeight));

      if (maxLines > 0) {
        let linesToDraw = descLines.slice(0, maxLines);
        if (descLines.length > maxLines) {
          const lastIdx = linesToDraw.length - 1;
          linesToDraw[lastIdx] = linesToDraw[lastIdx].replace(/\s*\.*$/, '') + '...';
        }
        doc.text(linesToDraw, 20, currentY, { lineHeightFactor: 1.2 });
      }
    }

    // --- F. Footer: Page number & Business name ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, 283, 190, 283);

    doc.setFont('Inter', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(sanitizedBusinessName, 20, 288);
    doc.text(`Pagina ${i + 1} din ${totalPages}`, 190, 288, { align: 'right' });

    onProgress?.({ stage: 'drawing', completed: i + 1, total: totalPages });
  }

  onProgress?.({ stage: 'done', completed: totalPages, total: totalPages });

  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBuffer = new Uint8Array(pdfArrayBuffer);
  const wallClockMs = performance.now() - t0;

  return {
    pdfBuffer,
    pageCount: totalPages,
    totalBytes: pdfBuffer.byteLength,
    wallClockMs,
    noImagePageCount,
    availableCount,
    normalizedCharactersTotal,
    normalizedCharacters: Array.from(normalizedCharMap.values()).sort((a, b) => b.count - a.count),
    strippedCharactersTotal,
    strippedCharacters: Array.from(strippedCharMap.values()).sort((a, b) => b.count - a.count),
  };
}

// Backward compatibility alias for stock generator
export const generateStockCatalogPdf = (
  options: Omit<GenerateCatalogOptions, 'viewMode'>
) => generateCatalogPdf({ ...options, viewMode: 'stock' });
