import { formatEur } from "@/lib/format";

interface AttributeValue {
  id: string;
  attributeId?: string;
  stringValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  attribute?: {
    name: string;
    type: string;
    attributeGroup?: {
      name: string;
    } | null;
  } | null;
}

interface ListingSpecsDesktopProps {
  attributeValues?: AttributeValue[];
}

interface FormattedAttr {
  name: string;
  groupName: string;
  value: string;
  isNumeric: boolean;
}

const SPEC_GROUPS_ORDER = ["Identificare", "Motor", "Comercial", "Altele"] as const;

const SPEC_GROUP_MAP: Record<string, string> = {
  // Identificare: Marca, Model, An, Kilometraj, Caroserie, Culoare
  "marca": "Identificare",
  "model": "Identificare",
  "an": "Identificare",
  "kilometraj": "Identificare",
  "caroserie": "Identificare",
  "culoare": "Identificare",

  // Motor: Capacitate cilindrică, Putere (CP), Combustibil, Cutie de viteze, Tractiune, Norma de poluare
  "capacitate cilindrică": "Motor",
  "capacitate cilindrica": "Motor",
  "putere (cp)": "Motor",
  "combustibil": "Motor",
  "cutie de viteze": "Motor",
  "tractiune": "Motor",
  "tracțiune": "Motor",
  "norma de poluare": "Motor",

  // Comercial: Pret, TVA deductibil
  "pret": "Comercial",
  "preț": "Comercial",
  "tva deductibil": "Comercial",
};

const SPEC_ORDER_IN_GROUP: Record<string, number> = {
  "marca": 1,
  "model": 2,
  "an": 3,
  "kilometraj": 4,
  "caroserie": 5,
  "culoare": 6,

  "capacitate cilindrică": 1,
  "capacitate cilindrica": 1,
  "putere (cp)": 2,
  "combustibil": 3,
  "cutie de viteze": 4,
  "tractiune": 5,
  "tracțiune": 5,
  "norma de poluare": 6,

  "pret": 1,
  "preț": 1,
  "tva deductibil": 2,
};

export default function ListingSpecsDesktop({ attributeValues = [] }: ListingSpecsDesktopProps) {
  if (!attributeValues || attributeValues.length === 0) return null;

  const features: { name: string; groupName: string }[] = [];
  const specs: FormattedAttr[] = [];

  attributeValues.forEach((av) => {
    if (!av.attribute) return;

    if (av.attributeId === "attr:colorDetail") {
      const colorVal = attributeValues.find((x) => x.attributeId === "attr:color")?.stringValue;
      if (
        colorVal !== undefined &&
        colorVal !== null &&
        av.stringValue !== undefined &&
        av.stringValue !== null &&
        av.stringValue.trim().toLowerCase() === colorVal.trim().toLowerCase()
      ) {
        return;
      }
    }

    const name = av.attribute.name;
    const groupName = av.attribute.attributeGroup?.name || "Altele";

    // FEATURES: booleanValue === true
    if (av.booleanValue === true) {
      features.push({ name, groupName });
      return;
    }

    // SPECS: stringValue, numberValue, or booleanValue === false
    let displayValue = "";
    let isNumeric = false;

    if (av.stringValue !== null && av.stringValue !== undefined && av.stringValue !== "") {
      displayValue = av.stringValue;
    } else if (av.numberValue !== null && av.numberValue !== undefined) {
      isNumeric = true;
      if (av.attributeId === "attr:year") {
        displayValue = String(av.numberValue);
      } else if (av.attributeId === "attr:price") {
        displayValue = formatEur(av.numberValue);
      } else if (av.attributeId === "attr:mileage") {
        displayValue = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(av.numberValue) + " km";
      } else if (av.attributeId === "attr:engineCapacity") {
        displayValue = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(av.numberValue) + " cm³";
      } else {
        displayValue = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(av.numberValue);
      }
    } else if (av.booleanValue !== null && av.booleanValue !== undefined) {
      // booleanValue === false
      displayValue = "Nu";
    } else {
      return; // Skip if all null
    }

    specs.push({
      name,
      groupName,
      value: displayValue,
      isNumeric,
    });
  });

  if (specs.length === 0 && features.length === 0) return null;

  // Group specs into Identificare, Motor, Comercial, Altele
  const groupedSpecs: Record<string, FormattedAttr[]> = {
    Identificare: [],
    Motor: [],
    Comercial: [],
    Altele: [],
  };

  specs.forEach((s) => {
    const matchedGroup = SPEC_GROUP_MAP[s.name.trim().toLowerCase()] || "Altele";
    groupedSpecs[matchedGroup].push(s);
  });

  // Sort specs within groups
  Object.keys(groupedSpecs).forEach((g) => {
    groupedSpecs[g].sort((a, b) => {
      const orderA = SPEC_ORDER_IN_GROUP[a.name.trim().toLowerCase()] ?? 99;
      const orderB = SPEC_ORDER_IN_GROUP[b.name.trim().toLowerCase()] ?? 99;
      return orderA - orderB;
    });
  });

  // Group features by their existing API attribute group names
  const featureGroups: Record<string, typeof features> = {};
  features.forEach((f) => {
    if (!featureGroups[f.groupName]) {
      featureGroups[f.groupName] = [];
    }
    featureGroups[f.groupName].push(f);
  });

  return (
    <div className="w-full select-none">
      <h2 className="text-[17px] font-semibold mt-1 mb-2.5 px-0.5 text-foreground">
        Specificații
      </h2>
      <div className="bg-card border border-border rounded-lg p-5 space-y-6">
        {/* SPECS: 2 columns at lg */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {SPEC_GROUPS_ORDER.map((groupName) => {
            const attrs = groupedSpecs[groupName];
            if (!attrs || attrs.length === 0) return null;

            return (
              <div key={groupName} className="space-y-1.5">
                <h3 className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {groupName}
                </h3>
                <div className="space-y-0">
                  {attrs.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-t border-border first:border-t-0 text-[13px]"
                    >
                      <span className="text-muted-foreground">{attr.name}</span>
                      <span
                        className={`font-medium text-foreground ${
                          attr.isNumeric ? "tabular-nums" : ""
                        }`}
                      >
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FEATURES: Dotări block */}
        {features.length > 0 && (
          <div className="pt-5 border-t border-border space-y-4">
            <h3 className="text-[13px] font-semibold text-foreground">Dotări</h3>
            <div className="space-y-4">
              {Object.entries(featureGroups).map(([groupName, items]) => (
                <div key={groupName} className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {groupName}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[13px] bg-muted text-foreground rounded px-2 py-0.5"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
