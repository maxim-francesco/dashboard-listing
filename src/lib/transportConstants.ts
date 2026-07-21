export const TRANSPORT_COUNTRIES = [
  { code: 'DE', label: 'Germania' },
  { code: 'IT', label: 'Italia' },
  { code: 'FR', label: 'Franța' },
  { code: 'BE', label: 'Belgia' },
  { code: 'NL', label: 'Olanda' },
  { code: 'AT', label: 'Austria' },
  { code: 'ES', label: 'Spania' },
  { code: 'RO', label: 'România' }
];

export const TRANSPORT_TYPE_LABELS = {
  PLATFORM_OPEN: 'Platformă deschisă',
  ENCLOSED: 'Camion închis',
  TARP: 'Prelată'
};

export const countryLabel = (code: string): string => 
  TRANSPORT_COUNTRIES.find(c => c.code === code)?.label || code;
