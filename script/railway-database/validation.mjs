const CANONICAL_LINE_CODE = /^\d{6}$/;
const MILESTONE_LABEL = /^(\d+)\+(\d{3})$/;

export function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireCanonicalLineCode(value, context) {
  if (typeof value !== "string" || !CANONICAL_LINE_CODE.test(value)) {
    throw new Error(`${context} must contain exactly six digits`);
  }

  return value;
}

export function requireNonEmptyString(value, context) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }

  return value;
}

export function requirePositiveInteger(value, context) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${context} must be a positive integer`);
  }

  return value;
}

export function requireCoordinate(value, minimum, maximum, context) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${context} is outside its geographic range`);
  }

  return value;
}

export function milestonePositionMeters(label, context) {
  const match = MILESTONE_LABEL.exec(label);
  if (match === null) {
    throw new Error(`${context} must use the kilometre+metric format`);
  }

  return Number(match[1]) * 1000 + Number(match[2]);
}

export function canonicalLineCode(value, context) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 999_999
  ) {
    throw new Error(`${context} must be an integer between 0 and 999999`);
  }

  return String(value).padStart(6, "0");
}
