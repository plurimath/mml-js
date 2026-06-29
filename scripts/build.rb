#!/usr/bin/env ruby
# frozen_string_literal: true

# Build script for @plurimath/mml. Runs Opal::Builder against
# plurimath/mml's lib/mml/opal.rb to produce both flavors.
#
# Invoked from scripts/build.js via `bundle exec ruby`.

require "opal"
require "opal/builder"
require "fileutils"

# Deps of mml that cannot be Opal-compiled directly:
# - lutaml-model: Opal runtime unverified upstream (continue-on-error
#   in their opal.yml). Stub for now; remove when @lutaml/lutaml-model
#   ships as npm peer.
# - ox, nokogiri: server-only XML adapters. moxml picks oga under Opal.
# - moxml: has its own Opal boot file; loaded separately as prerequired
#   when @lutaml/moxml ships.
UPSTREAM_STUBS = %w[
  lutaml/model
  lutaml/model/xml
  lutaml/model/json
  lutaml/model/yaml
  lutaml/model/key_value
  lutaml/model/toml
  lutaml/model/type
  lutaml/model/serialize
  ox
  nokogiri
  oga
  moxml
  moxml/compat/opal/moxml_boot
].freeze

ENTRY = "mml/opal"

def build_app_code(ruby_dir, dist_dir)
  builder = Opal::Builder.new
  builder.append_paths(File.join(ruby_dir, "lib"))
  builder.stubs = UPSTREAM_STUBS.dup
  builder.prerequired = %w[opal]
  builder.compiler_options = { source_map: false }

  output = builder.build(ENTRY).to_s
  path = File.join(dist_dir, "mml-no-opal.js")
  FileUtils.mkdir_p(dist_dir)
  File.write(path, output)
  warn "wrote #{path} (#{output.bytesize / 1024} KiB)"
  output
end

def read_runtime(runtime_pkg_root)
  candidates = [
    File.join(runtime_pkg_root, "node_modules", "@lutaml", "opal-runtime", "dist", "runtime.js"),
    File.join(runtime_pkg_root, "node_modules", "@lutaml", "opal-runtime", "dist", "runtime.cjs"),
  ]
  candidates.each do |p|
    next unless File.exist?(p)

    runtime = File.read(p)
    warn "read runtime from #{p} (#{runtime.bytesize / 1024} KiB)"
    return runtime
  end
  warn "Could not locate @lutaml/opal-runtime/dist/runtime.js. " \
       "Self-contained flavor will be empty."
  ""
end

def build_self_contained(app_code, runtime, version, dist_dir)
  header = <<~HEADER
    // @plurimath/mml — self-contained build (Opal runtime embedded)
    // Generated from plurimath/mml v#{version}
    // Opal runtime: @lutaml/opal-runtime
    //
  HEADER
  combined = "#{header}#{runtime}\n#{app_code}"
  path = File.join(dist_dir, "mml.js")
  File.write(path, combined)
  warn "wrote #{path} (#{combined.bytesize / 1024} KiB)"
end

def write_types(dist_dir)
  dts = <<~TS
    declare const Mml: any;
    export = Mml;
    export default Mml;
  TS
  path = File.join(dist_dir, "index.d.ts")
  File.write(path, dts)
  warn "wrote #{path}"
end

ruby_dir = ENV.fetch("RUBY_DIR")
dist_dir = ENV.fetch("DIST_DIR")
runtime_root = ENV.fetch("RUNTIME_PKG_ROOT")
version = ENV.fetch("VERSION")

FileUtils.mkdir_p(dist_dir)

app_code = build_app_code(ruby_dir, dist_dir)
runtime = read_runtime(runtime_root)
build_self_contained(app_code, runtime, version, dist_dir)
write_types(dist_dir)