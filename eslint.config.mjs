import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Convencion del proyecto (doc 00 §5.3): `any` prohibido. Si algo no se
      // puede tipar, se usa `unknown` y se estrecha.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  // Prettier manda en el formato; esto apaga las reglas de estilo de ESLint que
  // chocarian con el. Tiene que ir al final.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // Generado por la CLI de Supabase; se regenera, no se edita ni se lintea.
    "src/tipos/database.types.ts",
  ]),
]);
