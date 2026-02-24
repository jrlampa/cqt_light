import security from "eslint-plugin-security";
import js from "@eslint/js";
import globals from "globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default [
    js.configs.recommended,
    security.configs.recommended,
    {
        files: ["**/*.js", "**/*.jsx"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                vi: true,
                describe: true,
                it: true,
                expect: true,
                beforeEach: true
            }
        },
        rules: {
            "security/detect-object-injection": "off",
            "security/detect-non-literal-require": "warn",
            "security/detect-non-literal-fs-filename": "warn",
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-console": "off"
        }
    }
];
