import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.node },
        rules: {
            "semi": "off",
            "@/semi": ["error", "always"],
            // "@stylistic/js/semi": ["error", "always"],
            "no-unused-vars": "warn",
            "@typescript-eslint/no-empty-object-type": "off"
        }
    },
    tseslint.configs.recommended,
]);