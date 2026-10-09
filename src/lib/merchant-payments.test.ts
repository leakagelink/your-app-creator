import { describe, expect, test } from "bun:test";
import { emptyMerchantDetails, hasMerchantPayment } from "./merchant-payments";

describe("admin-controlled merchant payment destinations", () => {
  test("no saved destination disables deposits", () => {
    expect(hasMerchantPayment(emptyMerchantDetails)).toBe(false);
  });
  test("saved bank alone enables deposits", () => {
    expect(hasMerchantPayment({ ...emptyMerchantDetails, account: "123456789012" })).toBe(true);
  });
  test("saved UPI alone enables deposits", () => {
    expect(hasMerchantPayment({ ...emptyMerchantDetails, id: "merchant@upi" })).toBe(true);
  });
  test("saved QR alone enables deposits", () => {
    expect(hasMerchantPayment({ ...emptyMerchantDetails, qrPath: "admin/qr.png" })).toBe(true);
  });
});