# Everybody Needs a Mom: Video Sessions

Live one-on-one video sessions with Shira: a client page with an 18+ agreement and the video room, a booking request form, an About page, and Shira's password-protected dashboard.

**Live:** https://batttlewagon.github.io/everybodyneedsamom/ (moving to **www.everybodyneedsamom.com**)

| Page | Who | What it does |
|---|---|---|
| `index.html` | Clients | Agree to 18+ and the disclaimer, enter the session code, and the video opens on the page. Booking request form below. |
| `about.html` | Everyone | About Shira, with her photo. |
| `terms.html` | Everyone | Session Agreement & Disclaimer. |
| `signin.html` | Shira | Password sign-in, then her dashboard: video room, booking confirmation message, client code and link. |
| `config.js` | — | Plain settings: name, contact email, optional Cal.com link and price text. |
| `secrets.js` | — | Encrypted settings: the video room link and client code. Never edit by hand. |

## Domain
everybodyneedsamom.com is registered with Cloudflare. DNS records (proxy off, "DNS only"):
- `www` CNAME → `batttlewagon.github.io`
- `@` CNAME → `batttlewagon.github.io`

Then in GitHub: Settings → Pages → Custom domain `www.everybodyneedsamom.com`, and tick **Enforce HTTPS** once it's available.

## Privacy
- The video room link is encrypted (AES-256) with the client code. Shira's dashboard is encrypted with her password.
- To change the code or password: sign in → *Change the client code or password (for Rose)* → paste the result into `secrets.js`.

## Services
- **Video:** Daily (dashboard.daily.co). Needs a payment method on the account before calls start.
- **Booking:** requests arrive by email at `contactEmail` in `config.js`. Optional later: a Cal.com calendar (`calLink`) replaces the form automatically.
