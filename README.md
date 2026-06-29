# @plurimath/mml

JavaScript release of [plurimath/mml](https://github.com/plurimath/mml),
Opal-compiled and published as `@plurimath/mml` on npm.

## Install

\`\`\`sh
npm install @plurimath/mml
\`\`\`

## Flavors

| Entry | File | Use case |
|---|---|---|
| \`mml\` (default) | \`dist/mml.js\` | **Self-contained** — Opal runtime embedded. CDN-friendly. |
| \`mml-no-opal\` | \`dist/mml-no-opal.js\` | **External** — references \`@lutaml/opal-runtime\` global. For bundler users who share runtime. |

## Shared runtime

\`@lutaml/opal-runtime\` is declared as an optional peer dep. Install
it to share the Opal instance across multiple Opal-compiled packages
(\`@unitsml/unitsml\`, \`@plurimath/mml\`, etc.):

\`\`\`sh
npm install @plurimath/mml @lutaml/opal-runtime
\`\`\`

## Source

Built from [plurimath/mml](https://github.com/plurimath/mml) by its
release workflow. The Ruby gem remains the single source of truth.
