import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

interface OfferData {
  clientName: string;
  offerPrice: number;
  listPrice: number | null;
  validityDays: number;
}

interface BusinessIdentity {
  name?: string;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyAddress?: string | null;
  companyCui?: string | null;
  companyRegCom?: string | null;
  companyLegalRep?: string | null;
}

interface PrintableOfferProps {
  listing: any | null;   // runtime listing object with title, price, attributeValues
  business: BusinessIdentity | null;
  offer: OfferData | null;
}

const normalizeString = (str: string): string => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const findAttr = (listing: any, attrName: string): { value: string, exists: boolean } => {
  if (!listing?.attributeValues) return { value: 'N/A', exists: false };
  const normalizedAttrName = normalizeString(attrName);
  const attr = listing.attributeValues.find(
    (av: any) => av.attribute && normalizeString(av.attribute.name).includes(normalizedAttrName)
  );
  if (!attr) return { value: 'N/A', exists: false };
  if (attr.attribute.type === 'BOOLEAN') {
    return { value: attr.booleanValue ? 'Da' : 'Nu', exists: true };
  }
  const val = attr.stringValue ?? attr.numberValue;
  return { value: val ? String(val) : 'N/A', exists: true };
};

export const PrintableOffer: React.FC<PrintableOfferProps> = ({ listing, business, offer }) => {
  if (!listing || !offer) return null;

  const highlights = [
    { label: 'Kilometraj', ...findAttr(listing, 'Kilometraj'), suffix: ' km' },
    { label: 'An Fabricație', ...findAttr(listing, 'An') },
    { label: 'Combustibil', ...findAttr(listing, 'Combustibil') },
    { label: 'Putere', ...findAttr(listing, 'Putere'), suffix: ' CP' },
    { label: 'Cutie de viteze', ...findAttr(listing, 'Cutie') },
    { label: 'Caroserie', ...findAttr(listing, 'Caroserie') },
  ].filter(h => h.exists);

  // Compute deadline
  const today = new Date();
  const deadline = new Date();
  deadline.setDate(today.getDate() + offer.validityDays);

  const formattedToday = today.toLocaleDateString('ro-RO');
  const formattedDeadline = deadline.toLocaleDateString('ro-RO');

  const formattedOfferPrice = new Intl.NumberFormat('ro-RO').format(offer.offerPrice);
  const formattedListPrice = offer.listPrice ? new Intl.NumberFormat('ro-RO').format(offer.listPrice) : null;

  const savings = offer.listPrice && offer.listPrice > offer.offerPrice ? offer.listPrice - offer.offerPrice : null;

  const photoUrl = listing?.images?.[0]?.url || null;

  return (
    <div style={{
      background: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      width: '210mm',
      height: '297mm',
      margin: '0 auto',
      color: '#0f172a',
      position: 'relative',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top accent bar */}
      <div style={{ height: '6px', background: 'linear-gradient(90deg, #0f172a 0%, #1d4ed8 100%)', width: '100%', flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '36px 36px 24px 36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ── HEADER ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1.5px solid #e2e8f0' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: '0', letterSpacing: '-0.5px' }}>
              OFERTĂ DE PREȚ
            </h1>
            {business?.name && (
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '6px' }}>
                {business.name}
              </div>
            )}
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            padding: '14px 22px',
            borderRadius: '12px',
            textAlign: 'center',
            minWidth: '160px',
            borderBottom: '3px solid #2563eb',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>
              Preț Ofertă
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
              {formattedOfferPrice} €
            </div>
          </div>
        </header>

        {/* ── PHOTO BAND ── */}
        <div style={{
          width: '100%',
          aspectRatio: '16 / 7',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        }}>
          {photoUrl && (
            <img 
              src={photoUrl} 
              crossOrigin="anonymous" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          )}
          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 800,
          }}>
            {listing.title}
          </div>
        </div>

        {/* ── CLIENT DETAILS ── */}
        <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0' }}>
            Emisă pentru
          </h3>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {offer.clientName}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
            <strong>Data emiterii:</strong> {formattedToday}
          </div>
        </section>

        {/* ── SPECS GRID ── */}
        {highlights.length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {highlights.map((h, i) => (
              <div key={i} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {h.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {h.value}{h.suffix || ''}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── COMPARISON / PRICE DETAIL ── */}
        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
          {formattedListPrice && offer.listPrice !== offer.offerPrice ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Preț Listă: <span style={{ textDecoration: 'line-through' }}>{formattedListPrice} €</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                  Preț Ofertă Specială: {formattedOfferPrice} €
                </div>
              </div>
              {savings && savings > 0 && (
                <div style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 800,
                }}>
                  −{new Intl.NumberFormat('ro-RO').format(savings)} €
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
              Preț Ofertă: {formattedOfferPrice} €
            </div>
          )}
        </section>

        {/* ── VALIDITY NOTICE ── */}
        <section style={{
          background: '#eff6ff',
          border: '1px dashed #bfdbfe',
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center',
          color: '#1e40af',
          fontSize: '12px',
          fontWeight: 700,
        }}>
          Ofertă valabilă până la: {formattedDeadline} ({offer.validityDays} zile)
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        color: 'white',
        padding: '24px 36px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.6' }}>
          {business?.name && (
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', marginBottom: '3px' }}>
              {business.name}
            </div>
          )}
          {business?.companyAddress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin style={{ width: '12px', height: '12px', color: '#60a5fa', flexShrink: 0 }} />
              <span>{business.companyAddress}</span>
            </div>
          )}
          {business?.companyPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone style={{ width: '12px', height: '12px', color: '#60a5fa', flexShrink: 0 }} />
              <span>{business.companyPhone}</span>
            </div>
          )}
          {business?.companyEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail style={{ width: '12px', height: '12px', color: '#60a5fa', flexShrink: 0 }} />
              <span>{business.companyEmail}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#94a3b8' }}>
          {business?.companyCui && <div>CUI: {business.companyCui}</div>}
          {business?.companyRegCom && <div>Reg. Com.: {business.companyRegCom}</div>}
        </div>
      </footer>
    </div>
  );
};
