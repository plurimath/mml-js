# @plurimath/mml

JavaScript release of [plurimath/mml](https://github.com/plurimath/mml),
Opal-compiled and published as `@plurimath/mml` on npm.

## Install

```sh
npm install @plurimath/mml
```

## Flavors

| Entry | File | Use case |
|---|---|---|
| `browser` export | `dist/mml.js` | **Self-contained** — Opal runtime and `@lutaml/lutaml-model` embedded. CDN-friendly. |
| `import`, `require`, `default` exports | `dist/mml-no-opal.js` | **External** — load `@lutaml/opal-runtime`, then `@lutaml/lutaml-model`, then this file. For bundler users who share runtime. |

## Shared runtime

`@lutaml/opal-runtime` is declared as an optional peer dep. Install
it to share the Opal instance across multiple Opal-compiled packages
(`@unitsml/unitsml`, `@plurimath/mml`, etc.):

```sh
npm install @plurimath/mml @lutaml/opal-runtime
```

## Dependencies

- `@lutaml/lutaml-model` `^0.2.0` is a required peer. 0.2.0 is not
  published yet; it must be published before this package can be
  installed or released.
- The build needs `lib/mml/opal.rb` from plurimath/mml, which no mml
  release has yet. `scripts/build.js` builds `MML_REF` by default and
  stops with an error when that ref lacks the file. Until mml publishes
  it, build with `RUBY_REF` (and `RUBY_REPO`) pointing at a ref that has
  it, and run a release with the `ruby_ref` input set to such a ref.

## Source

Built from [plurimath/mml](https://github.com/plurimath/mml) by its
release workflow. The Ruby gem remains the single source of truth.
