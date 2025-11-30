export const calculateFinalPrice = (
  basePrice: number,
  discountType?: "PERCENTAGE" | "FIXED",
  discountValue?: number
) => {
  if (!discountType || !discountValue) return basePrice;

  if (discountType === "PERCENTAGE") {
    return basePrice - (basePrice * discountValue) / 100;
  }

  if (discountType === "FIXED") {
    return basePrice - discountValue;
  }

  return basePrice;
};
