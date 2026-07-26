import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface ListingSpecsProps {
  attributeValues?: AttributeValue[];
}

export default function ListingSpecs({ attributeValues = [] }: ListingSpecsProps) {
  if (!attributeValues || attributeValues.length === 0) return null;

  // Filter and format attributes
  const formattedAttributes = attributeValues
    .map((av) => {
      if (!av.attribute) return null;

      if (av.attributeId === "attr:colorDetail") {
        const colorVal = attributeValues.find(x => x.attributeId === "attr:color")?.stringValue;
        if (
          colorVal !== undefined &&
          colorVal !== null &&
          av.stringValue !== undefined &&
          av.stringValue !== null &&
          av.stringValue.trim().toLowerCase() === colorVal.trim().toLowerCase()
        ) {
          return null;
        }
      }

      const name = av.attribute.name;
      const groupName = av.attribute.attributeGroup?.name || "Altele";

      let displayValue = "";
      if (av.stringValue !== null && av.stringValue !== undefined && av.stringValue !== "") {
        displayValue = av.stringValue;
      } else if (av.numberValue !== null && av.numberValue !== undefined) {
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
        displayValue = av.booleanValue ? "Da" : "Nu";
      } else {
        return null; // Skip if all null
      }

      return {
        name,
        groupName,
        value: displayValue,
      };
    })
    .filter(Boolean) as { name: string; groupName: string; value: string }[];

  if (formattedAttributes.length === 0) return null;

  // Group by groupName
  const groups: Record<string, typeof formattedAttributes> = {};
  formattedAttributes.forEach((attr) => {
    if (!groups[attr.groupName]) {
      groups[attr.groupName] = [];
    }
    groups[attr.groupName].push(attr);
  });

  return (
    <div className="w-full">
      <h2 className="text-[17px] font-semibold mt-1 mb-2.5 px-0.5 text-foreground">Specificații</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="all-specs" className="border-none">
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline text-[15px] font-medium text-foreground">
              Toate specificațiile
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-4 pt-2">
                {Object.entries(groups).map(([groupName, attrs]) => (
                  <div key={groupName} className="space-y-2">
                    <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                      {groupName}
                    </h3>
                    <div className="space-y-0">
                      {attrs.map((attr, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between py-2 border-t border-border first:border-t-0 text-[14px]"
                        >
                          <span className="text-muted-foreground">{attr.name}</span>
                          <span className="font-medium text-foreground">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
