# MemeSnap — Random Meme Generator

A lightweight, zero-dependency meme generator that pulls live content directly from Reddit's public JSON API. No account, no backend, no build step — just open `index.html` and go.

**[→ Live Demo](https://johnlester-0369.github.io/meme-generator)**

---

## Features

- **Live from Reddit** — fetches real-time posts from a curated list of meme subreddits
- **Gallery support** — handles both direct image posts and multi-image Reddit galleries
- **Rich post metadata** — displays upvote score, comment count, author, flair, and upvote ratio
- **Lightbox viewer** — click any meme to open a full-screen zoom view
- **Share & copy** — native Web Share API with clipboard fallback; shares the Reddit permalink for full context
- **Zero setup** — no API key, no login, no configuration required

---

## Getting Started

Clone the repo and open the file directly in your browser — no server or build step needed:

```bash
git clone https://github.com/johnlester-0369/meme-generator.git
cd meme-generator
open index.html   # macOS
# or just double-click index.html in your file explorer
```

That's it.

---

## Project Structure

```
meme-generator/
├── index.html        # App shell — structure and markup only
├── css/
│   └── styles.css    # Design tokens, component styles, responsive breakpoints
└── js/
    └── app.js        # State, Reddit fetch logic, DOM rendering, event handlers
```

The three files are intentionally separated so each layer can be read and edited independently — a designer adjusting tokens never needs to scroll past JavaScript, and a developer debugging fetch logic never needs to wade through CSS selectors.

---

## How It Works

1. On "Generate Meme", a subreddit is picked at random from a curated list
2. The app fetches `https://www.reddit.com/r/{subreddit}.json` directly from the browser — no proxy, no backend
3. Posts are filtered: videos, self-posts, and NSFW content are skipped
4. Gallery posts extract the first image from `media_metadata` using the declared `gallery_data` order
5. If no valid image is found in a response, the app retries up to 10 times across different subreddits
6. The selected meme is rendered with full metadata: title, subreddit, score, comments, author, flair, and upvote ratio

---

## Subreddits

Memes are pulled from:

> `dankmemes`, `memes`, `meme`, `dank_meme`, `shitpost`, `shitposting`, `Animemes`, `HistoryMemes`, `MemeTemplatesOfficial`, `Memes_Of_The_Dank`, `NANIKPosting`, `PampamilyangPaoLUL`

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Markup | Vanilla HTML5 | Zero build tooling required |
| Styles | Vanilla CSS with custom properties | Design token system without a preprocessor |
| Scripts | Vanilla JS (ES2020+) | No framework overhead for a single-screen app |
| Icons | [Lucide](https://lucide.dev/) via CDN | Consistent icon set with zero install |
| Fonts | [Syne](https://fonts.google.com/specimen/Syne) + [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts | Distinctive display + readable body pairing |
| Data | Reddit public JSON API | No auth, CORS-allowed, always fresh |

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires:
- `fetch` API
- CSS custom properties
- `aspect-ratio` CSS property
- `navigator.clipboard` (for copy; gracefully degrades)
- `navigator.share` (for native share on mobile; falls back to clipboard)

---

## License

MIT