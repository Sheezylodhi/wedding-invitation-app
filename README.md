# Nimra & Owais — Luxury Wedding Experience v2

This version is designed as a bespoke, cinematic digital wedding experience rather than a standard invitation template.

## UX flow

1. Full-screen atmospheric opening with no names or text-first hero.
2. Premium invitation card / ritual-style open CTA.
3. Animated 3-step prelude questions.
4. Cinematic transition into the main website.
5. Minimal editorial hero with refined typography.
6. Scroll-driven side reveals and alternating motion directions.
7. Countdown, story, gallery, venue, timeline and clean RSVP.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Production notes

- Replace the Unsplash URLs in `src/app/page.tsx` with the real wedding photography.
- Connect the RSVP form `submit()` to your chosen backend/database/email workflow.
- Update `metadataBase` in `src/app/layout.tsx` to the production domain for share previews.
- Put the final Open Graph artwork at `public/opengraph-image.jpg` if it is regenerated.
