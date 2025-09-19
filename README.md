# Finance Buddy Web App

This repository now hosts the static, mobile-friendly front-end for the Finance Buddy experience powered by Google Apps Script. It is ready to serve via GitHub Pages (or any static host) while communicating with your existing Apps Script deployment.

## 1. Replace the Apps Script endpoint

1. Deploy your Google Apps Script as a web app (`Deploy` → `New deployment`).
2. Choose **"Anyone"** under access if you will host anonymously on GitHub Pages. If you must keep it private, protect the GitHub Pages site behind authentication instead.
3. The current build uses `https://script.google.com/macros/s/AKfycbzMZy2WW7nbmfTIG2vqpIsK9x33X_qn9KjIK_8Y6FKv2vNx5OEBWn3FmrnwJWv85kY15w/exec`; update `script.js` if you redeploy and the URL changes.

## 2. Upload the files to GitHub

1. Copy everything in this directory (`index.html`, `style.css`, `script.js`, `manifest.webmanifest`, `service-worker.js`, `offline.html`, and the `assets/` folder) into the root of your GitHub repository (`noonereallyeverdies/noonereallyeverdies`).
2. Commit the files and push to the `main` branch.

```
git add .
git commit -m "Add Finance Buddy static web app"
git push origin main
```

## 3. Enable GitHub Pages

1. Open your repository on GitHub and choose **Settings** → **Pages**.
2. Under **"Build and deployment"**, set **Source** to **"Deploy from a branch"**.
3. Select the `main` branch and the `/ (root)` folder, then click **Save**.
4. After a minute, GitHub Pages will give you a URL similar to `https://noonereallyeverdies.github.io/noonereallyeverdies/`.

> **Tip:** If you ever move these files into a subfolder (e.g., `/docs`), also move `service-worker.js` to that folder so the cached paths stay correct.

## 4. Test the hosted site

- Visit your GitHub Pages URL and open the browser console to confirm there are no blocked CORS requests.
- Try the **Refresh** and **Check Alerts** buttons and make sure data flows from Apps Script.
- On a phone, open the site and use **Add to Home Screen** (iOS Safari) or the **Install** prompt (Chrome, Edge, etc.). The bundled manifest and service worker make this work like a Progressive Web App (PWA) with an offline screen.

## 5. Optional tweaks

- Replace the placeholder icons in `assets/icons/` with branded artwork. Provide both 192×192 and 512×512 PNGs and keep the same filenames.
- Update colors and typography in `style.css` to match your visual identity.
- If you want analytics or additional scripts, add them right before the closing `</body>` tag in `index.html`.
- Apps Script responses can include extra fields (e.g., account history). Use `script.js` as a template for adding new cards/components.

### Troubleshooting

| Issue | Fix |
| --- | --- |
| **CORS or 403 error** | Make sure your Apps Script deployment is accessible to the public or to the Google account you are using. Re-deploy if you update permissions. |
| **Service worker 404s** | Service workers must live at the same directory level as your entry file. Keep `service-worker.js` in the site root on GitHub Pages. |
| **Install prompt does not appear** | Chrome only shows it after a user interacts with the page and meets PWA criteria. You can still add manually via the browser menu. |
| **Offline page won't display** | Visit the site once while online so the service worker can precache assets. |

Happy shipping! 💖
