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

  const price = findAttr(listing, 'Pret'); 
  const formattedPrice = price !== 'N/A' ? new Intl.NumberFormat('ro-RO').format(Number(price)) : 'N/A';
  
  // Attributes
  const marca = findAttr(listing, 'Marcă');
  const model = findAttr(listing, 'Model');
  const anFabricatie = findAttr(listing, 'An fabricație');
  const kilometraj = findAttr(listing, 'Kilometraj');
  const combustibil = findAttr(listing, 'Combustibil');
  const transmisie = findAttr(listing, 'Cutie de viteze');

  return (
    <div 
      className="bg-white font-sans relative" 
      style={{ 
        width: '210mm', 
        minHeight: '297mm',
        margin: '0 auto',
        padding: '0' 
      }}
    >
      {/* Decorative Top Bar */}
      <div className="h-4 bg-slate-800 w-full"></div>

      <div className="p-10">
        {/* Header Section */}
        <header className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
          <div className="w-2/3 pr-4">
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              {listing.title}
            </h1>
            <p className="text-slate-500 text-lg uppercase tracking-wide font-semibold">
              {marca !== 'N/A' ? marca : ''} {model !== 'N/A' ? model : ''}
            </p>
          </div>
          <div className="w-1/3 text-right">
            <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md">
              <span className="text-3xl font-bold">{formattedPrice} €</span>
            </div>
          </div>
        </header>

        <main>
          {/* Main Image Section */}
          <div className="mb-10 relative">
            {listing.images && listing.images.length > 0 ? (
              <div className="rounded-xl overflow-hidden shadow-xl border border-gray-100 aspect-video relative">
                 <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous" 
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                Fără imagine
              </div>
            )}
          </div>
          
          {/* Specs Grid */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="w-2 h-8 bg-blue-600 mr-3 rounded-sm"></span>
              Detalii Tehnice & Specificații
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Card Helper Component for cleaner JSX */}
              {marca !== 'N/A' && <SpecCard label="Marcă" value={marca} />}
              {model !== 'N/A' && <SpecCard label="Model" value={model} />}
              {anFabricatie !== 'N/A' && <SpecCard label="An Fabricație" value={anFabricatie} />}
              {kilometraj !== 'N/A' && <SpecCard label="Kilometraj" value={`${kilometraj} km`} />}
              {combustibil !== 'N/A' && <SpecCard label="Combustibil" value={combustibil} />}
              {transmisie !== 'N/A' && <SpecCard label="Transmisie" value={transmisie} />}
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full bg-slate-900 text-white py-6 px-10">
        <div className="flex justify-between items-center opacity-80 text-sm">
          <div>
            <p className="font-bold text-base mb-1">
              Pentru detalii complete și disponibilitate, vă rugăm să contactați
              reprezentantul nostru de vânzări.
            </p>
            <p>Document informativ. Nu constituie o ofertă contractuală.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Small helper component for the grid items
const SpecCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-lg font-semibold text-slate-800 truncate" title={value}>{value}</span>
  </div>
);
