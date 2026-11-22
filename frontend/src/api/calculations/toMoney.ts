/** Kwota w formacie kontraktu `Money`: dwa miejsca po przecinku, kropka ("4147.10"). */
export function toMoney(amount: number): string {
  return (Math.round((amount || 0) * 100) / 100).toFixed(2);
}
