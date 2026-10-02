// Build script for @plurimath/mml.
//
// Clones plurimath/mml at RUBY_REF (default: MML_REF below), runs
// scripts/build.rb which uses Opal::Builder to compile lib/mml/opal
// into both external and self-contained flavors. lutaml-model is not
// compiled here: it comes from the @lutaml/lutaml-model package.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const TMP = path.join(ROOT, ".tmp");

// The plurimath/mml ref built by default. It is pinned rather than
// derived from this package's version because no mml release has
// lib/mml/opal.rb yet; bump MML_REF to the first release that has it.
const MML_REF = "v2.4.2";
const RUBY_REF = process.env.RUBY_REF || MML_REF;
const RUBY_REPO =
  process.env.RUBY_REPO || "https://github.com/plurimath/mml.git";

// Arguments are passed as an array with no shell, so RUBY_REF and
// RUBY_REPO are never parsed as shell syntax.
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

function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function checkoutMmlRuby() {
  rmrf(TMP);
  ensureDir(TMP);
  run("git", ["clone", "--depth", "1", "--branch", RUBY_REF, "--", RUBY_REPO, TMP]);
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