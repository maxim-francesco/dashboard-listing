
import React from 'react';
import { Gauge, Calendar, Fuel, Zap, ShieldCheck, CarFront, Settings, Info } from "lucide-react";

interface Listing {
  title: string;
  description: string | null;
  images?: { url: string }[];
  attributeValues?: {
    attribute: {
      name: string;
      type: string;
      attributeGroup?: { name: string } | null;
    };
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
  }[];
}

interface PrintableSpecSheetProps {
  listing: Listing | null;
}

const normalizeString = (str: string): string => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const findAttr = (listing: Listing, attrName: string): { value: string, exists: boolean } => {
  if (!listing?.attributeValues) return { value: 'N/A', exists: false };
  const normalizedAttrName = normalizeString(attrName);
  const attr = listing.attributeValues.find(
    (av) => av.attribute && normalizeString(av.attribute.name).includes(normalizedAttrName)
  );
  if (!attr) return { value: 'N/A', exists: false };
  if (attr.attribute.type === 'BOOLEAN') {
    return { value: attr.booleanValue ? 'Da' : 'Nu', exists: true };
  }
  const val = attr.stringValue ?? attr.numberValue;
  return { value: val ? String(val) : 'N/A', exists: true };
};

const getGroupIcon = (groupName: string) => {
  const n = groupName.toLowerCase();
  if (n.includes('confort')) return <Settings className="w-3.5 h-3.5 text-white" />;
  if (n.includes('sigur')) return <ShieldCheck className="w-3.5 h-3.5 text-white" />;
  if (n.includes('tehnic')) return <CarFront className="w-3.5 h-3.5 text-white" />;
  return <Info className="w-3.5 h-3.5 text-white" />;
};

const AttrValue: React.FC<{ av: any }> = ({ av }) => {
  if (av.attribute.type === 'BOOLEAN') {
    const isTrue = av.booleanValue;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        background: isTrue ? '#dcfce7' : '#fee2e2',
        color: isTrue ? '#15803d' : '#b91c1c',
        border: `1px solid ${isTrue ? '#bbf7d0' : '#fecaca'}`,
      }}>
        {isTrue ? '✓ Da' : '✗ Nu'}
      </span>
    );
  }
  return (
    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
      {av.stringValue || av.numberValue || 'N/A'}
    </span>
  );
};

export const PrintableSpecSheet: React.FC<PrintableSpecSheetProps> = ({ listing }) => {
  if (!listing) return null;

  const priceAttr = findAttr(listing, 'Pret');
  const formattedPrice = priceAttr.exists ? new Intl.NumberFormat('ro-RO').format(Number(priceAttr.value)) : 'N/A';

  const highlights: { label: string, value: string, exists: boolean, icon: React.ReactNode, suffix?: string }[] = [
    { label: 'Kilometraj', ...findAttr(listing, 'Kilometraj'), icon: <Gauge className="w-5 h-5" style={{ color: '#2563eb' }} />, suffix: ' km' },
    { label: 'An Fabricație', ...findAttr(listing, 'An'), icon: <Calendar className="w-5 h-5" style={{ color: '#2563eb' }} /> },
    { label: 'Combustibil', ...findAttr(listing, 'Combustibil'), icon: <Fuel className="w-5 h-5" style={{ color: '#2563eb' }} /> },
    { label: 'Putere (CP)', ...findAttr(listing, 'Putere'), icon: <Zap className="w-5 h-5" style={{ color: '#2563eb' }} />, suffix: ' CP' },
  ].filter(h => h.exists);

  const groupedAttributes: Record<string, any[]> = {};
  listing.attributeValues?.forEach(av => {
    const attrName = normalizeString(av.attribute.name);
    if (['pret', 'price', 'an', 'kilometraj', 'combustibil', 'putere'].some(key => attrName.includes(key))) return;
    const groupName = av.attribute.attributeGroup?.name || 'Alte Specificații';
    if (!groupedAttributes[groupName]) groupedAttributes[groupName] = [];
    groupedAttributes[groupName].push(av);
  });

  return (
    <div style={{
      background: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      color: '#0f172a',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Top accent bar */}
      <div style={{ height: '6px', background: 'linear-gradient(90deg, #0f172a 0%, #1d4ed8 100%)', width: '100%' }} />

      <div style={{ padding: '28px 32px 120px 32px' }}>
        {/* ── HEADER ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1.5px solid #e2e8f0' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
              {listing.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ height: '3px', width: '40px', background: '#2563eb', borderRadius: '2px' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
                Documentație Tehnică Certificată
              </span>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            padding: '14px 22px',
            borderRadius: '14px',
            textAlign: 'center',
            minWidth: '150px',
            borderBottom: '3px solid #2563eb',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
              Preț Informativ
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px' }}>
              {formattedPrice} €
            </div>
          </div>
        </header>

        {/* ── KEY HIGHLIGHTS ── */}
        {highlights.length > 0 && (
          <section style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '10px' }}>
              Rezumat Caracteristici Cheie
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${highlights.length}, 1fr)`, gap: '10px' }}>
              {highlights.map((h, i) => (
                <div key={i} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', border: '1px solid #bfdbfe', flexShrink: 0 }}>
                    {h.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>
                      {h.label}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {h.value}{h.suffix}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── GROUPED ATTRIBUTES ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {Object.entries(groupedAttributes).map(([groupName, attrs], idx) => {
            // Split attrs into 2 columns
            const mid = Math.ceil(attrs.length / 2);
            const col1 = attrs.slice(0, mid);
            const col2 = attrs.slice(mid);

            return (
              <section key={idx} style={{ pageBreakInside: 'avoid' }}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ background: '#2563eb', padding: '5px 7px', borderRadius: '7px', display: 'flex', alignItems: 'center' }}>
                    {getGroupIcon(groupName)}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                    {groupName}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                {/* 2-column table layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  {[col1, col2].map((col, colIdx) => (
                    <div key={colIdx}>
                      {col.map((av, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 12px',
                          background: i % 2 === 0 ? '#f8fafc' : '#ffffff',
                          borderBottom: i < col.length - 1 ? '1px solid #f1f5f9' : 'none',
                          gap: '8px',
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                            {av.attribute.name}
                          </span>
                          <AttrValue av={av} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── DESCRIPTION ── */}
        {listing.description && (
          <section style={{ marginTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
                Observații Generale
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '3px solid #2563eb',
              borderRadius: '8px',
              padding: '16px 18px',
              fontSize: '11px',
              color: '#475569',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic',
            }}>
              {listing.description}
            </div>
          </section>
        )}

        {/* ── BOTTOM META ── */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}>
          <span>Dată Generare: {new Date().toLocaleDateString('ro-RO')}</span>
          <span style={{ color: '#2563eb' }}>SaaS Auto Certified</span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        color: 'white',
        padding: '18px 32px',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* decorative circle */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(37,99,235,0.12)', borderRadius: '50%' }} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.2px' }}>
            Interesat de această mașină?
          </p>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, fontWeight: 500, maxWidth: '360px', lineHeight: 1.5 }}>
            Contactați reprezentantul nostru de vânzări pentru o ofertă personalizată, istoric service detaliat sau programarea unui test-drive.
          </p>
        </div>
        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#60a5fa', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>
            SAAS AUTO
          </p>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '2.5px', margin: 0 }}>
            Inventory Management
          </p>
        </div>
      </footer>
    </div>
  );
};
