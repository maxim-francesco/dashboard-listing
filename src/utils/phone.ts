/**
 * Normalize Romanian phone numbers to a clean digits-only format starting with 40.
 */
export const normalizeRoPhone = (raw: string): string => {
  if (!raw) return "";
  
  // 1. Strip everything non-digit
  let d = raw.replace(/\D/g, "");
  
  // 2. Handle leading 00 international prefix: 0040... -> 40...
  if (d.startsWith("0040")) {
    d = d.substring(2);
  }
  
  // 3. Handle double 40 prefix: 4040... -> 40...
  while (d.startsWith("4040") && d.length > 11) {
    d = d.substring(2);
  }
  
  // 4. Handle 400... (country code 40 followed by national trunk 0): 400XXXXXXXXX -> 40XXXXXXXXX
  if (d.startsWith("400") && d.length === 12) {
    d = "40" + d.substring(3);
  }
  
  // 5. Handle national format: 0XXXXXXXXX (10 digits) -> 40XXXXXXXXX
  if (d.startsWith("0") && d.length === 10) {
    d = "40" + d.substring(1);
  }
  
  // 6. Handle local 9-digit format: XXXXXXXXX -> 40XXXXXXXXX
  if (d.length === 9 && (d.startsWith("7") || d.startsWith("2") || d.startsWith("3") || d.startsWith("8"))) {
    d = "40" + d;
  }
  
  return d;
};

/**
 * Generate a WhatsApp click-to-chat link.
 */
export const waLink = (rawPhone: string, text: string): string => {
  const normalized = normalizeRoPhone(rawPhone);
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
};

/**
 * Generate a standard tel href.
 */
export const telLink = (rawPhone: string): string => {
  const normalized = normalizeRoPhone(rawPhone);
  if (!normalized) return "";
  return `tel:+${normalized}`;
};
