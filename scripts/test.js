// Smoke test for @plurimath/mml — verify the build artifacts load.
const path = require("path");
const fs = require("fs");

const variant = process.env.VARIANT || "self-contained";
const distDir = path.join(__dirname, "..", "dist");

let runtimePath;
let appPath;
if (variant === "external") {
  try {
    runtimePath = require.resolve("@lutaml/opal-runtime");
  } catch (e) {
    console.error("external variant requires @lutaml/opal-runtime");
    process.exit(1);
  }
  appPath = path.join(distDir, "mml-no-opal.js");
} else {
  runtimePath = path.join(distDir, "mml.js");
  appPath = null;
}

if (!fs.existsSync(runtimePath)) {
  console.error(`missing artifact: ${runtimePath}`);
  process.exit(1);
}
if (appPath && !fs.existsSync(appPath)) {
  console.error(`missing artifact: ${appPath}`);
  process.exit(1);
}

require(runtimePath);
if (appPath) require(appPath);

const Opal = globalThis.Opal;
if (typeof Opal !== "object" || typeof Opal.require !== "function") {
  console.error("Opal global not initialized");
  process.exit(1);
}
console.log(`✓ runtime exposed Opal global`);

const moduleNames = Object.keys(Opal.modules || {});
const mmlModules = moduleNames.filter((n) => n.startsWith("mml/"));
if (mmlModules.length === 0) {
  console.error("no mml/* modules registered with Opal");
  process.exit(1);
}
console.log(
  `✓ ${mmlModules.length} mml/* modules registered ` +
    `(sample: ${mmlModules.slice(0, 3).join(", ")})`
);

console.log(`\n${variant} variant: structure verified`);
process.exit(0);