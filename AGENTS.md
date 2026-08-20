# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product decisions

- Public identity is `Elin` only. Never expose the user's real name in UI copy, metadata, assets, or comments.
- This is a long-lived personal website, not a resume site. It should support articles, short notes, projects, friend links, personal interests, and a personal Agent.
- The selected visual direction is the dark `Elin OS` personal-knowledge interface shown in `reference/elin-os-home.png`.
- The homepage keeps the Agent as the primary interaction and shows a substantial `精选作品` section with Vue Form Craft, 小筑, and Niuma Code.
- In `精选作品`, the first project is the only full-width featured item and should be visually larger; remaining projects use larger two-column cards on desktop and a single column on mobile. Do not add an adjacent content module solely to narrow the works layout.
