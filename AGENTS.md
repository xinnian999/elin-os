# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Cloudflare Worker deployment is configured only through `wrangler.jsonc`; run `npm run build` before publishing so `dist/client/index.html` and static assets are current.

## Release workflow

- Production releases use exactly one path: push the intended commit to GitHub's `main` branch, create a `v*` tag on that commit, and push the tag. The tag-triggered GitHub Action promotes that exact commit to the `release` branch; the connected Cloudflare Workers Builds integration builds and deploys only `release`.
- A normal push to `main` must not deploy production. Do not push or modify the `release` branch manually.
- Do not use OpenAI Sites or add Sites-specific files, scripts, tests, or hosting configuration.
- Do not run `wrangler deploy` from a local machine for normal releases. Wrangler is only for local validation or Cloudflare configuration work when explicitly requested.
- After pushing a release tag, verify the GitHub Action, the remote `release` commit, the Cloudflare build, and the public site's new assets before reporting the release complete.

## Product decisions

- Public identity is `Elin` only. Never expose the user's real name in UI copy, metadata, assets, or comments.
- This is a focused Chinese single-page portfolio: personal introduction first, then the project wall. Do not add routes or unrelated sections.
- The selected visual direction is a continuous dynamic aurora-and-mountain panorama with translucent deep-blue project surfaces.
- In `精选作品`, Vue Form Craft is the only full-width featured item and the only item that shows a GitHub star count; 小筑 and yl-code use equal secondary cards.
- Project cards open an in-page detail dialog rather than navigating to project detail routes.
- Use real product screenshots, preview links, and GitHub repositories. Vue Form Craft links to `form.elin521.cn/form-design`; 小筑 links to `xiaozhu.elin521.cn`; yl-code has no online-preview CTA and instead explains how to install the npm package inside its detail dialog.
