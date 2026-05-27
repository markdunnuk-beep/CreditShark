import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateCompanyAgeMonths,
  countCharges,
  normaliseCharge,
  normaliseCompanyIdentity,
  normaliseCompanySnapshot,
  normaliseFiling,
  normaliseOfficer,
  normalisePsc,
  sanitiseCompanyNumber
} from "../src/lib/companies/companies-house-normalisers.js";
import type { CompaniesHouseProfile } from "../src/types/companies-house.js";

const profile: CompaniesHouseProfile = {
  company_number: "00445790",
  company_name: "TESCO PLC",
  company_status: "active",
  company_type: "plc",
  jurisdiction: "england-wales",
  date_of_creation: "1947-11-27",
  registered_office_address: {
    postal_code: "AL7 1GA",
    locality: "Welwyn Garden City"
  },
  accounts: {
    last_accounts: {
      made_up_to: "2025-02-22"
    }
  },
  confirmation_statement: {
    last_made_up_to: "2025-06-01"
  }
};

describe("Companies House normalisers", () => {
  it("validates and sanitises company numbers", () => {
    assert.equal(sanitiseCompanyNumber(" 00445790 "), "00445790");
    assert.equal(sanitiseCompanyNumber("sc-123456"), "SC123456");
    assert.equal(sanitiseCompanyNumber("../bad"), null);
  });

  it("maps profile fields into company identity rows", () => {
    const row = normaliseCompanyIdentity(profile);

    assert.equal(row.company_number, "00445790");
    assert.equal(row.company_name, "TESCO PLC");
    assert.equal(row.company_status, "active");
    assert.equal(row.registered_office_postcode, "AL7 1GA");
    assert.equal(row.incorporated_on, "1947-11-27");
    assert.equal(row.dissolved_on, null);
  });

  it("maps snapshot dates and missing sections conservatively", () => {
    const row = normaliseCompanySnapshot(profile, "2026-05-26T12:00:00.000Z", ["pscs"]);

    assert.equal(row.snapshot_status, "partial");
    assert.equal(row.latest_accounts_date, "2025-02-22");
    assert.equal(row.latest_confirmation_statement_date, "2025-06-01");
    assert.deepEqual(row.missing_sections_json, ["pscs"]);
  });

  it("calculates company age in whole months", () => {
    assert.equal(calculateCompanyAgeMonths("2025-05-27", "2026-05-26T12:00:00.000Z"), 11);
    assert.equal(calculateCompanyAgeMonths("2025-05-26", "2026-05-26T12:00:00.000Z"), 12);
  });

  it("handles missing optional officer fields", () => {
    const officer = normaliseOfficer({ name: "A DIRECTOR" });

    assert.ok(officer);
    assert.equal(officer.officer_name, "A DIRECTOR");
    assert.equal(officer.appointed_on, null);
    assert.equal(officer.date_of_birth_partial, null);
  });

  it("truncates long scalar fields before insert mapping", () => {
    const filing = normaliseFiling({
      type: "AA".repeat(80),
      description: "description ".repeat(150),
      date: "2026-05-27",
      links: { self: `/company/${"1".repeat(1200)}` }
    });

    assert.equal(filing.filing_type?.length, 100);
    assert.equal(filing.description?.length, 1000);
    assert.equal(filing.source_url?.length, 1000);
  });

  it("normalises undefined and empty scalar values to null", () => {
    const charge = normaliseCharge({
      charge_number: undefined,
      status: "",
      persons_entitled: [{ name: undefined }]
    });

    assert.equal(charge.charge_number, null);
    assert.equal(charge.status, null);
    assert.equal(charge.persons_entitled, null);
    assert.ok(Object.entries(charge).every(([key, value]) => key === "raw_json" || value !== undefined));
  });

  it("rejects invalid dates and invalid partial dates", () => {
    const filing = normaliseFiling({ date: "2026-02-31", description_values: { made_up_date: "not-a-date" } });
    const officer = normaliseOfficer({ name: "A DIRECTOR", appointed_on: "2026-13-01", date_of_birth: { month: 13, year: 2026 } });

    assert.equal(filing.filing_date, null);
    assert.equal(filing.made_up_date, null);
    assert.equal(officer?.appointed_on, null);
    assert.equal(officer?.date_of_birth_partial, null);
  });

  it("keeps PSC natures of control as a safe string array", () => {
    const psc = normalisePsc({
      name: "CONTROL PERSON",
      natures_of_control: ["ownership-of-shares-75-to-100-percent", "", "x".repeat(400)]
    });

    assert.deepEqual(psc?.natures_of_control, ["ownership-of-shares-75-to-100-percent", "x".repeat(300)]);
  });

  it("counts active and satisfied charges", () => {
    const charges = [
      normaliseCharge({ charge_number: 1, status: "outstanding" }),
      normaliseCharge({ charge_number: 2, status: "fully-satisfied" })
    ];

    assert.deepEqual(countCharges(charges), { active: 1, satisfied: 1 });
  });
});
