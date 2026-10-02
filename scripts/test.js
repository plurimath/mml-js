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

// Load order: Opal runtime, then lutaml-model, then mml.
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
// mml's own code must not redefine a module @lutaml/lutaml-model provides.
// mml.js embeds that package, which has stubs of its own, so check the
// mml code: mml-no-opal.js, which mml.js ends with.
const PROVIDER_STUB =
  /Opal\.modules\["(?:lutaml|moxml|oga)(?:\/[^"]*)?"\]\s*=\s*Opal\.return_val\(Opal\.nil\)/;
const mmlCode = fs.readFileSync(path.join(distDir, "mml-no-opal.js"), "utf8");
const leftover = mmlCode.match(PROVIDER_STUB);
if (leftover) {
  console.error(`provider stub left in mml-no-opal.js: ${leftover[0]}`);
  process.exit(1);
}
if (
  variant !== "external" &&
  !fs.readFileSync(path.join(distDir, "mml.js"), "utf8").endsWith(mmlCode)
) {
  console.error("mml.js does not end with the mml-no-opal.js code");
  process.exit(1);
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

const lutamlModel = Opal.modules["lutaml/model"];
// A stub would be a closure returning nil, without the module body.
if (typeof lutamlModel !== "function" || !lutamlModel.toString().includes("Lutaml")) {
  console.error("lutaml/model is not the module from @lutaml/lutaml-model");
  process.exit(1);
}
console.log("✓ lutaml/model is the @lutaml/lutaml-model module");

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

try {
  const math = Opal.Mml.V3.Math.$from_xml(input);
  if (!math.$to_xml().includes("<mfrac>")) throw new Error("no <mfrac> in output");
} catch (e) {
  console.error(`Mml::V3::Math.from_xml failed: ${e.message}`);
  process.exit(1);
}
console.log("✓ Mml::V3::Math.from_xml parses an <mfrac>");

console.log(`\n${variant} variant: verified`);
process.exit(0);
