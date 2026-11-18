# Ritual — product-aware routine builder

A responsive beauty product picker and routine chat for products from CeraVe,
L’Oréal Paris, Garnier, Lancôme, Kiehl’s, Maybelline, La Roche-Posay, and NYX.
The catalog can be searched and filtered by category. Product descriptions are
available on each card, selections persist in `localStorage`, and the assistant
uses the selected product details and conversation history to create a routine
and answer related follow-up questions. The page also includes an optional,
user-controlled synthesized ambient music loop with a volume slider, an RTL
layout toggle, and a current-web-sources setting that displays clickable
citations.

## Run the page locally

The app loads `products.json` with `fetch`, so serve the project over HTTP
instead of opening `index.html` directly. From this folder, run:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`. Product browsing, search, selection, and
saved selections work without an AI service.

## Deploy the Cloudflare Worker

The browser sends the selected product data and chat history to the Worker.
The OpenAI API key is stored as a Worker secret and is never placed in the
page's JavaScript or sent to the browser.

1. Install Node.js and create or sign in to a Cloudflare account.
2. From this project folder, authenticate Wrangler:

   ```powershell
   npx wrangler login
   ```

3. Store your OpenAI API key as a Cloudflare secret:

   ```powershell
   npx wrangler secret put OPENAI_API_KEY
   ```

   Enter the key when prompted. Do not put it in `index.html`, `script.js`,
   `wrangler.toml`, or any other checked-in file.

4. In `wrangler.toml`, replace `https://YOUR-SITE.example` in
   `ALLOWED_ORIGINS` with the origin serving this page. Keep the local origin
   if you also want to use the deployed Worker while testing at
   `http://localhost:8000`.
5. Deploy the Worker:

   ```powershell
   npx wrangler deploy
   ```

6. Copy the deployed Worker URL (it ends in `workers.dev`) into the
   `routine-worker-url` meta tag in `index.html`, adding `/api/chat` at the
   end. For example:

   ```html
   <meta name="routine-worker-url" content="https://your-worker.your-account.workers.dev/api/chat" />
   ```

7. Publish the static page and visit the Worker health endpoint at
   `https://your-worker.your-account.workers.dev/health`. It should return
   `{"status":"ok"}`.

The Worker accepts only configured browser origins when an `Origin` header is
present. CORS is not authentication; for a public production site, consider
adding Cloudflare rate limiting to help protect your API usage.

The chat's **Use current web sources** option is enabled by default. It sends
requests through the OpenAI Responses API with its `web_search` tool and shows
the returned source links under the assistant's reply. Turn it off to use the
standard chat completion endpoint without live search. Web search may incur
additional API charges.

## Product and safety notes

`products.json` is a small example catalog, not a live product feed. Product
formulas and availability can change by market; verify current packaging and
official product information. The assistant is prompted to avoid diagnosing
conditions or inventing directions and to recommend professional care for
persistent irritation or ingredient safety concerns. Its responses are
informational, not medical advice.

Product card photos are linked from Open Beauty Facts contributor uploads.
Those images are shared under the
[CC BY-SA 3.0 license](https://creativecommons.org/licenses/by-sa/3.0/);
catalog items without a verified matching photo use the built-in branded
artwork instead.
