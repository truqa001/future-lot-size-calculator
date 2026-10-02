"use strict";

const els = {
  product: document.getElementById("product"),
  risk: document.getElementById("risk"),
  ticks: document.getElementById("ticks"),
  commission: document.getElementById("commission"),
  contracts: document.getElementById("contracts"),
  detail: document.getElementById("detail"),
  warning: document.getElementById("warning"),
  error: document.getElementById("error"),
};

const STORAGE_KEY = "futures-risk-calculator:v1";

const ERROR_MESSAGES = {
  INVALID_PRODUCT: "Select a product.",
  INVALID_RISK: "Risk amount must be a number greater than 0.",
  INVALID_TICKS: "Ticks must be a whole number greater than 0.",
  INVALID_COMMISSION: "Commission must be 0 or more.",
};

function populateProducts() {
  for (const [id, product] of Object.entries(PRODUCTS)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${id} - ${product.name} ($${product.tickValue.toFixed(2)}/tick)`;
    els.product.appendChild(option);
  }
}

function fmt(amount) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function saveInputs() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        product: els.product.value,
        risk: els.risk.value,
        ticks: els.ticks.value,
        commission: els.commission.value,
      }),
    );
  } catch (_) {
    // Storage can be unavailable in private modes or locked-down browsers.
  }
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (saved.product && PRODUCTS[saved.product]) els.product.value = saved.product;
    if (typeof saved.risk === "string") els.risk.value = saved.risk;
    if (typeof saved.ticks === "string") els.ticks.value = saved.ticks;
    if (typeof saved.commission === "string") els.commission.value = saved.commission;
  } catch (_) {
    // Ignore corrupt saved state and start fresh.
  }
}

function clearMessages() {
  els.warning.style.display = "none";
  els.error.style.display = "none";
}

function showBlankResult() {
  els.contracts.textContent = "-";
  els.detail.textContent = "";
}

function render() {
  if (els.risk.value === "" || els.ticks.value === "") {
    showBlankResult();
    clearMessages();
    return;
  }

  const result = calculate({
    productId: els.product.value,
    riskAmount: Number(els.risk.value),
    stopTicks: Number(els.ticks.value),
    commissionPerContract: els.commission.value === "" ? 0 : Number(els.commission.value),
  });

  if (result.error) {
    showBlankResult();
    els.warning.style.display = "none";
    els.error.textContent = ERROR_MESSAGES[result.error];
    els.error.style.display = "block";
    return;
  }

  els.error.style.display = "none";
  els.contracts.textContent = String(result.contracts);
  els.detail.textContent = `${fmt(result.riskPerContract)} risk per contract | ${fmt(result.actualRisk)} total risk`;

  if (result.warning === "RISK_EXCEEDED") {
    els.warning.textContent =
      `Your risk budget (${fmt(result.intendedRisk)}) is below 1 contract. ` +
      `Taking this trade risks ${fmt(result.actualRisk)}, ` +
      `${fmt(result.actualRisk - result.intendedRisk)} more than intended.`;
    els.warning.style.display = "block";
  } else {
    els.warning.style.display = "none";
  }
}

populateProducts();
loadInputs();

[els.product, els.risk, els.ticks, els.commission].forEach((el) => {
  el.addEventListener("input", () => {
    saveInputs();
    render();
  });
});

render();
