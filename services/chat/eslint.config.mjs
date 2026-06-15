import base from "../../eslint.base.config.mjs";

export default [...base, { ignores: ["dist/**", "src/system-prompt.ts"] }];
