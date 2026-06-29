// Build script for @plurimath/mml.
//
// Clones plurimath/mml at the released ref, runs scripts/build.rb
// which uses Opal::Builder to compile lib/mml/opal into both
// external and self-contained flavors.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TMP = path.join(ROOT, ".tmp");

const VERSION = process.env.VERSION || require("../package.json").version;
const RUBY_REF = process.env.RUBY_REF || `v${VERSION}`;
const RUBY_REPO =
  process.env.RUBY_REPO || "https://github.com/plurimath/mml.git";

function run(cmd, opts = {}) {
  console.error(`$ ${cmd}`);
  try {
    return execSync(cmd, { stdio: ["ignore", "inherit", "inherit"], ...opts });
  } catch (err) {
    console.error(`command failed: ${cmd}`);
    process.exit(1);
  }
}

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function checkoutMmlRuby() {
  rmrf(TMP);
  ensureDir(TMP);
  run(`git clone --depth 1 --branch ${RUBY_REF} ${RUBY_REPO} ${TMP}`);
  run("bundle install", { cwd: TMP });
}

function buildRuby() {
  const env = {
    ...process.env,
    RUBY_DIR: TMP,
    DIST_DIR: DIST,
    RUNTIME_PKG_ROOT: ROOT,
    VERSION,
  };
  run(`bundle exec ruby ${path.join(ROOT, "scripts", "build.rb")}`, {
    cwd: TMP,
    env,
  });
}

rmrf(DIST);
ensureDir(DIST);
checkoutMmlRuby();
buildRuby();
rmrf(TMP);
console.error("build complete");