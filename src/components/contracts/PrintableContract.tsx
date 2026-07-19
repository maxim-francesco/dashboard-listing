import React from 'react';

interface PrintableContractProps {
  listing: any | null;
  business: any | null;
  contract: {
    buyerType: "INDIVIDUAL" | "COMPANY";
    buyerName: string;
    buyerAddress?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    buyerCnp?: string;
    buyerCiSeries?: string;
    buyerCiNumber?: string;
    buyerCui?: string;
    buyerRegCom?: string;
    buyerLegalRep?: string;
    salePrice: number;
    saleDate: string;
    plateNumber?: string;
    mileageAtSale?: number;
    clauses?: string;
    contractNumber?: number | null;
  } | null;
}

export const PrintableContract: React.FC<PrintableContractProps> = ({ listing, business, contract }) => {
  if (!contract) return null;

  const formattedPrice = new Intl.NumberFormat('ro-RO').format(contract.salePrice);
  const formattedDate = contract.saleDate ? new Date(contract.saleDate).toLocaleDateString('ro-RO') : '___';

  const sellerName = business?.name || '________________________';
  const sellerAddress = business?.companyAddress || '________________________';
  const sellerCui = business?.companyCui || '________________________';
  const sellerRegCom = business?.companyRegCom || '________________________';
  const sellerLegalRep = business?.companyLegalRep || '________________________';
  const sellerPhone = business?.companyPhone || '________________________';

  const vehicleTitle = listing?.title || '________________________';
  const vehicleMake = listing?.make?.name || '________________________';
  const vehicleModel = listing?.model?.name || '________________________';
  const vehicleVariant = listing?.variant || '';
  const vehicleYear = listing?.year || '___';
  const vehicleVin = listing?.vin || '________________________';
  const vehicleMileage = contract.mileageAtSale ?? listing?.mileage ?? '___';
  const vehicleColor = listing?.colorDetail || '___';

  return (
    <div style={{
      background: '#ffffff',
      fontFamily: "'Times New Roman', Georgia, serif",
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      color: '#000000',
      padding: '40px 60px',
      boxSizing: 'border-box',
      fontSize: '14px',
      lineHeight: '1.5',
    }}>
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', textTransform: 'uppercase' }}>
          Contract de vânzare-cumpărare
        </h1>
        <h2 style={{ fontSize: '16px', fontWeight: 'normal', margin: '0 0 15px 0' }}>
          pentru un autovehicul folosit
        </h2>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Nr. {contract.contractNumber ?? '_______'} / Data: {formattedDate}
        </div>
      </div>

      {/* SECTION I */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '10px' }}>
          I. Părțile contractante
        </h3>
        
        {/* SELLER */}
        <div style={{ marginBottom: '12px', textAlign: 'justify' }}>
          <strong>VÂNZĂTORUL:</strong> Societatea comercială <strong>{sellerName}</strong>, 
          cu sediul în {sellerAddress}, 
          înregistrată la Registrul Comerțului sub nr. {sellerRegCom}, 
          CUI {sellerCui}, 
          reprezentată legal de {sellerLegalRep}, 
          în calitate de vânzător, telefon: {sellerPhone}.
        </div>

        {/* BUYER */}
        <div style={{ textAlign: 'justify' }}>
          <strong>CUMPĂRĂTORUL:</strong> {contract.buyerType === "INDIVIDUAL" ? (
            <span>
              Dl./Dna. <strong>{contract.buyerName}</strong>, 
              domiciliat(ă) în {contract.buyerAddress || '________________________'}, 
              identificat(ă) cu CI seria {contract.buyerCiSeries || '____'} nr. {contract.buyerCiNumber || '______'}, 
              CNP {contract.buyerCnp || '_____________'}, 
              telefon: {contract.buyerPhone || '__________________'}
              {contract.buyerEmail ? `, email: ${contract.buyerEmail}` : ''}.
            </span>
          ) : (
            <span>
              Societatea <strong>{contract.buyerName}</strong>, 
              cu sediul social în {contract.buyerAddress || '________________________'}, 
              înregistrată la Registrul Comerțului sub nr. {contract.buyerRegCom || '________________________'}, 
              CUI {contract.buyerCui || '________________________'}, 
              reprezentată legal de {contract.buyerLegalRep || '________________________'}, 
              telefon: {contract.buyerPhone || '__________________'}
              {contract.buyerEmail ? `, email: ${contract.buyerEmail}` : ''}.
            </span>
          )}
        </div>
      </div>

      {/* SECTION II */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '10px' }}>
          II. Obiectul contractului
        </h3>
        <div style={{ textAlign: 'justify', marginBottom: '10px' }}>
          Obiectul prezentului contract îl constituie înstrăinarea dreptului de proprietate de către vânzător în favoarea cumpărătorului asupra următorului autovehicul folosit:
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', width: '30%', fontWeight: 'bold' }}>Marcă / Model / Variantă</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{vehicleMake} {vehicleModel} {vehicleVariant} ({vehicleTitle})</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>An fabricație</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{vehicleYear}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>Număr identificare (VIN)</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontFamily: 'monospace' }}>{vehicleVin}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>Număr înmatriculare</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{contract.plateNumber || 'Număr provizoriu / Neînmatriculat'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>Kilometraj la vânzare</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{vehicleMileage} km</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000000', padding: '6px 10px', fontWeight: 'bold' }}>Culoare</td>
              <td style={{ border: '1px solid #000000', padding: '6px 10px' }}>{vehicleColor}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION III */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '10px' }}>
          III. Prețul și modalitatea de plată
        </h3>
        <div style={{ textAlign: 'justify' }}>
          Prețul de vânzare convenit de comun acord între părți este de <strong>{formattedPrice} EUR</strong> (euro). 
          Cumpărătorul declară că a achitat integral această sumă vânzătorului la data semnării prezentului contract, semnătura vânzătorului pe acest document constituind și chitanță descărcătoare de plată.
        </div>
      </div>

      {/* SECTION IV */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '3px', marginBottom: '10px' }}>
          IV. Clauze contractuale
        </h3>
        <div style={{ textAlign: 'justify', whiteSpace: 'pre-wrap', fontFamily: "'Times New Roman', Georgia, serif" }}>
          {contract.clauses || 'Nu au fost stipulate clauze adiționale.'}
        </div>
      </div>

      {/* SECTION V */}
      <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '45%', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '60px' }}>VÂNZĂTOR</div>
          <div style={{ borderTop: '1px solid #000000', paddingTop: '5px', fontSize: '12px' }}>
            {sellerName}<br />
            Prin reprezentant legal
          </div>
        </div>
        <div style={{ width: '45%', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '60px' }}>CUMPĂRĂTOR</div>
          <div style={{ borderTop: '1px solid #000000', paddingTop: '5px', fontSize: '12px' }}>
            {contract.buyerName}<br />
            {contract.buyerType === "COMPANY" ? "Prin reprezentant legal" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};
