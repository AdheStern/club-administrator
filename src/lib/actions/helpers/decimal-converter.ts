// src/lib/actions/helpers/decimal-converter.ts

export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDecimalsToNumbers(item)) as T;
  }

  const converted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && "toNumber" in value) {
      converted[key] = (value as any).toNumber();
    } else if (value && typeof value === "object") {
      converted[key] = convertDecimalsToNumbers(value);
    } else {
      converted[key] = value;
    }
  }

  return converted as T;
}
