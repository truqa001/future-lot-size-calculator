"use strict";

const PRODUCTS = {
  NQ: { name: "E-mini NASDAQ-100", tickSize: 0.25, tickValue: 5.0 },
  MNQ: { name: "Micro E-mini NASDAQ-100", tickSize: 0.25, tickValue: 0.5 },
  ES: { name: "E-mini S&P 500", tickSize: 0.25, tickValue: 12.5 },
  MES: { name: "Micro E-mini S&P 500", tickSize: 0.25, tickValue: 1.25 },
  GC: { name: "Gold", tickSize: 0.1, tickValue: 10.0 },
  MGC: { name: "Micro Gold", tickSize: 0.1, tickValue: 1.0 },
};

function toCents(amount) {
  return Math.round(amount * 100) / 100;
}

function calculate({ productId, riskAmount, stopTicks, commissionPerContract = 0 }) {
  const product = PRODUCTS[productId];
  if (!product) return { error: "INVALID_PRODUCT" };

  if (typeof riskAmount !== "number" || !Number.isFinite(riskAmount) || riskAmount <= 0) {
    return { error: "INVALID_RISK" };
  }

  if (!Number.isInteger(stopTicks) || stopTicks <= 0) {
    return { error: "INVALID_TICKS" };
  }

  if (
    typeof commissionPerContract !== "number" ||
    !Number.isFinite(commissionPerContract) ||
    commissionPerContract < 0
  ) {
    return { error: "INVALID_COMMISSION" };
  }

  const riskPerContract = toCents(stopTicks * product.tickValue + commissionPerContract);
  const contracts = Math.floor(riskAmount / riskPerContract + 1e-9);

  let finalContracts = contracts;
  let warning = null;

  if (finalContracts === 0) {
    finalContracts = 1;
    warning = "RISK_EXCEEDED";
  }

  return {
    contracts: finalContracts,
    riskPerContract,
    actualRisk: toCents(finalContracts * riskPerContract),
    intendedRisk: toCents(riskAmount),
    warning,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS, calculate };
}
