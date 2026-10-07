# AP-Website

Personal website for Austin Peterson, Senior Consultant at Deloitte (AI & Data).
It's a static site: plain HTML, CSS and vanilla JavaScript, with no build step.

## Pages

| Path | File | What's on it |
| --- | --- | --- |
| `/` | `index.html` | Hero, by-the-numbers, how I work, industries, trends, interests, contact |
| `/experience/` | `experience/index.html` | Engagement timeline, toolkit, certifications, education |
| `/resume/` | `resume/index.html` | In-page resume viewer, PDF/.docx downloads, copy link, share |

## Structure

```
css/site.css            Signal theme (all styling; tokens at the top of the file)
js/site.js              Node network, terminal typing, count-ups, reveals, copy/share
assets/img/             Headshot, favicon, social preview image (og-image.jpg)
assets/resume/          Public resume (PDF + .docx, phone number removed) and page previews
```

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages)

1. Make the repository public (Settings → General → Danger Zone → Change visibility).
2. Settings → Pages → Source: **Deploy from a branch**, then pick the branch and `/ (root)`.
3. The site will be served at `https://otterson.github.io/AP-Website/`.

If you add a custom domain later, update the `canonical` and `og:` URLs in the `<head>` of each page.

## Updating the resume

1. Replace `assets/resume/Austin_Peterson_Resume.pdf` and `.docx`.
2. Regenerate the page previews (one image per page):
   ```sh
   pdftoppm -r 130 -png assets/resume/Austin_Peterson_Resume.pdf /tmp/pv
   # convert each /tmp/pv-N.png to assets/resume/pages/page-N.webp
   ```
3. Update the page count, alt text and "Resume file dated" line in `resume/index.html`.
