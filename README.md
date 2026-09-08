# ScoreMux website

Static public pages for scoremux.com, scoremux.app, and scoremux.ai.
The animated product page is at `/` on each domain. The former `/app/ai/`
preview path redirects to `/`. Privacy and support keep their existing content.

## Local work

- `npm install`
- `npm run dev` — local preview; open `/`.
- `npm run check` — JavaScript syntax check.
- `npm run build` — validates referenced page assets and copies the static site into `dist/`.

There is no server component and no upload, account, or analytics service.
Fonts and animation libraries are served locally.

## Deployment

The domains are served by the existing Cloudflare Worker `scoremux-placeholder`.
The historical name is retained so deployments replace the existing site.
`wrangler.jsonc` maps all three domain roots to the same static `dist/` build.
The GitHub Pages deployment and old Cloudflare Pages projects are not the live
custom-domain origin.

After signing in with `npx wrangler login`, run `npm run deploy`. The command
checks JavaScript, runs the toy tests, builds the site, and publishes it.
Credentials stay in Wrangler's local login storage and are not part of this repo.
No Worker application code or backend service is needed: Cloudflare serves the
HTML, scripts, fonts, and score images as static assets. `_redirects` sends the
legacy `/app/ai` and `/app/ai/` preview links to `/`.

The previous placeholder version is `87efb50f-307c-4888-90cd-5d0357e77d8c`.
Cloudflare retains Worker versions for rollback.

## Product page

The hero is a Three.js folio with curved pages textured from genuine public-domain
score PDFs. The floating pages and score demonstrations also use real notation.
See `assets/ai/music-credits.txt` for source provenance. Generated book images were
rejected during review and are not included in the site.

The song-finding sequence reveals real Beethoven, Bach, and Mozart pages from
highlighted contents entries into a compact spread, then brings them together
in the same space. Portrait layouts keep the contents above the music. Reduced
motion shows the completed book. Animation direction is not marketing copy.

GSAP controls scroll-linked motion and the recognition, marking, borrowing, and
set-list demonstrations. The metronome demo has nine adjustable subdivision lanes
and optional Web Audio clicks; no audio starts until the visitor clicks Listen.
Each click is scheduled against AudioContext.currentTime with a lookahead queue.
Tempo and mixer changes do not reload media or restart a bar. Tap tempo averages
the last six taps. Rhythm symbols use the bundled Petaluma font.
Motion respects reduced-motion preferences and has an explicit pause control.
If WebGL is unavailable, the hero shows the actual score pages as a static fallback.

## Decisions carried from the copy workshop (2026-09-07)

- Keep the eight submitted beats in their submitted order.
- Sheet music must be real; the book must be a contemporary music folio.
- Do not use the unapproved “Your music, wide awake” slogan.
- Sync copy is limited to iPad and iPhone. Selective sync is a future discussion.
- Early access opens a prefilled request to the site's existing
  `admin@scoremux.com` address. No new alias has been created; Max chooses
  invitations individually.
- Contents/set-list titles are illustrative; the rendered music is credited
  public-domain material. Website demos do not parse or upload visitors' files.
- Public rollout to all three domain roots was authorized on 2026-09-08.
  The earlier `/app/ai/` path was a misunderstanding of domain shorthand.

## Included libraries

- GSAP and ScrollTrigger, license information retained in the distributed scripts;
  https://gsap.com/standard-license/.
- Three.js (MIT), license in `assets/ai/licenses/three.txt`.
- Anton, DM Sans, and Space Mono fonts, licenses in `assets/ai/licenses/`.

## Markup demo source (2026-09-08)

The web demonstration follows the current local app implementation in
`/Users/maxmichael/Documents/scoremux/ScoreMux/Sources/Views/`:
`EditToolbox.swift`, `ReaderView+RadialMenus.swift`, `PencilCaseStrip.swift`, and
`StampToolbox.swift`. It is a guided web demonstration, not an app screenshot.
The primary Pencil / Highlight / Eraser / Stamps / Text / Lines row, compact
layout, Tools entry, tool colors, active-tool instructions, and Color / Width
settings come from those views. Marker and Shape appear under Tools.

The courtesy flat uses the app's bundled Petaluma font and the `accidentalFlat`
SMuFL entry from `Resources/markings/glyph_palette.json`: U+E260, sized at four
staff spaces per em. The font's OFL is included in `assets/ai/licenses/petaluma.txt`.
The first two opening measures are crossed out; on phones the score pans from
those measures to the courtesy accidental and fortissimo cue.

## Interactive browser toys (2026-09-08)

The markup surface accepts pointer input (mouse, touch, or Pencil), mapped back
through the SVG transform so ink stays on the score when zoomed. Pencil, marker,
and highlighter draw strokes; shapes and lines drag into place; text and musical
stamps place on a tap. The eraser removes ink objects only. The real score image
is outside the ink group and cannot be erased. Undo also restores erased marks
and cleared ink; snapshots retain the SVG nodes and their namespace. Replaying
the example preserves visitor-added ink. Changes stay in memory for this page.

`npm test` covers long-run audio-clock scheduling, click samples, tap tempo, path geometry, and
eraser distances. A temporary DOM harness also verified pointer drawing, stamps,
text, shapes, ink-only erase, undo, put-down, and audio start/stop events. These
checks do not substitute for listening on a physical iPad.

Audio uses AudioContext, AudioBufferSourceNode, and GainNode on all supported
browsers. getOutputTimestamp is optional; visual beats fall back to currentTime.
Safari's audioSession playback mode is requested when available. On older iOS
only, a silent media element opens the media route; it contains no clicks and
its loop cannot insert gaps into the metronome. Audio starts only from Listen,
stops when the page is hidden, and uses a fresh context after each stop.
The browser target is current Chrome/Edge, Firefox, Safari, and Android browsers
with Web Audio support. Physical browser/device audio QA remains separate from
the deterministic timing and DOM interaction checks.
