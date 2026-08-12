// src/lib/enums.ts

export const FUEL_TYPES = ["PETROL", "DIESEL", "PETROL_LPG", "LPG", "HYBRID", "PLUGIN_HYBRID", "MILD_HYBRID", "ELECTRIC"] as const;
export type FuelType = typeof FUEL_TYPES[number];

export const GEARBOX_TYPES = ["MANUAL", "AUTOMATIC"] as const;
export type GearboxType = typeof GEARBOX_TYPES[number];

export const DRIVETRAINS = ["FWD", "RWD", "AWD"] as const;
export type DrivetrainType = typeof DRIVETRAINS[number];

export const BODY_TYPES = ["SUV", "SEDAN", "HATCHBACK", "BREAK", "COUPE", "CABRIO", "MONOVOLUM", "VAN", "PICKUP"] as const;
export type BodyType = typeof BODY_TYPES[number];

export const POLLUTION_NORMS = ["NON_EURO", "EURO_1", "EURO_2", "EURO_3", "EURO_4", "EURO_5", "EURO_6", "EURO_6D"] as const;
export type PollutionNormType = typeof POLLUTION_NORMS[number];

export const COLORS = ["BLACK", "GREY", "WHITE", "BLUE", "RED", "BROWN", "SILVER", "ORANGE", "GREEN", "PURPLE", "GOLD", "BEIGE", "YELLOW", "OTHER"] as const;
export type ColorType = typeof COLORS[number];

export const UPHOLSTERIES = ["FABRIC", "VELOUR", "LEATHER", "PARTIAL_LEATHER", "ALCANTARA"] as const;
export type UpholsteryType = typeof UPHOLSTERIES[number];

export const AIR_CONDITIONINGS = ["NONE", "MANUAL", "AUTOMATIC", "DUAL_ZONE", "TRI_ZONE", "QUAD_ZONE"] as const;
export type AirConditioningType = typeof AIR_CONDITIONINGS[number];

export const LISTING_STATUSES = ["INCOMING", "AVAILABLE", "RESERVED", "SOLD"] as const;
export type ListingStatusType = typeof LISTING_STATUSES[number];

// Translation Maps (Enum -> RO Label)
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  PETROL: "Benzină",
  DIESEL: "Diesel",
  PETROL_LPG: "Benzină + GPL",
  LPG: "GPL",
  HYBRID: "Hibrid",
  PLUGIN_HYBRID: "Plug-in Hibrid",
  MILD_HYBRID: "Mild Hibrid",
  ELECTRIC: "Electric",
};

export const GEARBOX_LABELS: Record<GearboxType, string> = {
  MANUAL: "Manuală",
  AUTOMATIC: "Automată",
};

export const DRIVETRAIN_LABELS: Record<DrivetrainType, string> = {
  FWD: "Față (FWD)",
  RWD: "Spate (RWD)",
  AWD: "Integrală (4x4 / AWD)",
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  SUV: "SUV",
  SEDAN: "Berlină (Sedan)",
  HATCHBACK: "Hatchback",
  BREAK: "Break",
  COUPE: "Coupe",
  CABRIO: "Cabriolet",
  MONOVOLUM: "Monovolum",
  VAN: "Van",
  PICKUP: "Pick-up",
};

export const POLLUTION_NORM_LABELS: Record<PollutionNormType, string> = {
  NON_EURO: "Non-Euro",
  EURO_1: "Euro 1",
  EURO_2: "Euro 2",
  EURO_3: "Euro 3",
  EURO_4: "Euro 4",
  EURO_5: "Euro 5",
  EURO_6: "Euro 6",
  EURO_6D: "Euro 6d",
};

export const COLOR_LABELS: Record<ColorType, string> = {
  BLACK: "Negru",
  GREY: "Gri",
  WHITE: "Alb",
  BLUE: "Albastru",
  RED: "Roșu",
  BROWN: "Maro",
  SILVER: "Argintiu",
  ORANGE: "Portocaliu",
  GREEN: "Verde",
  PURPLE: "Violet",
  GOLD: "Auriu",
  BEIGE: "Bej",
  YELLOW: "Galben",
  OTHER: "Alta",
};

export const UPHOLSTERY_LABELS: Record<UpholsteryType, string> = {
  FABRIC: "Textil",
  VELOUR: "Velur",
  LEATHER: "Piele",
  PARTIAL_LEATHER: "Semipiele",
  ALCANTARA: "Alcantara",
};

export const AIR_CONDITIONING_LABELS: Record<AirConditioningType, string> = {
  NONE: "Fără climatizare",
  MANUAL: "Aer condiționat manual",
  AUTOMATIC: "Climatizare automată",
  DUAL_ZONE: "Climatizare 2 zone (Dual-zone)",
  TRI_ZONE: "Climatizare 3 zone",
  QUAD_ZONE: "Climatizare 4 zone",
};

export const STATUS_LABELS: Record<ListingStatusType, string> = {
  INCOMING: "În curând",
  AVAILABLE: "Disponibil",
  RESERVED: "Rezervat",
  SOLD: "Vândut",
};

// Helper for select options lists
export const getOptions = <T extends string>(labels: Record<T, string>, keys: readonly T[]) => {
  return keys.map((key) => ({ value: key, label: labels[key] }));
};

export const ORIGIN_COUNTRIES = ["DE", "FR", "IT", "BE", "NL", "AT", "ES", "CH", "RO", "HU", "PL", "CZ", "SK", "GB", "SE", "US"] as const;
export const ORIGIN_COUNTRY_LABELS: Record<(typeof ORIGIN_COUNTRIES)[number], string> = {
  DE: "Germania",
  FR: "Franța",
  IT: "Italia",
  BE: "Belgia",
  NL: "Olanda",
  AT: "Austria",
  ES: "Spania",
  CH: "Elveția",
  RO: "România",
  HU: "Ungaria",
  PL: "Polonia",
  CZ: "Cehia",
  SK: "Slovacia",
  GB: "Marea Britanie",
  SE: "Suedia",
  US: "SUA",
};

// String normalization helper (accent/diacritic stripping)
export const normalizeString = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

// Helper for reverse mapping strings to enums
export const reverseMapEnum = <T extends string>(
  rawValue: string | null | undefined,
  mapping: Record<T, string[]>,
  defaultValue: T | null = null
): T | null => {
  if (!rawValue) return defaultValue;
  const normVal = normalizeString(rawValue);
  
  for (const [key, patterns] of Object.entries<string[]>(mapping)) {
    const positivePatterns = patterns.filter(p => !p.startsWith("not:"));
    const negativePatterns = patterns.filter(p => p.startsWith("not:"));
    
    let positiveMatched = false;
    for (const pattern of positivePatterns) {
      if (pattern.startsWith("contains:")) {
        const sub = pattern.slice(9);
        if (normVal.includes(sub)) {
          positiveMatched = true;
          break;
        }
      } else if (pattern.startsWith("prefix:")) {
        const pre = pattern.slice(7);
        if (normVal.startsWith(pre)) {
          positiveMatched = true;
          break;
        }
      } else {
        if (normVal === pattern) {
          positiveMatched = true;
          break;
        }
      }
    }
    
    if (positiveMatched) {
      let negativeMatched = false;
      for (const pattern of negativePatterns) {
        const excludeTerm = pattern.slice(4);
        if (excludeTerm.startsWith("contains:")) {
          const sub = excludeTerm.slice(9);
          if (normVal.includes(sub)) {
            negativeMatched = true;
            break;
          }
        } else if (excludeTerm.startsWith("prefix:")) {
          const pre = excludeTerm.slice(7);
          if (normVal.startsWith(pre)) {
            negativeMatched = true;
            break;
          }
        } else {
          if (normVal.startsWith(excludeTerm) || normVal === excludeTerm) {
            negativeMatched = true;
            break;
          }
        }
      }
      
      if (!negativeMatched) {
        return key as T;
      }
    }
  }
  return defaultValue;
};

// Specific maps mirroring ETL for exact lookup
const FUEL_MAPPING: Record<FuelType, string[]> = {
  DIESEL: ["diesel", "motorina", "motorina (diesel)", "d", "diese"],
  PETROL: ["benzina", "benzin"],
  PETROL_LPG: ["benzina + gpl", "benzina+gpl", "benzina + gpl "],
  LPG: ["gpl", "gpl (gaz)"],
  ELECTRIC: ["electrica", "electric"],
  PLUGIN_HYBRID: ["contains:plug"],
  MILD_HYBRID: ["contains:mild"],
  HYBRID: ["contains:hybrid", "contains:hibrid"],
};

const GEARBOX_MAPPING: Record<GearboxType, string[]> = {
  AUTOMATIC: ["contains:autom", "contains:dsg", "cutie automata"],
  MANUAL: ["contains:manu", "manual", "manula"],
};

const DRIVETRAIN_MAPPING: Record<DrivetrainType, string[]> = {
  AWD: ["contains:4x4", "contains:4*4", "contains:integral", "contains:quattro", "contains:4matic", "contains:x drive", "contains:x-drive", "tractiune 4x4"],
  RWD: ["contains:spate"],
  FWD: ["contains:fata", "4x2", "2x4", "f"],
};

const BODY_TYPE_MAPPING: Record<BodyType, string[]> = {
  SUV: ["contains:suv", "contains:crossover", "sub"],
  SEDAN: ["limuzina", "limousine", "berlina", "sedan"],
  HATCHBACK: ["contains:hatchback", "hb", "compacta"],
  BREAK: ["break", "breck", "combi", "kombi"],
  MONOVOLUM: ["contains:monovolum", "multivan"],
  COUPE: ["coupe"],
  CABRIO: ["cabrio"],
  VAN: ["van", "duba"],
  PICKUP: ["contains:pickup", "pick-up", "pick up"],
};

const POLLUTION_NORM_MAPPING: Record<PollutionNormType, string[]> = {
  EURO_6D: ["euro 6d", "6d"],
  EURO_6: ["euro 6", "euro6", "6"],
  EURO_5: ["euro 5", "euro5", "5"],
  EURO_4: ["euro 4", "4"],
  EURO_3: ["euro 3", "3"],
  EURO_2: ["euro 2", "2"],
  EURO_1: ["euro 1", "1"],
  NON_EURO: ["non-euro", "non euro"],
};

const COLOR_MAPPING: Record<ColorType, string[]> = {
  BLACK: ["prefix:negr", "prefix:neagr"],
  GREY: ["prefix:gri"],
  WHITE: ["prefix:alb", "not:albastru"],
  BLUE: ["prefix:albastr"],
  RED: ["prefix:rosu", "prefix:rosi", "prefix:visin", "prefix:grena", "prefix:bordo", "red metalic"],
  BROWN: ["prefix:maro"],
  SILVER: ["prefix:argint"],
  ORANGE: ["prefix:portocal", "orange"],
  GREEN: ["prefix:verde"],
  PURPLE: ["prefix:mov"],
  GOLD: ["prefix:aur"],
  BEIGE: ["prefix:bej", "prefix:crem"],
  YELLOW: ["prefix:galben"],
  OTHER: ["alt", "alta"],
};

const UPHOLSTERY_MAPPING: Record<UpholsteryType, string[]> = {
  ALCANTARA: ["contains:alcantara"],
  PARTIAL_LEATHER: ["piele velur", "mixt", "contains:semipiele", "partiala piele", "partial piele", "tapiterie mixta"],
  LEATHER: ["piele", "tapiterie piele", "interior piele", "scaune piele"],
  VELOUR: ["velur"],
  FABRIC: ["textil", "stofa", "panza", "tapiterie stofa"],
};

const AIR_CONDITIONING_MAPPING: Record<AirConditioningType, string[]> = {
  QUAD_ZONE: ["clima 4 zone", "4 zone", "climatronic 4 zone"],
  TRI_ZONE: ["climatronic 3 zone"],
  DUAL_ZONE: ["contains:dublu", "dublu climatronic", "dubluclimatronic", "climatronic doua zone"],
  AUTOMATIC: ["automata", "automat", "contains:climatronic", "climatronic"],
  MANUAL: ["contains:aer conditionat", "aer conditionat"],
  NONE: ["none", "fara", "fara climatizare"],
};

export const mapFuelType = (val: string | null | undefined) => reverseMapEnum(val, FUEL_MAPPING);
export const mapGearbox = (val: string | null | undefined) => reverseMapEnum(val, GEARBOX_MAPPING);
export const mapDrivetrain = (val: string | null | undefined) => reverseMapEnum(val, DRIVETRAIN_MAPPING);
export const mapBodyType = (val: string | null | undefined) => reverseMapEnum(val, BODY_TYPE_MAPPING);
export const mapPollutionNorm = (val: string | null | undefined) => reverseMapEnum(val, POLLUTION_NORM_MAPPING);
export const mapColor = (val: string | null | undefined) => reverseMapEnum(val, COLOR_MAPPING);
export const mapUpholstery = (val: string | null | undefined) => reverseMapEnum(val, UPHOLSTERY_MAPPING);
export const mapAirConditioning = (val: string | null | undefined) => reverseMapEnum(val, AIR_CONDITIONING_MAPPING);
