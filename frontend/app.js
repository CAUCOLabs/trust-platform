const API_BASE = "http://localhost:8080";

const phoneInput = document.getElementById("phoneInput");
const lookupBtn = document.getElementById("lookupBtn");
const reportSpamBtn = document.getElementById("reportSpamBtn");
const statusEl = document.getElementById("status");
const cardEl = document.getElementById("card");

const companyNameEl = document.getElementById("companyName");
const riskLevelEl = document.getElementById("riskLevel");
const phoneNumberEl = document.getElementById("phoneNumber");
const labelEl = document.getElementById("label");
const verifiedEl = document.getElementById("verified");
const trustScoreEl = document.getElementById("trustScore");
const spamReportsEl = document.getElementById("spamReports");
const lookupCountEl = document.getElementById("lookupCount");
const reasonTitleEl = document.getElementById("reasonTitle");
const reasonDescriptionEl = document.getElementById("reasonDescription");
const priorityEl = document.getElementById("priority");
const recommendationEl = document.getElementById("recommendation");

let currentPhoneNumber = "";

function setStatus(message) {
  statusEl.textContent = message;
}

function setBadge(level) {
  riskLevelEl.textContent = level || "unknown";
  riskLevelEl.className = "badge";
  if (level) {
    riskLevelEl.classList.add(level);
  }
}

function renderCard(data) {
  cardEl.classList.remove("hidden");

  companyNameEl.textContent = data.company_name || "Unknown caller";
  setBadge(data.risk_level);

  phoneNumberEl.textContent = data.phone_number || "-";
  labelEl.textContent = data.label || "-";
  verifiedEl.textContent = data.verified ? "Yes" : "No";
  trustScoreEl.textContent = String(data.trust_score ?? "-");
  spamReportsEl.textContent = String(data.spam_reports ?? "-");
  lookupCountEl.textContent = String(data.lookup_count ?? "-");
  reasonTitleEl.textContent = data.reason_title || "-";
  reasonDescriptionEl.textContent = data.reason_description || "-";
  priorityEl.textContent = data.priority || "-";
  recommendationEl.textContent = data.recommendation || "-";
}

async function lookupPhone() {
  const phoneNumber = phoneInput.value.trim();
  if (!phoneNumber) {
    setStatus("Please enter a phone number.");
    return;
  }

  currentPhoneNumber = phoneNumber;
  setStatus("Looking up number...");
  cardEl.classList.add("hidden");

  try {
    const url = new URL(`${API_BASE}/call-card`);
    url.searchParams.set("phone_number", phoneNumber);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Lookup failed");
    }

    const data = await response.json();
    renderCard(data);
    setStatus(data.found ? "Lookup completed." : "Number not found.");
  } catch (error) {
    setStatus("Could not fetch call card.");
    console.error(error);
  }
}

async function reportSpam() {
  if (!currentPhoneNumber) {
    setStatus("Lookup a phone number first.");
    return;
  }

  setStatus("Reporting spam...");

  try {
    const response = await fetch(`${API_BASE}/report-spam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone_number: currentPhoneNumber }),
    });

    if (!response.ok) {
      throw new Error("Spam report failed");
    }

    setStatus("Spam report submitted.");
    await lookupPhone();
  } catch (error) {
    setStatus("Could not report spam.");
    console.error(error);
  }
}

lookupBtn.addEventListener("click", lookupPhone);
reportSpamBtn.addEventListener("click", reportSpam);