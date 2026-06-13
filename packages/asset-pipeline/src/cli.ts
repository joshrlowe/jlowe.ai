#!/usr/bin/env node
import { PIPELINE_VERSION, run } from "./index.js";

const result = run(process.argv.slice(2));
process.stdout.write(
  `asset-pipeline ${PIPELINE_VERSION} (phase 0: ${result.status})\n`,
);
