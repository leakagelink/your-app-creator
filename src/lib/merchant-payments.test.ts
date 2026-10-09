import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { emptyMerchantDetails, hasMerchantPayment } from "./merchant-payments";

describe("admin-controlled merchant payment destinations", () => {
  test("no saved destination disables deposits", () => {
    assert.equal(hasMerchantPayment(emptyMerchantDetails), false);
  });
  test("saved bank alone enables deposits", () => {
    assert.equal(hasMerchantPayment({ ...emptyMerchantDetails, account: "123456789012" }), true);
  });
  test("saved UPI alone enables deposits", () => {
    assert.equal(hasMerchantPayment({ ...emptyMerchantDetails, id: "merchant@upi" }), true);
  });
  test("saved QR alone enables deposits", () => {
    assert.equal(hasMerchantPayment({ ...emptyMerchantDetails, qrPath: "admin/qr.png" }), true);
  });
});