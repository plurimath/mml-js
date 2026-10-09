#!/usr/bin/env ruby
# frozen_string_literal: true

# Build script for @plurimath/mml. Runs Opal::Builder against
# plurimath/mml's lib/mml/opal.rb to produce both flavors.
#
# Invoked from scripts/build.js via `bundle exec ruby`.

require "opal"
require "opal/builder"
require "fileutils"

# Requires that resolve outside this bundle:
# - lutaml-model, moxml, oga: compiled by @lutaml/lutaml-model, which is
#   loaded before this bundle (embedded in the self-contained flavor).
# - ox, nokogiri: server-only XML adapters. moxml picks oga under Opal.
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

PROVIDER_STUB =
  /Opal\.modules\["(?:lutaml|moxml|oga)(?:\/[^"]*)?"\]\s*=\s*Opal\.return_val\(Opal\.nil\)/

ENTRY = "mml/opal"

def build_app_code(ruby_dir, dist_dir)
  builder = Opal::Builder.new
  builder.append_paths(File.join(ruby_dir, "lib"))
  builder.stubs = UPSTREAM_STUBS.dup
  builder.prerequired = %w[opal]
  builder.compiler_options = { source_map: false }

  # A stub compiles to `Opal.modules[name] = Opal.return_val(Opal.nil)`,
  # which would replace the real module @lutaml/lutaml-model already
  # defined. Drop the stub definitions for modules that package provides.
  output = builder.build(ENTRY).to_s.gsub(/#{PROVIDER_STUB.source};?/, "")
  path = File.join(dist_dir, "mml-no-opal.js")
  FileUtils.mkdir_p(dist_dir)
  File.write(path, output)
  warn "wrote #{path} (#{output.bytesize / 1024} KiB)"
  output
end

def read_dist_file(pkg_root, pkg, files)
  files.each do |f|
    p = File.join(pkg_root, "node_modules", *pkg.split("/"), "dist", f)
    next unless File.exist?(p)

    js = File.read(p)
    warn "read #{pkg} from #{p} (#{js.bytesize / 1024} KiB)"
    return js
  end
  abort "Could not locate #{pkg}/dist/#{files.first}; run npm install first"
end

def build_self_contained(runtime, lutaml_model, app_code, ref, dist_dir)
  header = <<~HEADER
    // @plurimath/mml — self-contained build (Opal runtime and lutaml-model embedded)
    // Generated from plurimath/mml #{ref}
    //
  HEADER
  combined = "#{header}#{runtime}\n#{lutaml_model}\n#{app_code}"
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
ref = ENV.fetch("RUBY_REF")

FileUtils.mkdir_p(dist_dir)

app_code = build_app_code(ruby_dir, dist_dir)
runtime = read_dist_file(runtime_root, "@lutaml/opal-runtime", %w[runtime.js runtime.cjs])
# The no-opal build, so the bundle carries exactly one Opal runtime.
lutaml_model = read_dist_file(runtime_root, "@lutaml/lutaml-model", %w[lutaml-model-no-opal.js])
build_self_contained(runtime, lutaml_model, app_code, ref, dist_dir)
write_types(dist_dir)
