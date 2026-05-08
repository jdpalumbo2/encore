// Sonnet 4.6 token pricing as of build time, per 1M tokens.
// Update if Anthropic changes pricing or we move models.
export const SONNET_INPUT_USD_PER_M = 3;
export const SONNET_OUTPUT_USD_PER_M = 15;

export function computeCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * SONNET_INPUT_USD_PER_M +
    (outputTokens / 1_000_000) * SONNET_OUTPUT_USD_PER_M
  );
}

export function formatUsd(amount: number): string {
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}
