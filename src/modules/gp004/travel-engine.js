export function analyzeTravel(travel = {}) {
  const days = Math.max(0, Number(travel.days) || 0);
  const distanceKm = Math.max(0, Number(travel.distanceKm) || 0);
  const transportCap = travel.mode === "private-vehicle" ? distanceKm * 4 : Number(travel.transportCap) || 0;
  const lodgingCap = days * (Number(travel.lodgingRate) || 0);
  const subsistenceCap = days * (Number(travel.subsistenceRate) || 0);
  return { days, distanceKm, mode: travel.mode ?? "unspecified", transportCap, lodgingCap, subsistenceCap, totalCap: transportCap + lodgingCap + subsistenceCap };
}
