// Brick & Bun: menu data. Edit this file to change dishes, prices and options.
// Option groups: type 'single' (radio) or 'multi' (checkbox), `required`, `max`,
// and per-choice `price` deltas. `prefix` renders e.g. "No pickles" on the ticket.

const MEAL = {
  id: 'meal', name: 'Make it a meal', type: 'single', required: true,
  choices: [
    { id: 'none', name: 'Just the burger', hidden: true },
    { id: 'fries-soda', name: 'Fries + fountain soda', price: 4.5 },
    { id: 'fries-shake', name: 'Fries + hand-spun shake', price: 6.5 },
  ],
};
const BUN = {
  id: 'bun', name: 'Bun', type: 'single', required: true,
  choices: [
    { id: 'potato', name: 'Martin’s potato roll', hidden: true },
    { id: 'brioche', name: 'Toasted brioche' },
    { id: 'gf', name: 'Gluten-free bun', price: 1.5 },
    { id: 'lettuce', name: 'Lettuce wrap (no bun)' },
  ],
};
const PATTIES = {
  id: 'patties', name: 'Patties', type: 'single', required: true,
  choices: [
    { id: 'single', name: 'Single (3.5 oz)', price: -2.5 },
    { id: 'double', name: 'Double (7 oz)', default: true, hidden: true },
    { id: 'triple', name: 'Triple (10.5 oz)', price: 3 },
  ],
};
const EXTRAS = {
  id: 'extras', name: 'Add extras', type: 'multi', max: 4,
  choices: [
    { id: 'bacon', name: 'Applewood bacon', price: 2 },
    { id: 'cheese', name: 'Extra American cheese', price: 1 },
    { id: 'egg', name: 'Fried egg', price: 1.5 },
    { id: 'avo', name: 'Smashed avocado', price: 2 },
    { id: 'jalapeno', name: 'Charred jalapeños', price: 0.75 },
    { id: 'onion', name: 'Caramelized onions', price: 1 },
  ],
};
const hold = (...names) => ({
  id: 'hold', name: 'Hold anything?', type: 'multi', prefix: 'No',
  choices: names.map((n) => ({ id: n.toLowerCase().replace(/\W+/g, '-'), name: n })),
});

window.RESTAURANT = {
  id: 'brick-and-bun',
  name: 'Brick & Bun',
  kicker: 'SMASH BURGERS · EST. 2019',
  tagline: 'Smashed thin. Seared hard. Served fast.',
  intro: 'Fresh chuck and brisket, smashed on a 500°F flat-top for that crackly crust. Order at your table, ahead for pickup, or to your door.',
  facts: ['★ 4.8 (2,140 reviews)', 'Open today 11:00 – 23:00', '214 Mercer St'],
  address: '214 Mercer St, New York, NY',
  hours: 'Mon–Thu 11:00–22:00 · Fri–Sat 11:00–00:00 · Sun 12:00–22:00',
  phone: '(212) 555-0148',
  allergyNote: 'Ask us about allergens. Fries are cooked in beef tallow.',
  searchHint: 'burgers, fries, shakes…',
  currency: 'USD',
  locale: 'en-US',
  taxRate: 0.08875,
  orderPrefix: 'B',
  cookingStep: 'On the grill',
  modes: { dinein: true, pickup: true, delivery: true },
  prepTime: { pickup: '15–20 min', delivery: '30–45 min' },
  deliveryFee: 3.99,
  freeDeliveryOver: 40,
  minDelivery: 15,
  promos: {
    SMASH10: { type: 'percent', value: 10, label: '10% off' },
    FIRSTBITE: { type: 'amount', value: 5, label: '$5 off your first order' },
  },
  promoHint: 'Try SMASH10',
  // Set this to your backend URL to receive orders as JSON (POST).
  orderEndpoint: null,
  upsellTitle: 'Make it a feast',
  upsell: ['fries', 'onion-rings', 'shake', 'lemonade'],

  categories: [
    {
      id: 'smash', name: 'Smash Burgers',
      blurb: 'Two thin patties on a potato roll unless you say otherwise. Cooked through for maximum crust.',
      items: [
        {
          id: 'classic', name: 'The Classic Smash', price: 11.5, emoji: '🍔', tile: '#F4B740', cal: 840,
          desc: 'Double beef, American cheese, pickles, diced onion and Brick sauce on a potato roll.',
          tags: ['popular'],
          options: [PATTIES, BUN, EXTRAS, hold('Pickles', 'Onion', 'Brick sauce'), MEAL],
        },
        {
          id: 'smokehouse', name: 'Smokehouse', price: 13.5, emoji: '🍔', tile: '#C9733B', cal: 1050,
          desc: 'Double beef, smoked cheddar, applewood bacon, crispy onion straws and bourbon BBQ.',
          tags: ['popular'],
          options: [PATTIES, BUN, EXTRAS, hold('Onion straws', 'BBQ sauce'), MEAL],
        },
        {
          id: 'fire', name: 'Fire Starter', price: 13, emoji: '🌶️', tile: '#E0503A', cal: 910,
          desc: 'Double beef, pepper jack, charred jalapeños, chipotle mayo and habanero jam.',
          tags: ['spicy'],
          options: [PATTIES, BUN, EXTRAS, hold('Jalapeños', 'Habanero jam'), MEAL],
        },
        {
          id: 'truffle', name: 'Truffle Swiss', price: 14, emoji: '🍄', tile: '#B8A27C', cal: 890,
          desc: 'Double beef, Swiss, garlic-butter mushrooms, black truffle aioli and wild arugula.',
          tags: ['new'],
          options: [PATTIES, BUN, EXTRAS, hold('Mushrooms', 'Arugula'), MEAL],
        },
        {
          id: 'chophouse', name: 'The Chophouse', price: 16, emoji: '🥩', tile: '#9C4A3A', cal: 980,
          desc: 'One thick 8 oz chuck & brisket patty, cooked to order. Aged white cheddar, tomato, butter lettuce.',
          askOptions: true,
          options: [
            {
              id: 'temp', name: 'How would you like it cooked?', type: 'single', required: true,
              choices: [
                { id: 'mr', name: 'Medium rare' },
                { id: 'm', name: 'Medium', default: true },
                { id: 'mw', name: 'Medium well' },
                { id: 'wd', name: 'Well done' },
              ],
            },
            BUN, EXTRAS, MEAL,
          ],
        },
      ],
    },
    {
      id: 'chicken-plant', name: 'Chicken & Plant',
      blurb: 'Buttermilk-brined thighs fried to order, and two burgers with no meat at all.',
      items: [
        {
          id: 'nashville', name: 'Nashville Hot Chicken', price: 12.5, emoji: '🔥', tile: '#D9482B', cal: 930,
          desc: 'Crispy thigh dunked in cayenne oil, vinegar slaw, pickles, comeback sauce.',
          tags: ['spicy', 'popular'],
          askOptions: true,
          options: [
            {
              id: 'heat', name: 'Heat level', type: 'single', required: true,
              choices: [
                { id: 'mild', name: 'Mild' },
                { id: 'medium', name: 'Medium', default: true },
                { id: 'hot', name: 'Hot' },
                { id: 'cluckin', name: 'Cluckin’ Hot (sign a waiver)' },
              ],
            },
            BUN, hold('Slaw', 'Pickles'), MEAL,
          ],
        },
        {
          id: 'buttermilk', name: 'Buttermilk Chicken', price: 12, emoji: '🍗', tile: '#E8B04B', cal: 860,
          desc: 'Crispy thigh, honey mustard, shredded lettuce, tomato and pickles.',
          options: [BUN, EXTRAS, hold('Honey mustard', 'Tomato'), MEAL],
        },
        {
          id: 'garden', name: 'The Garden Smash', price: 13, emoji: '🌱', tile: '#7FA65A', cal: 720,
          desc: 'Two plant-based patties, vegan cheddar, lettuce, tomato, pickles and vegan Brick sauce.',
          tags: ['vegan'],
          options: [BUN, hold('Pickles', 'Tomato'), MEAL],
        },
        {
          id: 'halloumi', name: 'Crispy Halloumi', price: 12.5, emoji: '🧀', tile: '#E3C77A', cal: 780,
          desc: 'Panko-fried halloumi, harissa honey, cucumber, pickled red onion and mint yogurt.',
          tags: ['veg', 'spicy'],
          options: [BUN, hold('Harissa honey', 'Red onion'), MEAL],
        },
      ],
    },
    {
      id: 'sides', name: 'Fries & Sides',
      items: [
        {
          id: 'fries', name: 'Shoestring Fries', price: 4.5, emoji: '🍟', tile: '#F2C14E', cal: 420,
          desc: 'Skinny, crispy, salted the second they leave the fryer.',
          tags: ['gf'],
          options: [
            { id: 'size', name: 'Size', type: 'single', required: true, choices: [{ id: 'reg', name: 'Regular', hidden: true }, { id: 'lg', name: 'Large', price: 2 }] },
            { id: 'season', name: 'Seasoning', type: 'single', required: true, choices: [{ id: 'salt', name: 'Sea salt', hidden: true }, { id: 'cajun', name: 'Cajun spice' }, { id: 'garlic', name: 'Garlic parmesan', price: 1 }] },
          ],
        },
        {
          id: 'loaded', name: 'Loaded Fries', price: 8.5, emoji: '🧆', tile: '#D99A3D', cal: 880,
          desc: 'Shoestring fries under cheese sauce, chopped bacon, scallions and Brick sauce.',
          tags: ['popular'],
        },
        {
          id: 'onion-rings', name: 'Beer-battered Onion Rings', price: 5.5, emoji: '🧅', tile: '#E6B565', cal: 510,
          desc: 'Thick-cut sweet onions in a lager batter, with smoky ranch.',
          tags: ['veg'],
        },
        {
          id: 'sweet', name: 'Sweet Potato Fries', price: 5.5, emoji: '🍠', tile: '#E07B39', cal: 450,
          desc: 'With chipotle-maple dip.',
          tags: ['veg', 'gf'],
        },
        {
          id: 'tenders', name: 'Chicken Tenders (4)', price: 8, emoji: '🍗', tile: '#D7A247', cal: 640,
          desc: 'Buttermilk-fried tenders with your choice of dip.',
          askOptions: true,
          options: [
            { id: 'dip', name: 'Pick 2 dips', type: 'multi', required: true, max: 2, choices: [
              { id: 'ranch', name: 'Smoky ranch' }, { id: 'bbq', name: 'Bourbon BBQ' },
              { id: 'honey', name: 'Honey mustard' }, { id: 'brick', name: 'Brick sauce' }, { id: 'buffalo', name: 'Buffalo' },
            ] },
          ],
        },
      ],
    },
    {
      id: 'drinks', name: 'Shakes & Drinks',
      items: [
        {
          id: 'shake', name: 'Hand-spun Shake', price: 6.5, emoji: '🥤', tile: '#F2A7B5', cal: 690,
          desc: 'Frozen custard spun thick. Ask for a straw and a spoon.',
          tags: ['veg', 'popular'],
          askOptions: true,
          options: [
            { id: 'flavor', name: 'Flavor', type: 'single', required: true, choices: [
              { id: 'vanilla', name: 'Madagascar vanilla' }, { id: 'choc', name: 'Double chocolate' },
              { id: 'straw', name: 'Strawberry' }, { id: 'caramel', name: 'Salted caramel', price: 0.5 },
              { id: 'oreo', name: 'Cookies & cream', price: 0.75 },
            ] },
            { id: 'top', name: 'Toppings', type: 'multi', choices: [
              { id: 'whip', name: 'Whipped cream' }, { id: 'cherry', name: 'Cherry on top' }, { id: 'malt', name: 'Make it malted', price: 0.5 },
            ] },
          ],
        },
        {
          id: 'soda', name: 'Fountain Soda', price: 2.75, emoji: '🥤', tile: '#8EC5E8',
          desc: 'Free refills when dining in.',
          tags: ['vegan', 'gf'],
          askOptions: true,
          options: [
            { id: 'which', name: 'Choose', type: 'single', required: true, choices: [
              { id: 'coke', name: 'Coca-Cola' }, { id: 'diet', name: 'Diet Coke' }, { id: 'sprite', name: 'Sprite' }, { id: 'rootbeer', name: 'Root beer' },
            ] },
            { id: 'size', name: 'Size', type: 'single', required: true, choices: [{ id: 'm', name: 'Medium', hidden: true }, { id: 'l', name: 'Large', price: 0.75 }] },
          ],
        },
        {
          id: 'lemonade', name: 'Fresh Lemonade', price: 3.75, emoji: '🍋', tile: '#F5DB5B',
          desc: 'Squeezed every morning.',
          tags: ['vegan', 'gf'],
          options: [
            { id: 'style', name: 'Style', type: 'single', required: true, choices: [
              { id: 'classic', name: 'Classic', hidden: true }, { id: 'straw', name: 'Strawberry', price: 0.5 }, { id: 'mint', name: 'Mint', price: 0.5 },
            ] },
          ],
        },
        {
          id: 'beer', name: 'Local Draft Beer', price: 7, emoji: '🍺', tile: '#E4A93A',
          desc: '16 oz pour. Dine-in only, 21+, ID required.',
          askOptions: true,
          options: [
            { id: 'tap', name: 'On tap', type: 'single', required: true, choices: [
              { id: 'ipa', name: 'Other Half IPA' }, { id: 'lager', name: 'Brooklyn Lager' }, { id: 'pils', name: 'Threes Pilsner' },
            ] },
          ],
        },
      ],
    },
    {
      id: 'dessert', name: 'Desserts',
      items: [
        {
          id: 'sundae', name: 'Brownie Sundae', price: 7, emoji: '🍨', tile: '#A8735A', cal: 760,
          desc: 'Warm fudge brownie, vanilla custard, hot fudge, toasted peanuts.',
          tags: ['veg'],
        },
        {
          id: 'pie', name: 'Apple Hand Pie', price: 4.5, emoji: '🥧', tile: '#D9A35E', cal: 410,
          desc: 'Flaky, fried, rolled in cinnamon sugar.',
          tags: ['veg'],
        },
        {
          id: 'cookie', name: 'Brown Butter Cookie', price: 3, emoji: '🍪', tile: '#C68B4E', cal: 320,
          desc: 'Chocolate chunks and flaky salt. Baked every hour.',
          tags: ['veg'],
          soldOut: true,
        },
      ],
    },
  ],
};
