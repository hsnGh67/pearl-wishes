export interface CountryCode {
  id: string;
  code: string;
  country: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { id: "uk-44", code: "+44", country: "United Kingdom" },
  { id: "us-1", code: "+1", country: "United States" },
  { id: "fr-33", code: "+33", country: "France" },
  { id: "de-49", code: "+49", country: "Germany" },
  { id: "it-39", code: "+39", country: "Italy" },
  { id: "es-34", code: "+34", country: "Spain" },
  { id: "pt-351", code: "+351", country: "Portugal" },
  { id: "nl-31", code: "+31", country: "Netherlands" },
  { id: "be-32", code: "+32", country: "Belgium" },
  { id: "ch-41", code: "+41", country: "Switzerland" },
  { id: "ie-353", code: "+353", country: "Ireland" },
];

export const DEFAULT_COUNTRY_CODE_ID = "uk-44";

export function toE164(
  countryCodeId: string,
  phoneNumber: string,
): string {
  const country =
    COUNTRY_CODES.find((item) => item.id === countryCodeId) ??
    COUNTRY_CODES.find(
      (item) => item.id === DEFAULT_COUNTRY_CODE_ID,
    );
  const dialCode = country?.code ?? "+44";
  const digits = phoneNumber.replace(/\D/g, "");
  return `${dialCode}${digits}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, "");
}

export function parsePhoneParts(phone?: string | null): {
  countryCodeId: string;
  phoneNumber: string;
} {
  if (!phone) {
    return {
      countryCodeId: DEFAULT_COUNTRY_CODE_ID,
      phoneNumber: "",
    };
  }

  const normalized = normalizePhone(phone);
  const digits = normalized.replace(/\D/g, "");
  const withPlus = normalized.startsWith("+")
    ? normalized
    : `+${digits}`;

  const matched = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => withPlus.startsWith(item.code));

  if (!matched) {
    return {
      countryCodeId: DEFAULT_COUNTRY_CODE_ID,
      phoneNumber: digits,
    };
  }

  return {
    countryCodeId: matched.id,
    phoneNumber: withPlus.slice(matched.code.length),
  };
}