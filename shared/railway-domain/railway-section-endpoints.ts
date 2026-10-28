import { isUnsignedInteger } from "../value-validation";
import { isKilometricPosition } from "./kilometric-position";

type UnknownEndpoints = readonly [first: unknown, last: unknown];
type RecordedSectionEndpoints =
  readonly [first: number, last: number] | readonly [first: null, last: null];

function areEndpointsAbsent(endpoints: UnknownEndpoints): boolean {
  const [first, last] = endpoints;
  return first === null && last === null;
}

function areOrderedKilometricPositions(
  endpoints: UnknownEndpoints,
): endpoints is readonly [first: number, last: number] {
  const [first, last] = endpoints;
  return (
    isKilometricPosition(first) && isKilometricPosition(last) && first <= last
  );
}

export function areValidRecordedSectionEndpoints(
  endpoints: UnknownEndpoints,
  milestoneCount: number,
): endpoints is RecordedSectionEndpoints {
  if (!isUnsignedInteger(milestoneCount)) return false;

  if (milestoneCount === 0) return areEndpointsAbsent(endpoints);

  if (!areOrderedKilometricPositions(endpoints)) return false;

  const [first, last] = endpoints;
  if (milestoneCount === 1) return first === last;

  return true;
}
