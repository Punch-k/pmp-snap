# PMP Snap — study

Snap a **PMP practice question** and get the answer with a **one-line reason**, its exam domain, and why the other options are wrong. Every question goes into a **review list** so you can revisit it.

- **Bottom right:** the camera button, plus buttons to pick a screenshot or paste the question text.
- **Left edge:** a readiness bar.
  - **Blue** while the AI is working.
  - **Amber** while you wait out Gemini's free-tier limit.
  - **Empty with a green dot** when it's ready for the next question.
- Runs on your phone as an installed app (a PWA): full screen, no browser bar. Uses your own free Gemini API key.

## Install on your phone

1. The app needs an **https** link. Options:
   - **GitHub Pages:** repo Settings → Pages → deploy from `main`. Private repos need GitHub Pro; otherwise make the repo public. The key is *not* in the code, so that's safe.
   - **Netlify or Cloudflare Pages:** drag the folder in.
2. Open the link on your phone.
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** menu → **Install app**.
3. Open it from the home-screen icon, tap the **gear**, paste your key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey), and tap **Save and test**.

The key is saved only on that phone (browser storage) and sent only to Google. Don't put it in this repo.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it installable and open instantly |
| `tests/mock-gemini.js` | Local stand-in for Gemini to test without a key, including the rate-limit case. Instructions are at the top of the file. |
