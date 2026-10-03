// Brick & Bun: menu data. Edit this file to change dishes, prices and options.
// Option groups: type 'single' (radio) or 'multi' (checkbox), `required`, `max`,
// and per-choice `price` deltas. `prefix` renders e.g. "No pickles" on the ticket.

const MEAL = {
  id: 'meal', name: 'Make it a menu', type: 'single', required: true,
  choices: [
    { id: 'none', name: 'Burger only', hidden: true },
    { id: 'fries-drink', name: 'With fries + drink', price: 4 },
    { id: 'fries-shake', name: 'With fries + milkshake', price: 6 },
  ],
};
const BUN = {
  id: 'bun', name: 'Bun', type: 'single', required: true,
  choices: [
    { id: 'classic', name: 'Classic bun', hidden: true },
    { id: 'brioche', name: 'Brioche' },
    { id: 'gf', name: 'Gluten-free bun', price: 1.5 },
    { id: 'lettuce', name: 'Lettuce (no bun)' },
  ],
};
const PATTIES = {
  id: 'patties', name: 'Patties', type: 'single', required: true,
  choices: [
    { id: 'single', name: 'Single', price: -2.5 },
    { id: 'double', name: 'Double', default: true, hidden: true },
    { id: 'triple', name: 'Triple', price: 3 },
  ],
};
const EXTRAS = {
  id: 'extras', name: 'Extras', type: 'multi', max: 4,
  choices: [
    { id: 'bacon', name: 'Bacon', price: 2 },
    { id: 'cheese', name: 'Extra cheese', price: 1 },
    { id: 'egg', name: 'Egg', price: 1.5 },
    { id: 'avo', name: 'Avocado', price: 2 },
    { id: 'jalapeno', name: 'Jalapeños', price: 1 },
    { id: 'onion', name: 'Caramelized onions', price: 1 },
  ],
};
const hold = (...names) => ({
  id: 'hold', name: 'Remove', type: 'multi', prefix: 'No',
  choices: names.map((n) => ({ id: n.toLowerCase().replace(/\W+/g, '-'), name: n })),
});

window.RESTAURANT = {
  id: 'brick-and-bun',
  name: 'Brick & Bun',
  kicker: 'BURGERS · FRIES · SHAKES',
  tagline: 'Fresh burgers, made to order.',
  intro: '',
  facts: ['Open every day 11:30 – 23:00', 'Dine in · Takeaway · Delivery'],
  address: '12 Rue des Lilas',
  hours: 'Every day 11:30 – 23:00',
  phone: '01 23 45 67 89',
  allergyNote: 'Ask us about allergens.',
  searchHint: 'the menu',
  currency: 'EUR',
  locale: 'fr-FR',
  taxRate: 0,
  taxNote: 'Prices include VAT.',
  tips: false,
  orderPrefix: 'B',
  cookingStep: 'On the grill',
  modes: { dinein: true, pickup: true, delivery: true },
  prepTime: { pickup: '15–20 min', delivery: '30–45 min' },
  deliveryFee: 2.5,
  freeDeliveryOver: 30,
  minDelivery: 15,
  promos: {
    BURGER10: { type: 'percent', value: 10, label: '10% off' },
  },
  promoHint: 'Code',
  // Set this to your backend URL to receive orders as JSON (POST).
  orderEndpoint: null,
  upsellTitle: 'Add a side',
  upsell: ['fries', 'onion-rings', 'shake', 'lemonade'],

  categories: [
    {
      id: 'burgers', name: 'Burgers',
      items: [
        {
          id: 'classic', name: 'The Classic', price: 10.5, emoji: '🍔', tile: '#F4B740',
          desc: 'Beef, cheddar, pickles, onions, house sauce.',
          tags: ['popular'],
          options: [PATTIES, BUN, EXTRAS, hold('Pickles', 'Onions', 'Sauce'), MEAL],
        },
        {
          id: 'bbq', name: 'BBQ Bacon', price: 12.5, emoji: '🍔', tile: '#C9733B',
          desc: 'Beef, cheddar, bacon, crispy onions, BBQ sauce.',
          tags: ['popular'],
          options: [PATTIES, BUN, EXTRAS, hold('Crispy onions', 'BBQ sauce'), MEAL],
        },
        {
          id: 'spicy', name: 'The Spicy', price: 12, emoji: '🌶️', tile: '#E0503A',
          desc: 'Beef, pepper jack, jalapeños, spicy mayo.',
          tags: ['spicy'],
          options: [PATTIES, BUN, EXTRAS, hold('Jalapeños', 'Spicy mayo'), MEAL],
        },
        {
          id: 'mushroom', name: 'Mushroom Swiss', price: 13, emoji: '🍄', tile: '#B8A27C',
          desc: 'Beef, Swiss cheese, mushrooms, truffle mayo.',
          tags: ['new'],
          options: [PATTIES, BUN, EXTRAS, hold('Mushrooms', 'Truffle mayo'), MEAL],
        },
        {
          id: 'big', name: 'The Big One', price: 15, emoji: '🥩', tile: '#9C4A3A',
          desc: 'Thick beef patty cooked how you like, cheddar, tomato, lettuce.',
          askOptions: true,
          options: [
            {
              id: 'temp', name: 'Cooking', type: 'single', required: true,
              choices: [
                { id: 'rare', name: 'Rare' },
                { id: 'medium', name: 'Medium', default: true },
                { id: 'well', name: 'Well done' },
              ],
            },
            BUN, EXTRAS, MEAL,
          ],
        },
      ],
    },
    {
      id: 'chicken-veggie', name: 'Chicken & Veggie',
      items: [
        {
          id: 'chicken', name: 'Crispy Chicken', price: 11, emoji: '🍗', tile: '#E8B04B',
          desc: 'Fried chicken, lettuce, tomato, honey mustard.',
          options: [BUN, EXTRAS, hold('Honey mustard', 'Tomato'), MEAL],
        },
        {
          id: 'hot-chicken', name: 'Hot Chicken', price: 11.5, emoji: '🔥', tile: '#D9482B',
          desc: 'Spicy fried chicken, coleslaw, pickles.',
          tags: ['spicy', 'popular'],
          askOptions: true,
          options: [
            {
              id: 'heat', name: 'Spice level', type: 'single', required: true,
              choices: [
                { id: 'mild', name: 'Mild' },
                { id: 'medium', name: 'Medium', default: true },
                { id: 'hot', name: 'Hot' },
              ],
            },
            BUN, hold('Coleslaw', 'Pickles'), MEAL,
          ],
        },
        {
          id: 'veggie', name: 'Veggie Burger', price: 11.5, emoji: '🌱', tile: '#7FA65A',
          desc: 'Plant-based patty, vegan cheese, lettuce, tomato.',
          tags: ['vegan'],
          options: [BUN, hold('Tomato', 'Lettuce'), MEAL],
        },
        {
          id: 'halloumi', name: 'Halloumi Burger', price: 11.5, emoji: '🧀', tile: '#E3C77A',
          desc: 'Grilled halloumi, cucumber, red onion, yogurt sauce.',
          tags: ['veg'],
          options: [BUN, hold('Red onion', 'Yogurt sauce'), MEAL],
        },
      ],
    },
    {
      id: 'sides', name: 'Sides',
      items: [
        {
          id: 'fries', name: 'Fries', price: 3.5, emoji: '🍟', tile: '#F2C14E',
          desc: 'Crispy and salted.',
          tags: ['vegan', 'gf'],
          options: [
            { id: 'size', name: 'Size', type: 'single', required: true, choices: [{ id: 'reg', name: 'Regular', hidden: true }, { id: 'lg', name: 'Large', price: 1.5 }] },
          ],
        },
        {
          id: 'cheese-fries', name: 'Cheese Fries', price: 6, emoji: '🧆', tile: '#D99A3D',
          desc: 'Fries, cheese sauce, bacon bits.',
          tags: ['popular'],
        },
        {
          id: 'onion-rings', name: 'Onion Rings', price: 4.5, emoji: '🧅', tile: '#E6B565',
          desc: 'With a dip.',
          tags: ['veg'],
        },
        {
          id: 'sweet', name: 'Sweet Potato Fries', price: 4.5, emoji: '🍠', tile: '#E07B39',
          desc: 'With a dip.',
          tags: ['vegan', 'gf'],
        },
        {
          id: 'tenders', name: 'Chicken Tenders (5)', price: 7, emoji: '🍗', tile: '#D7A247',
          desc: 'With 2 sauces of your choice.',
          askOptions: true,
          options: [
            { id: 'dip', name: 'Pick 2 sauces', type: 'multi', required: true, max: 2, choices: [
              { id: 'bbq', name: 'BBQ' }, { id: 'honey', name: 'Honey mustard' },
              { id: 'ketchup', name: 'Ketchup' }, { id: 'mayo', name: 'Mayo' }, { id: 'spicy', name: 'Spicy mayo' },
            ] },
          ],
        },
      ],
    },
    {
      id: 'drinks', name: 'Drinks',
      items: [
        {
          id: 'shake', name: 'Milkshake', price: 5.5, emoji: '🥤', tile: '#F2A7B5',
          desc: 'Vanilla, chocolate, strawberry or Oreo.',
          tags: ['veg', 'popular'],
          askOptions: true,
          options: [
            { id: 'flavor', name: 'Flavor', type: 'single', required: true, choices: [
              { id: 'vanilla', name: 'Vanilla' }, { id: 'choc', name: 'Chocolate' },
              { id: 'straw', name: 'Strawberry' }, { id: 'oreo', name: 'Oreo', price: 0.5 },
            ] },
          ],
        },
        {
          id: 'soda', name: 'Soft Drink', price: 2.5, emoji: '🥤', tile: '#8EC5E8',
          desc: '33 cl can.',
          tags: ['vegan', 'gf'],
          askOptions: true,
          options: [
            { id: 'which', name: 'Choose', type: 'single', required: true, choices: [
              { id: 'coke', name: 'Coca-Cola' }, { id: 'zero', name: 'Coca-Cola Zero' }, { id: 'sprite', name: 'Sprite' }, { id: 'fanta', name: 'Fanta' },
            ] },
          ],
        },
        {
          id: 'lemonade', name: 'Homemade Lemonade', price: 3.5, emoji: '🍋', tile: '#F5DB5B',
          desc: 'Lemon or mint.',
          tags: ['vegan', 'gf'],
          options: [
            { id: 'style', name: 'Flavor', type: 'single', required: true, choices: [
              { id: 'lemon', name: 'Lemon', hidden: true }, { id: 'mint', name: 'Mint' },
            ] },
          ],
        },
        {
          id: 'water', name: 'Water', price: 2, emoji: '💧', tile: '#B9DCEB',
          desc: '50 cl bottle.',
          tags: ['vegan', 'gf'],
          askOptions: true,
          options: [
            { id: 'type', name: 'Type', type: 'single', required: true, choices: [{ id: 'still', name: 'Still' }, { id: 'sparkling', name: 'Sparkling' }] },
          ],
        },
      ],
    },
    {
      id: 'dessert', name: 'Desserts',
      items: [
        {
          id: 'brownie', name: 'Brownie', price: 4.5, emoji: '🍫', tile: '#A8735A',
          desc: 'Warm, with vanilla ice cream.',
          tags: ['veg'],
        },
        {
          id: 'cookie', name: 'Cookie', price: 2.5, emoji: '🍪', tile: '#C68B4E',
          desc: 'Chocolate chip.',
          tags: ['veg'],
        },
        {
          id: 'sundae', name: 'Sundae', price: 4, emoji: '🍨', tile: '#E9B9A0',
          desc: 'Vanilla ice cream, caramel or chocolate sauce.',
          tags: ['veg', 'gf'],
          options: [
            { id: 'sauce', name: 'Sauce', type: 'single', required: true, choices: [{ id: 'caramel', name: 'Caramel', hidden: true }, { id: 'choc', name: 'Chocolate' }] },
          ],
        },
      ],
    },
  ],
};
