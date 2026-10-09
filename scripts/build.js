// Build script for @plurimath/mml.
//
// Clones plurimath/mml at RUBY_REF (default: latest RubyGems release), runs
// scripts/build.rb which uses Opal::Builder to compile lib/mml/opal
// into both external and self-contained flavors. lutaml-model is not
// compiled here: it comes from the @lutaml/lutaml-model package.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TMP = path.join(ROOT, ".tmp");

const RUBY_REF = process.env.RUBY_REF || `v${latestGemVersion("mml")}`;
const RUBY_REPO =
  process.env.RUBY_REPO || "https://github.com/plurimath/mml.git";

function run(cmd, args, opts = {}) {
  const line = [cmd, ...args].join(" ");
  console.error(`$ ${line}`);
  try {
    return execFileSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], ...opts });
  } catch (err) {
    console.error(`command failed: ${line}`);
    process.exit(1);
  }
}

function latestGemVersion(name) {
  const url = `https://rubygems.org/api/v1/versions/${name}/latest.json`;
  // --max-time bounds the lookup so a stalled RubyGems fails the build
  // instead of hanging it until the CI job timeout.
  const out = run("curl", ["-fsSL", "--max-time", "60", url], { stdio: ["ignore", "pipe", "inherit"] });
  return JSON.parse(out).version;
}

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function checkoutMmlRuby() {
  rmrf(TMP);
  ensureDir(TMP);
  // git clone --branch only accepts branch/tag names, not SHAs; a SHA
  // is fetched directly instead.
  if (/^[0-9a-f]{40}$/i.test(RUBY_REF)) {
    run("git", ["init", TMP]);
    run("git", ["-C", TMP, "remote", "add", "origin", RUBY_REPO]);
    run("git", ["-C", TMP, "fetch", "--depth", "1", "origin", RUBY_REF]);
    run("git", ["-C", TMP, "checkout", "FETCH_HEAD"]);
  } else {
    run("git", ["clone", "--depth", "1", "--branch", RUBY_REF, "--", RUBY_REPO, TMP]);
  }
  if (!fs.existsSync(path.join(TMP, "lib", "mml", "opal.rb"))) {
    console.error(
      `mml ${RUBY_REF} has no lib/mml/opal.rb (the Opal entry point); ` +
        "set RUBY_REF (and RUBY_REPO) to a ref that has it",
    );
    process.exit(1);
  }
  run("bundle", ["install"], { cwd: TMP });
}

function buildRuby() {
  const env = {
    ...process.env,
    RUBY_DIR: TMP,
    DIST_DIR: DIST,
    RUNTIME_PKG_ROOT: ROOT,
    RUBY_REF,
  };
  run("bundle", ["exec", "ruby", path.join(ROOT, "scripts", "build.rb")], {
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