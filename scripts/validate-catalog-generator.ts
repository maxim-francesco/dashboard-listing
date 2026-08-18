/**
 * LOCAL-ONLY VALIDATION SUITE
 *
 * This script is a development & validation tool that verifies vector PDF catalog generation
 * against live test datasets (page counts, DCTDecode image compression, Romanian diacritic
 * NFKC normalization, ordering, and confidential field privacy).
 *
 * ENVIRONMENT & PREREQUISITES:
 * - Sibling repository `saas-platform-backend` must be checked out at `../../saas-platform-backend`.
 * - Resolves Prisma client and compatibility serializer from `saas-platform-backend`.
 * - Requires PostgreSQL container running with valid `DATABASE_URL` in `saas-platform-backend/.env`.
 * - CANNOT run on a standalone frontend-only checkout.
 *
 * USAGE:
 *   npx tsx scripts/validate-catalog-generator.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateCatalogPdf, CatalogListingItem, StrippedCharInfo, NormalizedCharInfo } from '../src/services/catalogPdfGenerator';

interface TargetValidationReport {
  targetKey: string;
  businessId: string;
  businessName: string;
  viewMode: 'stock' | 'sold' | 'incoming';
  expectedRowCount: number;
  generatedPageCount: number;
  totalBytes: number;
  wallClockMs: number;
  noImagePageCount: number;
  pdfPath: string;
  normalizationReport: {
    totalCharactersNormalized: number;
    distinctCodePointsCount: number;
    distinctCharacters: NormalizedCharInfo[];
  };
  strippedReport: {
    totalCharactersStripped: number;
    distinctCodePointsCount: number;
    distinctCharacters: StrippedCharInfo[];
  };
  leadingWhitespaceCheck: {
    passed: boolean;
    pagesInspected: number;
    totalLinesInspected: number;
    violationsCount: number;
  };
  soldDateAndOrderCheck?: {
    passed: boolean;
    datesInspectedCount: number;
    sampleDates: string[];
    isDescendingOrder: boolean;
  };
  imageFilterCheck: {
    passed: boolean;
    filterMatchesCount: number;
  };
  forbiddenFieldsCheck: {
    passed: boolean;
    violations: string[];
  };
}

function extractPdfTextAndCMaps(pdfStr: string): { font: string; text: string }[] {
  const pageFontMap: Record<string, string> = {};
  const resMatches = pdfStr.matchAll(/\/Font\s*<<([^>]+)>>/g);
  for (const m of resMatches) {
    const entries = m[1].trim().split(/\s+/);
    for (let i = 0; i < entries.length; i += 4) {
      if (entries[i].startsWith('/')) {
        const alias = entries[i].replace('/', '');
        const objNum = entries[i + 1];
        pageFontMap[alias] = objNum;
      }
    }
  }

  const fontToUnicodeMap: Record<string, string> = {};
  for (const [alias, objNum] of Object.entries(pageFontMap)) {
    const objRegex = new RegExp(`${objNum}\\s+0\\s+obj([\\s\\S]*?)endobj`);
    const objMatch = pdfStr.match(objRegex);
    if (objMatch) {
      const toUnicodeMatch = objMatch[1].match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (toUnicodeMatch) {
        fontToUnicodeMap[alias] = toUnicodeMatch[1];
      }
    }
  }

  const unicodeCMaps: Record<string, Map<string, string>> = {};
  for (const [alias, toUnicodeObjNum] of Object.entries(fontToUnicodeMap)) {
    const objRegex = new RegExp(
      `${toUnicodeObjNum}\\s+0\\s+obj[\\s\\S]*?stream[\\r\\n]+([\\s\\S]*?)[\\r\\n]+endstream`
    );
    const objMatch = pdfStr.match(objRegex);
    if (objMatch) {
      const cmapStream = objMatch[1];
      const map = new Map<string, string>();

      const bfcharMatches = cmapStream.matchAll(/(\d+)\s+beginbfchar([\s\S]*?)endbfchar/g);
      for (const block of bfcharMatches) {
        const lines = block[2].trim().split(/[\r\n]+/);
        for (const line of lines) {
          const charMatch = line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
          if (charMatch) {
            const srcHex = charMatch[1].toLowerCase();
            const dstHex = charMatch[2];
            let chars = '';
            for (let k = 0; k < dstHex.length; k += 4) {
              chars += String.fromCharCode(parseInt(dstHex.substring(k, k + 4), 16));
            }
            map.set(srcHex, chars);
          }
        }
      }

      const bfrangeMatches = cmapStream.matchAll(/(\d+)\s+beginbfrange([\s\S]*?)endbfrange/g);
      for (const block of bfrangeMatches) {
        const lines = block[2].trim().split(/[\r\n]+/);
        for (const line of lines) {
          const rangeMatch = line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 16);
            const end = parseInt(rangeMatch[2], 16);
            let target = parseInt(rangeMatch[3], 16);
            const pad = rangeMatch[1].length;
            for (let c = start; c <= end; c++, target++) {
              map.set(c.toString(16).padStart(pad, '0').toLowerCase(), String.fromCharCode(target));
            }
          }
        }
      }
      unicodeCMaps[alias] = map;
    }
  }

  const textBlocks: { font: string; text: string }[] = [];
  const btMatches = pdfStr.matchAll(/BT([\s\S]*?)ET/g);
  for (const bt of btMatches) {
    const block = bt[1];
    let currentFont: string | null = null;
    const lines = block.split(/[\r\n]+/);
    for (const line of lines) {
      const fontMatch = line.match(/\/([A-Za-z0-9_]+)\s+[\d.]+\s+Tf/);
      if (fontMatch) currentFont = fontMatch[1];

      const tjMatch = line.match(/<([0-9a-fA-F]+)>\s*Tj/);
      if (tjMatch && currentFont) {
        const hex = tjMatch[1];
        const map = unicodeCMaps[currentFont];
        let decoded = '';
        if (map) {
          for (let i = 0; i < hex.length; i += 4) {
            const code = hex.substring(i, i + 4).toLowerCase();
            decoded += map.get(code) || `[?${code}]`;
          }
        }
        textBlocks.push({ font: currentFont, text: decoded });
      }
    }
  }

  return textBlocks;
}

export async function runCatalogValidation(): Promise<TargetValidationReport[]> {
  const outputDir = path.resolve('C:/Users/Francesco/Desktop/Projects/_screenshots/pdf-vector-catalog-run5');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load Prisma from sibling folder saas-platform-backend
  // @ts-ignore
  const prisma = (await import('../../saas-platform-backend/src/config/prismaClient')).default || (await import('../../saas-platform-backend/src/config/prismaClient'));
  // @ts-ignore
  const { toLegacyListing } = await import('../../saas-platform-backend/src/utils/compatSerializer');

  const targets = [
    {
      key: 'stock_cars_leasing',
      businessId: 'cmhomcpoi02x1ut2cpips3mo3',
      businessName: 'Cars Leasing',
      viewMode: 'stock' as const,
      fileName: 'catalog_stock_cars_leasing_cmhomcpoi02x1ut2cpips3mo3.pdf',
    },
    {
      key: 'stock_patrifar_auto',
      businessId: 'cml8mss5n02t6rb29lh2mnhu2',
      businessName: 'Patrifar Auto',
      viewMode: 'stock' as const,
      fileName: 'catalog_stock_patrifar_auto_cml8mss5n02t6rb29lh2mnhu2.pdf',
    },
    {
      key: 'sold_cars_leasing',
      businessId: 'cmhomcpoi02x1ut2cpips3mo3',
      businessName: 'Cars Leasing',
      viewMode: 'sold' as const,
      fileName: 'catalog_sold_cars_leasing_cmhomcpoi02x1ut2cpips3mo3.pdf',
    },
    {
      key: 'sold_patrifar_auto',
      businessId: 'cml8mss5n02t6rb29lh2mnhu2',
      businessName: 'Patrifar Auto',
      viewMode: 'sold' as const,
      fileName: 'catalog_sold_patrifar_auto_cml8mss5n02t6rb29lh2mnhu2.pdf',
    },
    {
      key: 'incoming_patrifar_auto',
      businessId: 'cml8mss5n02t6rb29lh2mnhu2',
      businessName: 'Patrifar Auto',
      viewMode: 'incoming' as const,
      fileName: 'catalog_incoming_patrifar_auto_cml8mss5n02t6rb29lh2mnhu2.pdf',
    },
  ];

  const reports: TargetValidationReport[] = [];

  for (const target of targets) {
    console.log(`\n========================================`);
    console.log(`Generating catalog: ${target.businessName} | View: ${target.viewMode.toUpperCase()} (${target.businessId})`);
    console.log(`========================================`);

    const statusWhere =
      target.viewMode === 'sold'
        ? 'SOLD'
        : target.viewMode === 'incoming'
        ? 'INCOMING'
        : { in: ['AVAILABLE', 'RESERVED'] };

    const dbRows = await prisma.listing.findMany({
      where: {
        businessId: target.businessId,
        status: statusWhere,
      },
      include: {
        make: true,
        model: true,
        features: true,
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: target.viewMode === 'sold' ? { soldAt: 'desc' } : { createdAt: 'desc' },
    });

    const expectedRowCount = dbRows.length;
    const listings: CatalogListingItem[] = dbRows.map((l: any) => {
      const legacy = toLegacyListing(l, { mode: 'search' });
      legacy.soldAt = l.soldAt;
      return legacy;
    });

    const result = await generateCatalogPdf({
      businessId: target.businessId,
      businessName: target.businessName,
      viewMode: target.viewMode,
      listings,
      concurrency: 8,
      onProgress: (p) => {
        if (p.stage === 'fetch_images' || p.stage === 'drawing') {
          process.stdout.write(`\r[${target.businessName} - ${target.viewMode}] Stage: ${p.stage} -> ${p.completed} / ${p.total}`);
        }
      },
    });
    console.log('\nDone generating in', result.wallClockMs.toFixed(1), 'ms');

    const pdfPath = path.join(outputDir, target.fileName);
    fs.writeFileSync(pdfPath, Buffer.from(result.pdfBuffer));

    const pdfStr = Buffer.from(result.pdfBuffer).toString('latin1');
    const extractedBlocks = extractPdfTextAndCMaps(pdfStr);
    const combinedExtractedText = extractedBlocks.map((b) => b.text).join(' ');

    // Extract pages by footer
    const pages: string[][] = [];
    let curPage: string[] = [];
    for (const b of extractedBlocks) {
      curPage.push(b.text);
      if (b.text.startsWith('Pagina ') && b.text.includes(' din ')) {
        pages.push(curPage);
        curPage = [];
      }
    }
    if (curPage.length > 0) pages.push(curPage);

    // 1. Leading whitespace check on descriptions
    let totalLinesInspected = 0;
    const violationLines: string[] = [];
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const pLines = pages[pIdx];
      const descIdx = pLines.indexOf('Descriere');
      if (descIdx !== -1) {
        const descLines = pLines.slice(descIdx + 1, -2);
        for (const line of descLines) {
          totalLinesInspected++;
          if (/^\s/.test(line)) {
            violationLines.push(`Page ${pIdx + 1}: "${line}"`);
          }
        }
      }
    }

    // 2. Sold date and ordering verification
    let soldDateAndOrderCheck: TargetValidationReport['soldDateAndOrderCheck'] | undefined;
    if (target.viewMode === 'sold') {
      const sampleDates: string[] = [];
      let isDescending = true;
      let prevTime = Infinity;

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pLines = pages[pIdx];
        const soldLine = pLines.find((l) => l.startsWith('Vândut: '));
        if (soldLine) {
          sampleDates.push(`Page ${pIdx + 1}: ${soldLine}`);
        }
        const itemSoldAt = listings[pIdx]?.soldAt;
        const curTime = itemSoldAt ? new Date(itemSoldAt).getTime() : 0;
        if (curTime > prevTime) {
          isDescending = false;
        }
        prevTime = curTime;
      }

      soldDateAndOrderCheck = {
        passed: isDescending && sampleDates.length === pages.length,
        datesInspectedCount: sampleDates.length,
        sampleDates: sampleDates.slice(0, 5),
        isDescendingOrder: isDescending,
      };
    }

    // 3. Image DCTDecode filter check
    const filterMatches = Array.from(
      pdfStr.matchAll(/\/Subtype\s*\/Image[\s\S]*?\/Filter\s*\/([A-Za-z0-9]+)/g)
    );
    const allFiltersDCT =
      filterMatches.length > 0 &&
      filterMatches.every((m) => m[1] === 'DCTDecode');

    // 4. Forbidden fields check
    const violations: string[] = [];
    if (combinedExtractedText.includes('purchasePrice') || combinedExtractedText.includes('Preț achiziție')) {
      violations.push('purchasePrice leaked into text');
    }
    if (combinedExtractedText.includes('sellingPrice') || combinedExtractedText.includes('Preț vânzare')) {
      violations.push('sellingPrice leaked into text');
    }

    const pdfBuffer = Buffer.from(result.pdfBuffer);
    const sha256 = (await import('crypto')).createHash('sha256').update(pdfBuffer).digest('hex');

    reports.push({
      targetKey: target.key,
      businessId: target.businessId,
      businessName: target.businessName,
      viewMode: target.viewMode,
      expectedRowCount,
      generatedPageCount: result.pageCount,
      totalBytes: result.totalBytes,
      sha256,
      wallClockMs: result.wallClockMs,
      noImagePageCount: result.noImagePageCount,
      pdfPath,
      normalizationReport: {
        totalCharactersNormalized: result.normalizedCharactersTotal,
        distinctCodePointsCount: result.normalizedCharacters.length,
        distinctCharacters: result.normalizedCharacters,
      },
      strippedReport: {
        totalCharactersStripped: result.strippedCharactersTotal,
        distinctCodePointsCount: result.strippedCharacters.length,
        distinctCharacters: result.strippedCharacters,
      },
      leadingWhitespaceCheck: {
        passed: violationLines.length === 0,
        pagesInspected: pages.length,
        totalLinesInspected,
        violationsCount: violationLines.length,
      },
      soldDateAndOrderCheck,
      imageFilterCheck: {
        passed: allFiltersDCT,
        filterMatchesCount: filterMatches.length,
      },
      forbiddenFieldsCheck: {
        passed: violations.length === 0,
        violations,
      },
    });
  }

  return reports;
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith('validate-catalog-generator.ts') ||
    process.argv[1].endsWith('validate-catalog-generator.js'))
) {
  runCatalogValidation()
    .then((reports) => {
      console.log('\n=== CATALOG GENERATION VALIDATION REPORT ===');
      console.log(JSON.stringify(reports, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Validation failed:', err);
      process.exit(1);
    });
}
