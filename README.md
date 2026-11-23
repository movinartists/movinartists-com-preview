# Movin' Artists — new design preview

This is a **preview of the new movinartists.com design**. It is not the live homepage.

Live site: [www.movinartists.com](https://www.movinartists.com)

- Search engines: this preview is served with `noindex, nofollow` and a `robots.txt` that disallows all crawlers.
- Forms on this preview do not send.
- Shop checkout / Buy Now opens the live product page in the full window (`target="_top"`) so it can leave an iframe embed.
- The Events counterpart links to the live `/event-list` page the same way.
- Instagram and [www.movinartistsmarket.com](https://www.movinartistsmarket.com) open in a new tab.
- Log In stays a label here: the live site’s Log In is a Wix members lightbox, not a public URL.

To view locally: serve this folder with any static server (for example `python3 -m http.server`). All asset and page links are relative so they also work under the GitHub Pages `/movinartists-com-preview/` subpath.

To publish as GitHub Pages: repo Settings → Pages → Source: **GitHub Actions** → Save (the deploy workflow is already in `.github/workflows/pages.yml`). The preview URL will be:

https://movinartists.github.io/movinartists-com-preview/

Then paste that URL into `embed-snippet.html` on a hidden, unpublished Wix Studio page of movinartists.com (see `WIX-EDITOR-STEPS.md`). Do not replace the live homepage until you are ready to launch.

This repository is only the static preview host. It does not change the live Wix site.
