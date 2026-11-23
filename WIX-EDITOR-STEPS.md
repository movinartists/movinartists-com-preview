# Getting the new design onto movinartists.com (hidden / unpublished)

The GitHub half of this technique is already done in this repo. The Wix Studio editor step is separate and is **not published for you**.

## GitHub preview URL

https://github.com/movinartists/movinartists-com-preview

The preview URL, once GitHub Pages is turned on (Settings → Pages → Source: GitHub Actions → Save), will be:

https://movinartists.github.io/movinartists-com-preview/

## Steps in Wix Studio (you do this — nothing is published for you)

1. Open the **Movin' Artists** site (movinartists.com) in the Wix Studio Editor. Do not edit My Site / the Market site / LIVE TO CREATE.
2. Add a **new blank page**. Suggested name: `New Design Preview`. Suggested URL slug: `/new-design-preview` (do not use `/` or replace Home).
3. **Do not set it as the homepage.** Leave Home (`/`) as it is.
4. Hide the page from the site menu / header / footer (page settings → hide from menu).
5. Hide the Wix header on this page only, if the editor allows it, so the iframe can be full-screen.
6. Page SEO settings: set **Hide this page from search engines** / robots `noindex, nofollow` if the checkbox is available.
7. Delete the default blank sections so the page is empty, then add an **HTML iframe / Embed** that is full width and as tall as the viewport (ideally 100vh).
8. Paste the contents of `embed-snippet.html`.
9. **Save a draft. Do not click Publish** if you want this to stay unpublished. A new page only goes live after a site publish. If a later publish makes this URL reachable to anyone who has the link, noindex is already set on the embedded preview.
10. Optional: password-protect the page until you are ready to launch.
11. When you are ready to launch, that is a separate decision: you would still need to replace or restyle the homepage in the editor, point the menu at the new page, and then publish. That has not been done.
