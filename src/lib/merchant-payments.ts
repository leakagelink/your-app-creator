export type MerchantPaymentDetails = {
  id: string;
  name: string;
  bankName: string;
  holder: string;
  account: string;
  ifsc: string;
  qrPath: string;
};

export const emptyMerchantDetails: MerchantPaymentDetails = {
  id: "", name: "", bankName: "", holder: "", account: "", ifsc: "", qrPath: "",
};

export function hasMerchantPayment(details: MerchantPaymentDetails) {
  return Boolean(details.id || details.qrPath || details.account);
}