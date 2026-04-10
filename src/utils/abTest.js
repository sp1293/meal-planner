/**
 * Lightweight A/B testing utility.
 * - Assigns a variant once per test and persists it in localStorage.
 * - Logs impressions and clicks to the console (swap in analytics later).
 *
 * Usage:
 *   const variant = getVariant("hero-cta");   // "A" | "B"
 *   logImpression("hero-cta", variant);
 *   logClick("hero-cta", variant);
 *
 * To add a new test, just call getVariant with a new test name.
 * Weights are optional — defaults to 50/50.
 */

const VARIANTS = ["A", "B"];
const STORAGE_KEY_PREFIX = "ab_";

/**
 * Returns the assigned variant for a test, creating one if needed.
 * @param {string} testName - Unique identifier for the test.
 * @param {number[]} weights - Relative weights for each variant, e.g. [70, 30].
 * @returns {"A"|"B"} The assigned variant.
 */
export function getVariant(testName, weights = [50, 50]) {
  const key = STORAGE_KEY_PREFIX + testName;
  const stored = localStorage.getItem(key);
  if (stored && VARIANTS.includes(stored)) return stored;

  const total = weights.reduce((s, w) => s + w, 0);
  let rand = Math.random() * total;
  let assigned = VARIANTS[VARIANTS.length - 1]; // fallback to last
  for (let i = 0; i < VARIANTS.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { assigned = VARIANTS[i]; break; }
  }

  localStorage.setItem(key, assigned);
  return assigned;
}

/**
 * Log when a variant is shown to the user.
 * Replace console.log with your analytics call (e.g. analytics.track).
 */
export function logImpression(testName, variant) {
  console.log(`[A/B] impression | test="${testName}" variant="${variant}"`);
}

/**
 * Log when the user interacts with the tested element.
 * Replace console.log with your analytics call.
 */
export function logClick(testName, variant) {
  console.log(`[A/B] click | test="${testName}" variant="${variant}"`);
}
