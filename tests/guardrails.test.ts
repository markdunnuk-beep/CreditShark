import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../src/lib/guardrails.js";

describe("CreditShark guardrail copy", () => {
  it("states the core product boundaries", () => {
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /UK limited companies only/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /not a consumer credit reporting product/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /not an FCA-regulated credit rating/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /lending workflow/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /credit broker/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /debt adviser/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /debt collection/);
    assert.match(CREDITSHARK_PRODUCT_GUARDRAIL, /source-linked/);
  });
});

