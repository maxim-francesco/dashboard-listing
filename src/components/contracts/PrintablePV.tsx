import React from 'react';

interface PrintablePVProps {
  business: any | null;
  contract: any | null;   // full contract from GET /:id, has sellerSnapshot, buyerSnapshot, vehicleSnapshot, contractNumber, saleDate, plateNumber
  handover: {
    handoverDate: string;
    handoverMileage?: number;
    items: { 
      carteIdentitate: boolean; 
      talon: boolean; 
      cheiRezerva: boolean; 
      roataRezerva: boolean; 
      setCauciucuri: boolean;
    };
    notes?: string;
  } | null;
}

export const PrintablePV: React.FC<PrintablePVProps> = ({ business, contract, handover }) => {
  if (!contract || !handover) return null;

  const formattedSaleDate = contract.saleDate ? new Date(contract.saleDate).toLocaleDateString('ro-RO') : '___';
  const formattedHandoverDate = handover.handoverDate ? new Date(handover.handoverDate).toLocaleDateString('ro-RO') : '___';

  const seller = contract.sellerSnapshot || {};
  const buyer = contract.buyerSnapshot || {};
  const vehicle = contract.vehicleSnapshot || {};

  const sellerName = seller.name || business?.name || '________________________';
  const sellerCui = seller.cui || business?.companyCui || '________________________';
  const sellerRegCom = seller.regCom || business?.companyRegCom || '________________________';
  const sellerAddress = seller.address || business?.companyAddress || '________________________';

  const buyerName = buyer.name || '________________________';
  const buyerIdText = buyer.type === 'COMPANY' 
    ? `CUI: ${buyer.cui || '___'}, Reg. Com.: ${buyer.regCom || '___'}`
    : `CNP: ${buyer.cnp || '___'}, CI: ${buyer.ciSeries || '___'}${buyer.ciNumber || '___'}`;
  const buyerAddress = buyer.address || '________________________';

  const vehicleTitle = vehicle.title || '________________________';
  const vehicleVin = vehicle.vin || '________________________';
  const vehicleYear = vehicle.year || '___';
  const vehicleColor = vehicle.color || '___';
  const vehiclePlate = contract.plateNumber || '________________________';

  const renderCheckmark = (val: boolean) => val ? '✓ DA' : '✗ NU';

  return (
    <div style={{
      background: '#ffffff',
      fontFamily: "'Times New Roman', Georgia, serif",
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      color: '#000000',
      padding: '50px 70px',
      boxSizing: 'border-box',
      fontSize: '14px',
      lineHeight: '1.6',
    }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
          PROCES-VERBAL DE PREDARE-PRIMIRE
        </h1>
        <p style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
          Anexă la Contractul de vânzare-cumpărare nr. {contract.contractNumber || '___'} din data de {formattedSaleDate}
        </p>
      </div>

      {/* Intro */}
      <div style={{ marginBottom: '25px', textAlign: 'justify' }}>
        <p style={{ margin: '0 0 15px 0' }}>
          Încheiat astăzi, <strong>{formattedHandoverDate}</strong>, între subsemnații:
        </p>
        <p style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
          1. <strong>{sellerName}</strong>, cu sediul în {sellerAddress}, {sellerCui ? `cod unic de înregistrare (CUI) ${sellerCui}` : ''} {sellerRegCom ? `, număr de ordine în registrul comerțului ${sellerRegCom}` : ''}, reprezentată legal de {seller.legalRep || '___'}, în calitate de <strong>PREDĂTOR</strong> (Vânzător),
        </p>
        <p style={{ margin: '0 0 15px 0', paddingLeft: '20px' }}>
          și
        </p>
        <p style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
          2. <strong>{buyerName}</strong>, cu domiciliul/sediul în {buyerAddress}, {buyerIdText}, în calitate de <strong>PRIMITOR</strong> (Cumpărător).
        </p>
      </div>

      {/* Object */}
      <div style={{ marginBottom: '25px' }}>
        <p style={{ margin: '0 0 10px 0' }}>
          Predătorul a procedat la predarea, iar Primitorul la primirea autovehiculului descris în continuare:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', marginBottom: '15px' }}>
          <tbody>
            <tr>
              <td style={{ width: '30%', padding: '5px 0', fontWeight: 'bold' }}>Marcă / Model:</td>
              <td style={{ padding: '5px 0' }}>{vehicleTitle}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Număr identificare (VIN):</td>
              <td style={{ padding: '5px 0', fontFamily: 'monospace', fontSize: '13px' }}>{vehicleVin}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>An fabricație:</td>
              <td style={{ padding: '5px 0' }}>{vehicleYear}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Culoare:</td>
              <td style={{ padding: '5px 0' }}>{vehicleColor}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Număr înmatriculare:</td>
              <td style={{ padding: '5px 0' }}>{vehiclePlate}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>Kilometraj la predare:</td>
              <td style={{ padding: '5px 0' }}>{handover.handoverMileage ? `${new Intl.NumberFormat('ro-RO').format(handover.handoverMileage)} km` : '___ km'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          Elemente predate odată cu autovehiculul:
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0', width: '70%' }}>Carte de identitate a vehiculului (CIV)</td>
              <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                {renderCheckmark(handover.items.carteIdentitate)}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0' }}>Talon / Certificat de înmatriculare</td>
              <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                {renderCheckmark(handover.items.talon)}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0' }}>Chei rezervă / Suplimentare</td>
              <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                {renderCheckmark(handover.items.cheiRezerva)}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0' }}>Roată rezervă / Kit depanare pană</td>
              <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                {renderCheckmark(handover.items.roataRezerva)}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0' }}>Set anvelope suplimentar (iarnă/vară)</td>
              <td style={{ padding: '6px 0', fontWeight: 'bold', textAlign: 'right' }}>
                {renderCheckmark(handover.items.setCauciucuri)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px 0', borderBottom: '1px solid #000', paddingBottom: '3px' }}>
          Observații / Stare constatată:
        </h3>
        <div style={{ 
          minHeight: '60px', 
          border: '1px solid #d1d5db', 
          borderRadius: '4px', 
          padding: '10px', 
          fontSize: '13px',
          whiteSpace: 'pre-wrap',
          background: '#fafafa'
        }}>
          {handover.notes || 'Nu sunt mențiuni speciale.'}
        </div>
      </div>

      {/* Declaration */}
      <div style={{ marginBottom: '40px', textAlign: 'justify', fontSize: '13px', fontStyle: 'italic' }}>
        <p style={{ margin: 0 }}>
          Primitorul declară că a primit autovehiculul în starea descrisă mai sus, împreună cu documentele și accesoriile menționate, fiind de acord cu starea fizică și tehnică a acestuia la momentul predării.
        </p>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
        <div style={{ width: '45%', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 45px 0', textTransform: 'uppercase' }}>PREDĂTOR (Vânzător)</p>
          <div style={{ borderTop: '1px solid #000', margin: '0 auto', width: '80%' }}></div>
          <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>{sellerName}</p>
        </div>
        
        <div style={{ width: '45%', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 45px 0', textTransform: 'uppercase' }}>PRIMITOR (Cumpărător)</p>
          <div style={{ borderTop: '1px solid #000', margin: '0 auto', width: '80%' }}></div>
          <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>{buyerName}</p>
        </div>
      </div>
    </div>
  );
};
