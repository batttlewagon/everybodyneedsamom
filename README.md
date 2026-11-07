# Everyone Needs a Mom: Video Sessions

Live one-on-one video sessions with Shira, plus booking, a mentor sign-in, and her dashboard.
Lives at **meet.everyoneneedsamom.com**. The main WordPress site at everyoneneedsamom.com is untouched.

| Page | Who | What it does |
|---|---|---|
| `index.html` | Clients | Agree to 18+ and the disclaimer, enter the session code, and the 2-way video opens on the page. Booking calendar below. |
| `about.html` | Everyone | About Shira. |
| `terms.html` | Everyone | Session Agreement & Disclaimer. |
| `signin.html` | Shira | Password sign-in, then her dashboard: **Start my video room**, appointments, client code and link. |
| `config.js` | — | Plain settings (name, email, booking link, price text). |
| `secrets.js` | — | **Encrypted** settings: the video room link and client code. Never edit by hand. |

## How it stays private
- The video room link is encrypted (AES-256) with the **client code**. Without the code, the link can't be read from the page.
- Shira's dashboard data is encrypted with **her password**. Wrong password, no dashboard.
- Clients get the code automatically in their booking confirmation (it's part of the meeting link Cal.com sends after they book and pay).
- To change the code or password: sign in → *Change the client code or password (for Rose)* → paste the result into `secrets.js`.
- This stops casual visitors. It's not bank-grade: a short code could be guessed offline by someone determined. Change the code every few months, or right away if it leaks.

## Services (all free tiers)
- **Video:** Daily (dashboard.daily.co). 10,000 participant-minutes a month free. Don't add a card unless you want overage billing.
- **Booking & payment:** Cal.com free plan + Stripe (Payments & Seats → Paid booking).
  - Event location: *Link meeting* → `https://meet.everyoneneedsamom.com/?code=THE-CODE` (keep "show on booking page" off).
  - Add a required booking question: "I am 18 or older and agree to the Session Agreement at meet.everyoneneedsamom.com/terms.html".

## Domain
At the DNS provider for everyoneneedsamom.com, add **one** record. Change nothing else:

| Type | Name | Value |
|---|---|---|
| CNAME | `meet` | `batttlewagon.github.io` |

Then add a file named `CNAME` containing `meet.everyoneneedsamom.com` (or set it in Settings → Pages → Custom domain) and tick **Enforce HTTPS**.
Until then the site works at https://batttlewagon.github.io/everybodyneedsamom/

## Ideas for the main WordPress site
Add a menu item **"Video Session"** → https://meet.everyoneneedsamom.com, and a button on the *Mom On Call* page.
