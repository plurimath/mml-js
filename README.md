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

- `@lutaml/lutaml-model` `^0.1.1` is a required peer.
- The build needs `lib/mml/opal.rb` from plurimath/mml. `scripts/build.js`
  builds the latest mml release on RubyGems unless `RUBY_REF` (and
  `RUBY_REPO`) names another ref, and stops with an error when the ref
  lacks the file.

## Source

Built from [plurimath/mml](https://github.com/plurimath/mml) by its
release workflow. The Ruby gem remains the single source of truth.
