// All page copy and lists live here so the content can be edited in one place.
// Figures marked PLACEHOLDER are illustrative and should be replaced with live data.

// Where every Launch App button points: the dashboard.
export const APP_URL = '/app';

export type Ticker = 'AAPL' | 'NVDA' | 'TSLA' | 'SPX';

export const NAV = {
  gifts: {
    label: 'Gifts',
    send: {
      head: 'Send now',
      links: [
        { icon: 'gift', t: 'Stock gifts', d: 'Wrap a slice of Apple, Nvidia or Tesla in a link anyone can open.', href: '/app/send' },
        { icon: 'chart', t: 'Index gifts', d: 'One link, the whole S&P 500. A steady first investment for anyone.', href: '/app/send?stock=SPYx' },
        { icon: 'tracker', t: 'Gift tracker', d: 'See when your link was opened, claimed or is still waiting.', href: '/app/gifts' },
      ],
    },
    soon: {
      head: 'Group gifts',
      links: [{ icon: 'pools', t: 'Equigift Pools', tm: true, d: 'A group link that friends fill together until the day it is opened.', href: '/app' }],
    },
    cta: { t: 'Changelog', d: 'What shipped this month, and what is next.', href: '#guides' },
  },
  stocks: {
    label: 'Stocks',
    links: [
      { icon: 'tickets', t: 'Giftable stocks', d: 'AAPL, NVDA, TSLA and the S&P 500', href: '/app/send', accent: true },
      { icon: 'receipt', t: 'Pricing', d: 'Fees, spreads and minimums', href: '#pricing' },
      { icon: 'map', t: 'Live gift map', d: 'Gifts settling on Solana now', href: '#live' },
      { icon: 'history', t: 'Price history', d: 'How each stock has moved', href: '#stocks' },
      { icon: 'plus', t: 'More stocks', d: 'Next listings, voted by you', href: '#stocks' },
      { icon: 'cash', t: 'Cash out', d: 'Sell to cash or USDC any time', href: '/app/portfolio' },
    ],
  },
  learn: {
    label: 'Learn',
    links: [
      { icon: 'help', t: 'Help center', d: 'Claiming, cash-out and tax basics', href: '#faq' },
      { icon: 'book', t: 'Gift guides', d: 'Ideas and how-tos for every occasion', href: '#guides' },
    ],
  },
  cta: { label: 'Send a gift', href: '/app/send' },
};

export const HERO = {
  news: { tag: 'New', text: 'S&P 500 gifts are live', href: '#stocks' },
  eyebrowLead: 'A',
  eyebrowWords: ['birthday', 'graduation', 'wedding', 'holiday', 'new baby', 'thank-you', 'first job', 'anniversary', 'housewarming'],
  eyebrowTail: 'gift with upside',
  titleA: 'A stock, wrapped',
  titleB: 'as a gift.',
  sub: 'Choose Apple, Nvidia, Tesla or the S&P 500, set an amount and share a link. They claim it with an email or an X account. No wallet, no app.',
  primary: { label: 'Send a gift', href: '/app/send' },
  secondary: { label: 'Open a sample link', href: '#occasions' },
  band: 'Giftable today, settled on Solana',
};

export const INTRO = {
  label: 'Why a share',
  titleA: 'Cash gets spent.',
  titleHl: 'A share',
  titleB: 'sticks around.',
  body: 'Equigift turns any amount into a slice of a real company. You pay, we buy the tokenized stock on Solana and seal it inside a link. Whoever opens it owns it from that second, and can hold it, pass it on or cash it out whenever they like.',
  stock: {
    title: 'Stock gifts',
    // rich text: segments with b = bold
    body: [
      { t: 'Pick ' },
      { t: 'Apple', b: true },
      { t: ', ' },
      { t: 'Nvidia', b: true },
      { t: ', ' },
      { t: 'Tesla', b: true },
      { t: ' or the ' },
      { t: 'S&P 500', b: true },
      { t: ', type any amount from $5, add a note and drop the link wherever your people are: a group chat, an email, a card, a QR code on the cake.' },
    ],
    count: 64, // PLACEHOLDER (same figure as LIVE.claimed)
    countCap: 'gifts claimed this month, sent for:',
    link: 'Browse giftable stocks',
    href: '/app/send',
  },
  pools: {
    title: 'Equigift Pools',
    body: 'One link, many givers. Friends and family chip in from anywhere and the gift keeps growing until the day it is opened.',
    link: 'Launch App',
    href: APP_URL,
  },
};

export const LIVE = {
  label: 'Live on Solana mainnet',
  title: 'Gifts moving right now',
  heroNum: 846, // PLACEHOLDER (USD gifted in stock, kept under k)
  heroLbl: 'Dollars gifted in stock so far',
  flight: { lbl: 'Gift in flight', key: '0.25 NVDA  to  equigift.xyz/g/k7Qm2xWfP9aLr3Tz' },
  sent: 72, // PLACEHOLDER
  claimed: 64, // PLACEHOLDER
  session: 'Closes in',
  sessionClosed: 'Opens in',
  link: 'View live gift map',
};

export const HOW = {
  label: 'How it works',
  titleA: 'Pick a stock. Set an amount.',
  titleHl: 'Send the link.',
  body: 'Pay by card or with USDC and Equigift seals the shares into a one-time link. Your recipient taps it, signs in with email or X, and the stock is theirs. We set up a wallet for them behind the scenes, so there is nothing to install.',
};

export const POOLS = {
  label: 'Group gifts',
  titleA: 'Gift it',
  titleB: 'together.',
  name: 'Equigift Pools',
  body: 'lets a whole group fill one link: classmates for a graduation, cousins for a wedding, the team for a farewell. Everyone adds what they like, and the person you are celebrating opens one gift instead of twenty.',
  cta: 'Launch App',
};

export type Occasion = {
  key: string;
  name: string;
  icon: string;
  note: string;
  ticker: Ticker;
  amount: string;
  tags: string[];
};

export const OCCASIONS_HEAD = {
  titleA: 'One link for every',
  titleHl: 'occasion',
  body: 'Real notes stay private, so here are a few sample gifts to show how an Equigift lands.',
  cta: 'Browse gift ideas',
};

export const OCCASIONS: Occasion[] = [
  { key: 'birthday', name: 'Birthday', icon: 'cake', ticker: 'AAPL', amount: '$25', tags: ['Birthday', 'AAPL', '$25'], note: 'Happy sixteenth! Instead of another gift card, here is a little piece of the company that made your phone. Check on it next birthday and see what it has been up to.' },
  { key: 'graduation', name: 'Graduation', icon: 'cap', ticker: 'SPX', amount: '$100', tags: ['Graduation', 'S&P 500', '$100'], note: 'You did the hard part. This is a slice of five hundred companies to start the next chapter with. Leave it alone for ten years and tell me how it went.' },
  { key: 'wedding', name: 'Wedding', icon: 'heart', ticker: 'TSLA', amount: '$150', tags: ['Wedding', 'TSLA', '$150'], note: 'For the road ahead and the road trip honeymoon. A bit of Tesla for the two of you, with all our love.' },
  { key: 'baby', name: 'New baby', icon: 'baby', ticker: 'SPX', amount: '$50', tags: ['New baby', 'S&P 500', '$50'], note: 'Welcome to the world, little one. Your first investment is the whole index. By the time you can read this, it will have had quite a ride.' },
  { key: 'holidays', name: 'Holidays', icon: 'snow', ticker: 'NVDA', amount: '$40', tags: ['Holidays', 'NVDA', '$40'], note: 'No socks this year. Open the link, sign in with your email and you will own a bit of Nvidia before dinner is on the table.' },
  { key: 'thanks', name: 'Thank you', icon: 'thanks', ticker: 'AAPL', amount: '$20', tags: ['Thank you', 'AAPL', '$20'], note: 'You covered my shifts all month. Coffee felt too small, so here is a share-sized thank you instead.' },
  { key: 'firstjob', name: 'First job', icon: 'briefcase', ticker: 'SPX', amount: '$30', tags: ['First job', 'S&P 500', '$30'], note: 'First paycheck, first share. Start the habit now and your future self will be very smug about it.' },
  { key: 'anniversary', name: 'Anniversary', icon: 'gem', ticker: 'NVDA', amount: '$75', tags: ['Anniversary', 'NVDA', '$75'], note: 'Five years in and you are still my favourite chip. Happy anniversary.' },
  { key: 'home', name: 'Housewarming', icon: 'house', ticker: 'AAPL', amount: '$35', tags: ['Housewarming', 'AAPL', '$35'], note: 'New keys, new plants, new portfolio. Welcome home, and enjoy owning something that does not need watering.' },
  { key: 'retire', name: 'Retirement', icon: 'sunset', ticker: 'SPX', amount: '$200', tags: ['Retirement', 'S&P 500', '$200'], note: 'Forty years of early starts. Here is something that keeps working while you finally sleep in.' },
  { key: 'because', name: 'Just because', icon: 'sparkles', ticker: 'TSLA', amount: '$10', tags: ['Just because', 'TSLA', '$10'], note: 'Saw this and thought of you. That is it, that is the note.' },
];

export const GUIDES = {
  label: 'Guides',
  title: 'Gift guides',
  body: 'Short, plain reads on giving stock well: who it suits, what claiming looks like and what happens at tax time.',
  cta: 'View all guides',
  items: [
    { kind: 'art' as const, name: 'First Share', rest: 'Gifting stock to kids and teens', date: 'October 2026' },
    { kind: 'title' as const, name: 'Claim Notes', rest: 'What happens after someone opens your link', date: 'October 2026' },
  ],
};

export const PRICING = {
  titleBold: 'Free',
  titleRest: 'to claim, 1% to send',
  body: 'Senders pay a flat 1% when they wrap a gift. Recipients never pay to claim, hold or pass a share on, and the price is locked the moment you hit send.',
  primary: 'See pricing',
  secondary: 'Read the custody notes',
  tabs: [
    { t: 'Sending', d: 'A flat 1% on the gift amount, shown before you pay. Card and USDC both work, and the share price is locked when you send.' },
    { t: 'Claiming', d: 'Free. Open the link, sign in with email or X, and the share lands in a wallet we set up for you. No seed phrase to write down.' },
    { t: 'Holding', d: 'Shares sit on Solana in your name, not on our books. Keep them as long as you like at no cost, or send them on as a new gift.' },
    { t: 'Cashing out', d: 'Sell whenever the market is open and withdraw to a bank card or as USDC. One small spread, always shown up front.' },
  ],
};

export const SAFE = {
  label: 'Where your gift lives',
  titleA: 'Owned on-chain,',
  titleHl: 'not on our books.',
  body: 'Every gift is a tokenized share on Solana, backed one to one by the real stock held with a licensed custodian. Unclaimed links can be cancelled and refunded, and claimed shares can move to any Solana wallet whenever the owner wants.',
};

export const CTA = {
  title: 'Make someone a shareholder today.',
  body: 'Pick a ticker, set an amount and your link is ready in under a minute. The easiest present you will send this year.',
  send: {
    label: 'Send',
    title: 'Wrap a gift',
    body: [{ t: 'Choose Apple, Nvidia, Tesla or the ' }, { t: 'S&P 500', b: true }, { t: ', add a short note and share the link anywhere you can paste text.' }],
    app: 'Launch App',
    a: 'Send a gift',
    b: 'Gift tracker',
  },
  claim: { label: 'Claim', title: 'Got a link?', body: 'Open it, sign in with email or X, and the share is yours. No wallet, no app.', a: 'Claim a gift', b: 'How claiming works' },
  pools: { label: 'Pools', title: 'Equigift Pools', body: 'Gift it together. One group link that grows until it is opened.', a: 'Launch App' },
  strip: [
    { icon: 'candles', t: 'Apple, Nvidia, Tesla, S&P 500' },
    { icon: 'at', t: 'Claim with email or X' },
    { icon: 'nowallet', t: 'No wallet, no app' },
    { icon: 'zap', t: 'Settled on Solana' },
    { icon: 'dollar', t: 'Gifts from $5' },
    { icon: 'cash', t: 'Cash out any time' },
  ],
};

export const FAQ = {
  label: 'FAQ',
  titleA: 'Questions people',
  titleHl: 'ask us',
  items: [
    { q: 'What is Equigift?', a: 'Equigift lets you send a real stock as a gift link. Choose Apple, Nvidia, Tesla or the S&P 500, set an amount and share the link. The person who opens it claims the shares with an email or X account.' },
    { q: 'Does the person I send to need a crypto wallet?', a: 'No. When they claim, Equigift creates a Solana wallet for them in the background, tied to their email or X login. They can move the shares to a wallet of their own later if they want to.' },
    { q: 'Are these real shares?', a: 'Each gift is a tokenized stock on Solana, backed one to one by the underlying share held with a licensed custodian. It follows the stock price and can be sold back for cash or USDC.' },
    { q: 'What if my link is never opened?', a: 'Unclaimed gifts can be cancelled from your gift tracker and refunded to you. You can also set an expiry date on a link when you send it.' },
    { q: 'Can I send part of a share?', a: 'Yes. You choose a dollar amount from $5 upward and the recipient gets that value in shares, down to small fractions.' },
    { q: 'Why is it built on Solana?', a: 'Gifts need to settle fast and cost almost nothing to move. Solana confirms in under a second for a fraction of a cent, so the fee you see is the fee you pay.' },
  ],
  more: { title: 'Still curious?', body: 'Follow us on X for product news, and send the team your questions about sending, claiming and cashing out.', cta: 'Follow us on X' },
};

// Social profiles: X only.
export const SOCIALS = [{ key: 'x', label: 'Equigift on X', href: 'https://x.com/Equigift_xyz' }] as const;

export const FOOTER = {
  blurb: 'Stocks, wrapped as gifts and delivered as links. Built on Solana for anyone who would rather give a share than a gift card.',
  newsLabel: 'Stay in the loop',
  newsPlaceholder: 'Your email for updates',
  newsCta: 'Subscribe',
  cols: [
    { h: 'Gifts', groups: [{ links: ['Send a gift', 'Claim a gift'] }] },
    { h: 'Products', groups: [{ cat: 'Group gifts', links: ['Equigift Pools'], strong: true }, { cat: 'Available now', links: ['Stock gifts', 'Index gifts'] }] },
    { h: 'Learn', groups: [{ links: ['Help center', 'Gift guides', 'Pricing', 'Gift tracker', 'Changelog', 'FAQ', 'Brand assets'] }] },
  ],
  copy: '© 2026 Equigift. All rights reserved.',
  legal: ['Privacy Policy', 'Terms of Service'],
};
