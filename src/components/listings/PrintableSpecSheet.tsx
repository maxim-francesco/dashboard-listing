
import React from 'react';

// Define the expected structure for a listing to ensure type safety.
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

// Helper function to find a specific attribute value from the listing data.
// It checks both string and number values and is case-insensitive.
const findAttr = (listing: Listing, attrName: string): string => {
  if (!listing?.attributeValues) return 'N/A';
  
  const attr = listing.attributeValues.find(
    (av) => av.attribute.name.toLowerCase() === attrName.toLowerCase()
  );
  
  if (!attr) return 'N/A';

  const value = attr.stringValue ?? attr.numberValue;
  return value ? String(value) : 'N/A';
};

// The PrintableSpecSheet component is wrapped in React.forwardRef
// to allow the react-to-print library to attach a ref to the DOM element.
export const PrintableSpecSheet = React.forwardRef<HTMLDivElement, PrintableSpecSheetProps>(({ listing }, ref) => {
  // If no listing data is provided, the component renders nothing.
  if (!listing) return null;

  const price = findAttr(listing, 'Pret');
  const formattedPrice = price !== 'N/A' ? new Intl.NumberFormat('ro-RO').format(Number(price)) : 'N/A';

  // The component is designed to be hidden from the screen (using 'hidden' and 'print:block')
  // and will only be visible when the print dialog is triggered.
  return (
    <div className="hidden">
        <div ref={ref} className="p-8 text-black bg-white font-sans">
            {/* Header Section */}
            <header className="mb-6 border-b-2 border-gray-200 pb-4">
                <h1 className="text-3xl font-bold text-gray-800">{listing.title}</h1>
            </header>

            <main>
                {/* Main Image and Price Section */}
                <div className="mb-8">
                    {listing.images && listing.images.length > 0 && (
                        <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-auto object-cover rounded-md mb-6"
                        />
                    )}
                     <p className="text-4xl font-bold text-blue-600 text-right">
                        {formattedPrice} €
                    </p>
                </div>
                
                {/* Key Specifications Section */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">Specificații Cheie</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-base">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">Marcă:</span>
                            <span className="text-gray-800">{findAttr(listing, 'Marcă')}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">Model:</span>
                            <span className="text-gray-800">{findAttr(listing, 'Model')}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">An Fabricație:</span>
                            <span className="text-gray-800">{findAttr(listing, 'An fabricație')}</span>
                        </div>
                         <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">Kilometraj:</span>
                            <span className="text-gray-800">{findAttr(listing, 'Kilometraj')} km</span>
                        </div>
                         <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">Combustibil:</span>
                            <span className="text-gray-800">{findAttr(listing, 'Combustibil')}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-gray-600">Transmisie:</span>
                            <span className="text-gray-800">{findAttr(listing, 'Cutie de viteze')}</span>
                        </div>
                    </div>
                </section>

                {/* Description Section */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">Descriere</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {listing.description || 'Nicio descriere adăugată.'}
                    </p>
                </section>
            </main>
        </div>
    </div>
  );
});

