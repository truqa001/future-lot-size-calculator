const test = require("node:test");
const assert = require("node:assert/strict");
const { PRODUCTS, calculate } = require("./calculator.js");

test("PRODUCTS contains all six instruments with correct tick values", () => {
  assert.equal(PRODUCTS.NQ.tickValue, 5.0);
  assert.equal(PRODUCTS.MNQ.tickValue, 0.5);
  assert.equal(PRODUCTS.ES.tickValue, 12.5);
  assert.equal(PRODUCTS.MES.tickValue, 1.25);
  assert.equal(PRODUCTS.GC.tickValue, 10.0);
  assert.equal(PRODUCTS.MGC.tickValue, 1.0);
  assert.equal(Object.keys(PRODUCTS).length, 6);
});

test("NQ: $500 risk, 20 ticks, $4.16 commission -> 4 contracts", () => {
  const r = calculate({ productId: "NQ", riskAmount: 500, stopTicks: 20, commissionPerContract: 4.16 });

  assert.equal(r.riskPerContract, 104.16);
  assert.equal(r.contracts, 4);
  assert.equal(r.actualRisk, 416.64);
  assert.equal(r.warning, null);
});

test("MNQ: $100 risk, 40 ticks, $1.04 commission -> 4 contracts", () => {
  const r = calculate({ productId: "MNQ", riskAmount: 100, stopTicks: 40, commissionPerContract: 1.04 });

  assert.equal(r.riskPerContract, 21.04);
  assert.equal(r.contracts, 4);
  assert.equal(r.actualRisk, 84.16);
});

test("exact division: ES $250 risk, 10 ticks, no commission -> exactly 2 contracts", () => {
  const r = calculate({ productId: "ES", riskAmount: 250, stopTicks: 10, commissionPerContract: 0 });

  assert.equal(r.riskPerContract, 125);
  assert.equal(r.contracts, 2);
  assert.equal(r.actualRisk, 250);
});

test("commission defaults to 0 when omitted", () => {
  const r = calculate({ productId: "GC", riskAmount: 1000, stopTicks: 30 });

  assert.equal(r.riskPerContract, 300);
  assert.equal(r.contracts, 3);
});

test("risk too small for one contract -> 1 contract with RISK_EXCEEDED warning", () => {
  const r = calculate({ productId: "NQ", riskAmount: 50, stopTicks: 20, commissionPerContract: 0 });

  assert.equal(r.contracts, 1);
  assert.equal(r.actualRisk, 100);
  assert.equal(r.intendedRisk, 50);
  assert.equal(r.warning, "RISK_EXCEEDED");
});

test("invalid inputs return an error code instead of a result", () => {
  assert.equal(calculate({ productId: "XX", riskAmount: 100, stopTicks: 10 }).error, "INVALID_PRODUCT");
  assert.equal(calculate({ productId: "NQ", riskAmount: 0, stopTicks: 10 }).error, "INVALID_RISK");
  assert.equal(calculate({ productId: "NQ", riskAmount: -5, stopTicks: 10 }).error, "INVALID_RISK");
  assert.equal(calculate({ productId: "NQ", riskAmount: NaN, stopTicks: 10 }).error, "INVALID_RISK");
  assert.equal(calculate({ productId: "NQ", riskAmount: 100, stopTicks: 0 }).error, "INVALID_TICKS");
  assert.equal(calculate({ productId: "NQ", riskAmount: 100, stopTicks: 2.5 }).error, "INVALID_TICKS");
  assert.equal(
    calculate({ productId: "NQ", riskAmount: 100, stopTicks: 10, commissionPerContract: -1 }).error,
    "INVALID_COMMISSION",
  );
});

test("valid result has no error property", () => {
  const r = calculate({ productId: "NQ", riskAmount: 500, stopTicks: 20 });

  assert.equal(r.error, undefined);
});

test("QA matrix matches expected contract counts and total risk", () => {
  const cases = [
    ["NQ", 500, 20, 4.16, 4, 416.64],
    ["MNQ", 100, 40, 1.04, 4, 84.16],
    ["ES", 250, 10, 0, 2, 250],
    ["MES", 200, 16, 1.04, 9, 189.36],
    ["GC", 1000, 30, 0, 3, 900],
    ["MGC", 75, 25, 0, 3, 75],
    ["NQ", 50, 20, 0, 1, 100],
  ];

  for (const [productId, riskAmount, stopTicks, commissionPerContract, contracts, actualRisk] of cases) {
    const r = calculate({ productId, riskAmount, stopTicks, commissionPerContract });

    assert.equal(r.contracts, contracts);
    assert.equal(r.actualRisk, actualRisk);
  }
});
