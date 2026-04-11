/**
 * GA4 analytics helpers for Mitabhukta.
 *
 * All functions are safe to call before the gtag script loads — they queue
 * silently if window.gtag is not yet defined. In non-production environments
 * (CI, localhost) events are logged to the console instead of being sent.
 */

const MEASUREMENT_ID = "G-D7FLC58DP3";
const IS_PROD = process.env.NODE_ENV === "production";

function gtag(...args) {
  if (IS_PROD && typeof window.gtag === "function") {
    window.gtag(...args);
  } else if (!IS_PROD) {
    console.debug("[Analytics]", ...args);
  }
}

/**
 * Call on every page change. Maps internal page keys to human-readable titles.
 * @param {string} pageName  - internal page key e.g. "dashboard", "planner"
 */
export function trackPageView(pageName) {
  const titles = {
    landing:        "Landing",
    login:          "Login",
    signup:         "Sign Up",
    dashboard:      "Dashboard",
    planner:        "Meal Planner",
    "my-plans":     "My Plans",
    trainers:       "Trainers",
    "my-bookings":  "My Bookings",
    calories:       "Calorie Tracker",
    goals:          "Goal Tracker",
    "leftover-chef":"Leftover Chef",
    referral:       "Refer & Earn",
    account:        "Account",
    subscription:   "Subscription",
    guidelines:     "Guidelines",
    privacy:        "Privacy Policy",
    terms:          "Terms of Service",
    admin:          "Admin Panel",
    "trainer-portal":"Trainer Portal",
  };
  gtag("event", "page_view", {
    page_title:    titles[pageName] ?? pageName,
    page_location: `https://mitabhukta.com/${pageName === "landing" ? "" : pageName}`,
  });
}

/**
 * Generic event tracker. Maps to GA4's recommended event schema.
 * @param {string} category - event category, e.g. "engagement"
 * @param {string} action   - event action, e.g. "click"
 * @param {string} [label]  - optional label for additional context
 */
export function trackEvent(category, action, label) {
  gtag("event", action, {
    event_category: category,
    ...(label ? { event_label: label } : {}),
  });
}

/**
 * Track a completed signup. Call after the user is successfully created.
 * @param {"email"|"google"} method
 */
export function trackSignup(method) {
  gtag("event", "sign_up", { method });
}

/**
 * Track a completed AI meal plan generation.
 */
export function trackMealPlanGenerated() {
  gtag("event", "meal_plan_generated", { event_category: "engagement" });
}

/**
 * Track a trainer session booking.
 */
export function trackTrainerBooked() {
  gtag("event", "trainer_booked", { event_category: "conversion" });
}

/**
 * Track a manual calorie entry.
 */
export function trackCalorieLogged() {
  gtag("event", "calorie_logged", { event_category: "engagement" });
}
