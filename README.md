# Menus

Interactive restaurant menus where guests can order **at the table (dine in)**, **for pickup**, or **for delivery**.
Plain HTML/CSS/JS, no build step, so it can be hosted anywhere (GitHub Pages, Netlify, any static host).

| Restaurant | Folder | Status |
|---|---|---|
| Brick & Bun (smash burgers) | [`burger/`](burger/) | ✅ |
| Mattarello (fresh pasta bar) | [`italian/`](italian/) | ✅ |

## Run it

```sh
python3 -m http.server 8000
# open http://localhost:8000/burger/
```

## What guests can do

- Choose **Dine in / Pickup / Delivery** (switchable any time from the header or the cart).
- **QR codes per table**: link to `burger/?table=12` (or `burger/#table-12`). The menu opens in dine-in mode for that table.
- Search the menu and filter by **Vegetarian / Spicy / Gluten-free**.
- Customize each dish: required choices (cooking temperature, heat level, flavor), paid extras, "hold the pickles", meal upgrades, kitchen notes.
- Cart with quantity steppers, edit items, "goes well with" suggestions, promo codes (`SMASH10`, `FIRSTBITE`), tip, tax, delivery fee, delivery minimum and free-delivery threshold.
- Checkout adapted to each mode (table number / name and phone / delivery address and time slot) and payment choice.
- Order ticket with live status (Sent to kitchen → On the grill → …).
- Dine-in extras: **Call a server** and **Ask for the bill**, plus several rounds of orders per visit.
- The cart, chosen mode and contact details are remembered on the guest's device.

## Mattarello extras

- **Build your bowl**: a 4-step builder (shape → sauce → toppings → finish, plus portion size) with a live plate that fills as you choose:
  the sauce changes color, pasta pieces pop in, toppings drop onto the plate, cheese snows on top. It also flags chef's classic matches,
  shows vegetarian / gluten-free / spicy as you go, and has a "Surprise me" button.
- Sommelier pairings: each pasta suggests a wine you can add by the glass in one tap.
- Coperto (cover charge per guest) for dine-in, and course timing ("antipasti first, then pasta").
- Motion throughout: the hero plate draws itself, cards rise in as you scroll, dishes fly into the cart. All motion is turned off for
  people who set "reduce motion" on their device.

## Structure

```
shared/menu.js    the engine: rendering, cart, checkout, order flow (shared by every restaurant)
shared/menu.css   layout and components, styled through theme tokens
burger/data.js    Brick & Bun: dishes, prices, options, fees, promo codes
burger/index.html Brick & Bun: theme (colors, fonts) + loads the engine
italian/          Mattarello: data.js, style.css (theme), hero.js (plate illustration), builder.js (Build your bowl)
```

To add a restaurant, copy `burger/`, change the colors and fonts in `index.html`, and rewrite `data.js`.

## Receiving real orders

By default orders are simulated (demo mode). Set `orderEndpoint` in `data.js` to a URL that accepts a `POST` with the order as JSON
(mode, table, customer, lines with options, totals). If the response contains `{ "number": "…" }` it is shown to the guest.
Online payment is a placeholder: connect a provider such as Stripe or Square before taking real payments.
