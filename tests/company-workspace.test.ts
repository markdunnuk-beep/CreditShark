import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCompanyWorkspaceActiveTab,
  getCompanyWorkspaceTabs
} from "../src/lib/company-workspace/company-workspace-tabs.js";
import {
  formatCompanyWorkspaceMoney,
  formatCompanyWorkspaceValue
} from "../src/lib/company-workspace/company-workspace-service.js";
import { CREDITSHARK_FOOTER_DISCLAIMER } from "../src/lib/guardrails.js";

describe("company workspace tab model", () => {
  it("maps company routes to the intended active tab", () => {
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790"), "summary");
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790/score"), "score");
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790/adverse"), "adverse");
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790/history"), "history");
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790/report"), "reports_decisions");
    assert.equal(getCompanyWorkspaceActiveTab("/companies/00445790/decision"), "reports_decisions");
  });

  it("builds deep-linkable tab hrefs for a company number", () => {
    const tabs = getCompanyWorkspaceTabs("00445790");

    assert.deepEqual(
      tabs.map((tab) => [tab.label, tab.href]),
      [
        ["Summary", "/companies/00445790"],
        ["Score & Reasons", "/companies/00445790/score"],
        ["Adverse Events", "/companies/00445790/adverse"],
        ["Score History", "/companies/00445790/history"],
        ["Reports & Decisions", "/companies/00445790/report"]
      ]
    );
  });

  it("does not expose future tabs as active links yet", () => {
    const labels = getCompanyWorkspaceTabs("00445790").map((tab) => tab.label);

    assert.equal(labels.includes("Financials & Filings"), false);
    assert.equal(labels.includes("People & Control"), false);
  });

  it("formats workspace header values safely", () => {
    assert.equal(formatCompanyWorkspaceMoney(1000, "GBP"), "£1,000");
    assert.equal(formatCompanyWorkspaceMoney(null), "Not recorded");
    assert.equal(formatCompanyWorkspaceValue("very_high"), "very high");
    assert.equal(formatCompanyWorkspaceValue(null), "Not available");
  });

  it("keeps workspace helper output free from repeated full legal copy", () => {
    const encoded = JSON.stringify({
      tabs: getCompanyWorkspaceTabs("00445790"),
      riskBand: formatCompanyWorkspaceValue("moderate"),
      money: formatCompanyWorkspaceMoney(5000, "GBP")
    });

    assert.equal(encoded.includes(CREDITSHARK_FOOTER_DISCLAIMER), false);
  });
});
