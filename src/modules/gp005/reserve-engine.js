export function analyzeReserve(input) {
  const reservationAmount = Number(input.reservation.amount) || 0;
  const reserveBalance = Number(input.reserveFund.balance) || 0;
  const reserveRequested = Number(input.reserveFund.requestedAmount) || 0;
  return { reservation: { amount: reservationAmount, supported: input.reservation.approved === true && reservationAmount <= input.allocated - input.spent }, reserveFund: { balance: reserveBalance, requested: reserveRequested, sufficient: reserveBalance >= reserveRequested, authorized: reserveRequested === 0 || input.reserveFund.approved === true } };
}
