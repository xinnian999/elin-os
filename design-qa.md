# Desktop Pager Design QA

> Historical QA snapshot for commit `85e69d6`. It records the pager refactor evidence available at that point and is not a current release acceptance report.

## Evidence

- Source visual truth: `design-qa-assets/reference-xukai-page-1.png`
- Source secondary state: `design-qa-assets/reference-xukai-page-2.png`
- Implementation first page: `design-qa-assets/implementation-elin-page-1-1280.png`
- Implementation works page: `design-qa-assets/implementation-elin-works-1280.png`
- Implementation mobile: `design-qa-assets/implementation-elin-mobile-390.png`
- Combined comparison: `design-qa-assets/comparison-reference-vs-elin-page-1.jpg`
- Desktop viewport: 1280 × 768 CSS px, device scale factor 1
- Narrow desktop viewport: 1024 × 768 CSS px, device scale factor 1
- Mobile viewport: 390 × 844 CSS px, device scale factor 1
- Source and desktop implementation captures: 1280 × 768 px; no density normalization required
- State: right-side page 1 for the primary comparison; pages 2 and 3, project modal, and mobile stacked layout checked separately

## Full-view comparison

The combined comparison confirms the intended structural match: a fixed full-screen background, a stable identity region on the left, a bounded card workspace on the right, a compact footer, and a centered page indicator below the workspace. Elin's existing dark glass tokens, content, background system, and card components are intentionally preserved instead of visually cloning the reference site's brand.

## Fidelity surfaces

- Fonts and typography: Existing HarmonyOS Sans and JetBrains Mono hierarchy remains consistent and readable. The reference's display logo type is intentionally not copied because Elin's identity and card typography are retained.
- Spacing and layout rhythm: Desktop body height equals the viewport with no document scroll. Both columns remain inside one frame; the left identity stack is top-aligned, the right workspace has three equal-height pages, and the footer is reduced to one compact line.
- Colors and visual tokens: Existing theme colors, glass opacity, borders, and glow are preserved. Page dots reuse `--theme-primary` and `--theme-glow`.
- Image quality and assets: Existing real background and project screenshots are used without placeholders or recreated artwork. Project crops remain sharp at 1280 and 1024 widths.
- Copy and content: Existing profile, widgets, project data, edit entry, and attribution are preserved. Pagination is represented by three accessible, equal-width bars without a visible number label.

## Focused interaction evidence

- A horizontal trackpad gesture on the right workspace moved page 1 → 2 without changing document scroll position; vertical mouse-wheel input remains a desktop fallback.
- Wheel gestures are captured by the geometric bounds of the entire right workspace, so cards and nested scroll containers do not create dead zones; full-screen dialogs remain excluded.
- On the productivity page, a top-row widget retains 9 px of visible buffer after its 3 px hover lift; its `0 8px 24px` glow renders without a clipped horizontal edge and adjacent pages remain hidden.
- Repeated-swipe logic now keeps the cursor coordinate out of the gesture state. A new swipe is detected either after wheel silence or when its delta magnitude rises again after the previous gesture has entered decay; direction reversal is also recognized without waiting for momentum to end.
- Touch handling compares both axes and only treats a dominant left/right swipe as a page turn.
- Arrow keys moved between pages; inactive pages receive both `aria-hidden` and `inert`.
- Page-dot buttons changed the active page.
- Vue Form Craft opened in the existing detail dialog and the close control worked.
- At 1280 × 768, document scroll height was exactly 768 px.
- At 1024 × 768, document width and scroll width were both 1024 px and the works wall fit in the fixed frame.
- At 390 × 844, the pager was hidden, content returned to natural vertical flow, and scroll width stayed below the viewport width.
- Background rotation was sampled across 60 consecutive frames around an automatic switch: 0 blank frames and 5 observable crossfade frames, with both 1920 px image layers fully loaded and decoded during the transition.

## Comparison history

1. P2: the original footer consumed too much height and compressed error-state content in the weather card. Fixed by changing desktop footer content to a compact horizontal row; the revised first-page capture shows all six cards inside the frame.
2. P2: the final odd project left an empty half-row on the works page. Fixed by allowing the final odd secondary project to span both grid columns; the revised works capture closes the wall cleanly.
3. P2: the page indicator's lower-right placement and numeric counter did not match the requested desktop interaction. Fixed by centering three equal-width bars below the workspace and removing the visible number.
4. P2: a long trackpad gesture could outlive the initial wheel lock and skip from page 1 to page 3. Fixed with a 680 ms transition lock plus explicit inertial-tail, renewed-burst, direction-reversal, and boundary acknowledgement handling; one gesture now advances at most one page while a deliberate follow-up gesture can still be queued.
5. P2: pages translated vertically and touch input used vertical distance. Fixed by changing the track to a horizontal flex strip, translating on the X axis, and accepting dominant horizontal trackpad and touch gestures.
6. P2: the left identity stack was vertically centered after the desktop pagination refactor. Fixed by restoring top alignment while retaining the fixed-height desktop frame.
7. P1: changing a single element's `background-image` started the next network request too late and CSS could not interpolate the image value, causing a visible cut or flash. Fixed with decoded-image preloading and two persistent background layers that crossfade only after the next image is ready.
8. P1: relying on bubbling wheel events made pagination feel position-dependent when nested widgets or floating layers owned the event target. Fixed by capturing wheel input at the window level and routing it by the right panel's live geometric bounds, with modal exclusions.
9. P1: macOS inertial wheel events continue for 1–2 seconds, so a silence-only gesture reset blocked an intentional second swipe until momentum fully ended. Fixed by detecting renewed delta bursts and direction reversals after a short guard period, while retaining accumulation and silence reset for normal gestures.
10. P2: the full-page works container inherited the global widget hover lift and shadow. Because the desktop page clips overflow, the lifted top shadow ended at a hard horizontal boundary and visually split the panel from the background. Fixed by keeping the works container stationary and shadow-free while preserving hover feedback on the individual project cards.
11. P2: the first two pages placed small widgets only 2 px from an `overflow: hidden` page boundary, so their 3 px hover lift and glow were clipped into a hard line. Fixed by adding a 12 px internal shadow buffer to the information and productivity pages; the works page keeps its compact 2 px inset because its outer container no longer lifts or casts a shadow.
12. P2: each pager control used the same 24×4 px box as its visible bar, making it unnecessarily difficult to click. Fixed by separating presentation from interaction: each equal-width control now has a 30×24 px hit area with a centered 30×6 px visible bar.
13. P2: the weather card's header margin, 48 px icon, 2.5 rem temperature, and 12 px row gaps exceeded the fixed first-page grid cell at some desktop sizes, pushing humidity and wind into the clipped bottom edge. Fixed by using a compact three-row content grid, a 42 px aligned icon, slightly smaller temperature hierarchy, and 7 px vertical rhythm while preserving the existing visual language.
14. P2: dashboard pages and row counts were manually encoded as a six-card 2×3 page plus a four-card 2×2 page. Fixed by chunking the ordered widget registry into groups of at most six and deriving each page's two-column row count from its actual card count; the works wall remains the dedicated final page.

## Findings

No remaining code-level P0, P1, or P2 findings are known. At 1280 × 768, hovering inside the works page leaves its outer container at `transform: none` with no box shadow, while the hovered project card retains its own border feedback. Native macOS trackpad momentum cannot be reproduced exactly by the automated browser input, so the renewed-burst threshold still requires one final hardware confirmation. The first local Vite view cannot provide Worker-backed weather, visitor, or GitHub data, but their production API behavior was not changed by this layout work.

snapshot result: passed
