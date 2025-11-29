import React from 'react';

interface Listing {
  title: string;
  description: string;
  images?: { url: string }[];
  attributeValues?: {
    attribute: {
      name: string;
    };
    stringValue?: string | null;
    numberValue?: number | null;
  }[];
}

interface PrintableSpecSheetProps {
  listing: Listing | null;
}

// Helper: Normalize string (remove diacritics, lowercase)
const normalizeString = (str: string): string => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Helper: Find attribute value insensitive to diacritics
const findAttr = (listing: Listing, attrName: string): string => {
  if (!listing?.attributeValues) return 'N/A';
  const normalizedAttrName = normalizeString(attrName);
  const attr = listing.attributeValues.find(
    (av) => av.attribute && normalizeString(av.attribute.name) === normalizedAttrName
  );
  if (!attr) return 'N/A';
  const value = attr.stringValue ?? attr.numberValue;
  return value ? String(value) : 'N/A';
};

export const PrintableSpecSheet: React.FC<PrintableSpecSheetProps> = ({ listing }) => {
  if (!listing) return null;

  const price = findAttr(listing, 'Pret'); // Sau 'Price'
  const formattedPrice = price !== 'N/A' ? new Intl.NumberFormat('ro-RO').format(Number(price)) : 'N/A';
  
  // Pre-calculate attributes
  const marca = findAttr(listing, 'Marcă');
  const model = findAttr(listing, 'Model');
  const anFabricatie = findAttr(listing, 'An fabricație');
  const kilometraj = findAttr(listing, 'Kilometraj');
  const combustibil = findAttr(listing, 'Combustibil');
  const transmisie = findAttr(listing, 'Cutie de viteze');

  return (
    <div className="p-8 text-black bg-white font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="mb-6 border-b-2 border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{listing.title}</h1>
      </header>

      <main>
        <div className="mb-8">
          {listing.images && listing.images.length > 0 && (
            <img
              src={listing.images[0].url}
              alt={listing.title}
              className="w-full h-64 object-cover rounded-md mb-6"
              crossOrigin="anonymous" // Important for html2canvas
            />
          )}
          <p className="text-4xl font-bold text-blue-600 text-right">
            {formattedPrice} €
          </p>
        </div>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">Specificații Cheie</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-base">
            {marca !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">Marcă:</span><span>{marca}</span></div>
            )}
            {model !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">Model:</span><span>{model}</span></div>
            )}
            {anFabricatie !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">An Fabricație:</span><span>{anFabricatie}</span></div>
            )}
            {kilometraj !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">Kilometraj:</span><span>{kilometraj} km</span></div>
            )}
            {combustibil !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">Combustibil:</span><span>{combustibil}</span></div>
            )}
            {transmisie !== 'N/A' && (
              <div className="flex justify-between border-b pb-2"><span className="font-semibold text-gray-600">Transmisie:</span><span>{transmisie}</span></div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">Descriere</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {listing.description || 'Nicio descriere adăugată.'}
          </p>
        </section>
      </main>
    </div>
  );
};
