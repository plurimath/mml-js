// Smoke test for @plurimath/mml: load the build artifacts, then parse
// and serialize one MathML document.
const path = require("path");
const fs = require("fs");

const variant = process.env.VARIANT || "self-contained";
const distDir = path.join(__dirname, "..", "dist");

function resolveOrExit(spec) {
  try {
    return require.resolve(spec);
  } catch (e) {
    console.error(`external variant requires ${spec}`);
    process.exit(1);
  }
}

const files =
  variant === "external"
    ? [
        resolveOrExit("@lutaml/opal-runtime"),
        // The package's "require" export is its no-opal build.
        resolveOrExit("@lutaml/lutaml-model"),
        path.join(distDir, "mml-no-opal.js"),
      ]
    : [path.join(distDir, "mml.js")];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`missing artifact: ${f}`);
    process.exit(1);
  }
}
for (const f of files) require(f);

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

const input =
  '<math xmlns="http://www.w3.org/1998/Math/MathML">' +
  "<mfrac><mi>x</mi><mn>2</mn></mfrac></math>";
let output;
try {
  output = Opal.Mml.$parse(input).$to_xml();
} catch (e) {
  console.error(`parse/serialize failed: ${e.message}`);
  process.exit(1);
}
for (const needle of ["<mfrac>", "<mi>x</mi>", "<mn>2</mn>"]) {
  if (!output.includes(needle)) {
    console.error(`round trip lost ${needle}:\n${output}`);
    process.exit(1);
  }
}
console.log("✓ Mml.parse(...).to_xml round-trips an <mfrac>");

console.log(`\n${variant} variant: verified`);
process.exit(0);
