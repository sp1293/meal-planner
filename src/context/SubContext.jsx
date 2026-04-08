import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import { TIERS } from "../config";

const SubContext = createContext(null);

export function SubProvider({ children }) {
  const { tier } = useAuth();
  const plan = TIERS[tier] || TIERS.free;

  function canGenerate(plansUsed) {
    if (plan.plansPerMonth >= 999) return true;
    return plansUsed < plan.plansPerMonth;
  }

  function hasFeature(feature) {
    return !!plan[feature];
  }

  return (
    <SubContext.Provider value={{ plan, tier, canGenerate, hasFeature }}>
      {children}
    </SubContext.Provider>
  );
}

export const useSub = () => useContext(SubContext);
