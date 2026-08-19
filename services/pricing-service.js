import { packages } from "../data/fixtures.js";
import { settings } from "../config/settings.js";

export function getPackage(packageId) {
  return packages.find((item) => item.id === packageId) || packages[0];
}

export function calculatePrice({
  packageId,
  urgency = false,
  travelMiles = 0,
  tip = 0,
  promoCode = "",
  discount = 0,
  taxRate = settings.pricing.defaultTaxRate,
  editingFee = 0,
  refundAmount = 0,
} = {}) {
  const selectedPackage = getPackage(packageId);
  const baseSessionPrice = selectedPackage.startingPrice;
  const urgencyFee = urgency ? settings.pricing.urgencyFee : 0;
  const travelFee = travelMiles > settings.pricing.includedTravelMiles
    ? Math.ceil((travelMiles - settings.pricing.includedTravelMiles) * settings.pricing.travelFeePerMile)
    : 0;
  const serviceFee = Math.ceil(baseSessionPrice * settings.pricing.serviceFeeRate);
  const paymentProcessingFee = Math.ceil((baseSessionPrice + urgencyFee + travelFee + Number(editingFee || 0)) * settings.pricing.paymentProcessingRate + settings.pricing.paymentProcessingFixed);
  const taxableSubtotal = baseSessionPrice + urgencyFee + travelFee + serviceFee + paymentProcessingFee + Number(editingFee || 0) - Number(discount || 0);
  const tax = Math.max(0, Math.ceil(taxableSubtotal * Number(taxRate || 0)));
  const total = Math.max(0, taxableSubtotal + Number(tip || 0) + tax - Number(refundAmount || 0));
  const platformCommission = Math.ceil(baseSessionPrice * settings.pricing.platformCommissionRate);
  const shootrPayoutAmount = Math.max(0, baseSessionPrice + urgencyFee + travelFee + Number(tip || 0) + Number(editingFee || 0) - platformCommission);

  return {
    package: baseSessionPrice,
    baseSessionPrice,
    durationMinutes: selectedPackage.durationMinutes,
    urgencyFee,
    travelFee,
    serviceFee,
    platformFee: serviceFee,
    paymentProcessingFee,
    tax,
    tip: Number(tip || 0),
    promoCode,
    discount: Number(discount || 0),
    platformCommission,
    shootrPayoutAmount,
    refundAmount: Number(refundAmount || 0),
    total,
  };
}
