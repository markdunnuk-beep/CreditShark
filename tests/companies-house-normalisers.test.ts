import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateCompanyAgeMonths,
  countCharges,
  normaliseCharge,
  normaliseCompanyIdentity,
  normaliseCompanySnapshot,
  normaliseOfficer,
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

  it("counts active and satisfied charges", () => {
    const charges = [
      normaliseCharge({ charge_number: 1, status: "outstanding" }),
      normaliseCharge({ charge_number: 2, status: "fully-satisfied" })
    ];

    assert.deepEqual(countCharges(charges), { active: 1, satisfied: 1 });
  });
});

