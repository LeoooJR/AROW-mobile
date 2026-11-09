import { resolve } from "node:path";
import { checkValidation } from "./validation/check";

const errors = checkValidation(resolve("."));
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Validation layout, flow references, and local-script boundaries passed.",
  );
