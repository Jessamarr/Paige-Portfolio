# Paige Thompson Portfolio

Hand-coded portfolio site for Paige Thompson, rebuilt from her Canva site. Plain HTML, CSS and JavaScript. No framework and no build step, so it deploys to Netlify as-is.

## What changed from the Canva version

| | Canva site | This site |
|---|---|---|
| First load | 6.4 MB, 88 requests (62 scripts) | 0.8 MB, 14 requests (1 script) |
| Full scroll | 24.7 MB, 125 requests | 4.3 MB, 46 requests |
| Mobile | Scaled-down desktop slides | Layout built for phones |
| Text | Partly baked into images | Real HTML text, so search engines and screen readers can read it |
| Project boards | Small, can't be read | Tap any image to open it full screen, zoom and pan |
| Navigation | None | Sticky menu, active section, progress bar |

Measured in headless Chrome at 1440 x 900.

### Motion

The Canva site fades each block in as it scrolls into view. This version keeps that idea and adds:

- The name rises in letter by letter.
- The hero line drawing draws itself from the ground up, with a scan line tracing the edge, and drifts with the cursor and scroll.
- Headings reveal through a mask, and images wipe up as you reach them.
- Each project's lead render starts as a framed image and expands to full screen as you scroll.
- The experience timeline fills in as you read down it.
- The parking lot stats count up.
- Photos scroll past in an endless strip under About.
- The project list shows a preview image that follows the cursor.

All motion turns off when a visitor's device asks for reduced motion. The page also works with JavaScript turned off.

### Content edits to review

- Fixed typos: "Cross Seciton" to "Cross Section", and a stray period in the parking lot description.
- Share The Road bullets now use past tense, since the role ended October 2026.
- Removed the two references' phone numbers. Publishing someone else's number on a public site without their consent is a risk. The contact section now says "References available on request".
- New short copy, for Paige to approve: the hero line, the experience intro, the About facts list, the project tags (Year 1 to 4, location), image captions and the contact line.

## Project structure

```
public/                 Everything Netlify serves
  index.html            The whole site
  404.html              Not-found page
  _headers              Security and cache headers (Netlify reads this)
  og-image.jpg          Link preview image for LinkedIn, iMessage, etc.
  assets/css/styles.css
  assets/js/main.js
  assets/fonts/         Archivo and Manrope (SIL Open Font License)
  assets/img/           Optimized WebP images
scripts/
  optimize-images.mjs   Turns full-size originals into WebP files
netlify.toml            Tells Netlify to publish the public folder
```

## Deploy to Netlify

### Option A: connect the GitHub repo (recommended)

1. Log in to Netlify and choose **Add new site**, then **Import an existing project**.
2. Pick GitHub and select this repository.
3. Netlify reads `netlify.toml`. Leave the build command empty. The publish directory is `public`.
4. Click **Deploy**. Every push to `main` redeploys the site.

### Option B: drag and drop

1. Go to https://app.netlify.com/drop.
2. Drag the `public` folder (not the whole project) onto the page.

### After the first deploy

- Rename the site under **Site configuration**, or add a custom domain under **Domain management**.
- Once the final URL is set, make the link preview image absolute in `public/index.html`. Change `content="/og-image.jpg"` to `content="https://YOUR-DOMAIN/og-image.jpg"`. Some apps (Facebook, LinkedIn) ignore relative image paths.

## Edit content

All text lives in `public/index.html`, grouped by section with comments (`About`, `Experience`, `Project 01`, etc.). Edit the text between the tags and redeploy.

To swap an image:

1. Put the full-size original in `originals/` (this folder is not committed, keep a copy elsewhere).
2. Add or update its line in `scripts/optimize-images.mjs`.
3. Run the commands below, then update the file names in `index.html`.

```bash
npm install
```

```bash
npm run images
```

To rebuild a single image, pass its name: `npm run images -- hero-wireframe`.

## Preview locally

```bash
npm run dev
```

Then open http://localhost:8080.

## Notes

- The inline script in `index.html` is allowed by a hash in the Content Security Policy in `public/_headers`. If you change that one line of script, update the hash or the site's motion will not start.
- Fonts are self-hosted. No requests go to Google or other third parties, so the site needs no cookie banner.
