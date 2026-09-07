# ScoreMux website

Static public pages. The animated product page is at `/app/ai/`.
The root, privacy, and support pages retain their existing content.

## Local work

- `npm install`
- `npm run dev` — local preview; open `/app/ai/`.
- `npm run check` — JavaScript syntax check.
- `npm run build` — validates referenced page assets and copies the static site into `dist/`.

There is no server component and no upload, account, or analytics service.
Fonts and animation libraries are served locally.

## Product page

The hero is a Three.js folio with curved pages textured from genuine public-domain
score PDFs. The floating pages and score demonstrations also use real notation.
See `assets/ai/music-credits.txt` for source provenance. Generated book images were
rejected during review and are not included in the site.

GSAP controls scroll-linked motion and the recognition, marking, borrowing, and
set-list demonstrations. The metronome demo has nine adjustable subdivision lanes
and optional Web Audio sound; no audio starts until the visitor clicks Listen.
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
- This branch is for review. Creating it does not authorize publishing the site.

## Included libraries

- GSAP and ScrollTrigger, license information retained in the distributed scripts;
  https://gsap.com/standard-license/.
- Three.js (MIT), license in `assets/ai/licenses/three.txt`.
- Anton, DM Sans, and Space Mono fonts, licenses in `assets/ai/licenses/`.
