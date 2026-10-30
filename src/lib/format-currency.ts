const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(amount: number) {
  return usdFormatter.format(amount);
}
