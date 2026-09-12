import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      /**
       * The portal and admin screens load their data with `useEffect` +
       * `fetch`, which this rule flags because the effect calls a function that
       * eventually setStates. It is the standard pattern for a client-rendered
       * dashboard talking to a separate API origin, and the alternative the
       * rule points to — a framework data layer — is a deliberate later step.
       *
       * Kept as a warning so the count stays visible: when these screens move
       * to TanStack Query (or to Server Components once auth moves to cookies),
       * the warnings should go to zero and this override can be deleted.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
