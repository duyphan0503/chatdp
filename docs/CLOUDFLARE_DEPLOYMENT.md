# Deploying ChatDP Frontend to Cloudflare Pages

To host your Flutter Web app on `https://chatdp.duyphan-dz-dev.win` using Cloudflare Pages, follow these steps:

## 1. Prerequisites

- A Cloudflare account.
- Your domain `duyphan-dz-dev.win` added to Cloudflare.
- Flutter environment set up.

## 2. Prepare the Code

We have already:

- Enabled **Path URL Strategy** in `lib/main.dart` (removes the `#` from URLs).
- Added `web/_redirects` to handle client-side routing.
- Reverted `.env.example` to hide sensitive API domains.

## 3. Deployment via Cloudflare Dashboard

1. Log in to **Cloudflare Dashboard** -> **Workers & Pages**.
2. Click **Create an application** -> **Pages** -> **Connect to Git**.
3. Select your `chatdp` repository.
4. Configure Build Settings:
   - **Project Name:** `chatdp-frontend`
   - **Production Branch:** `main` (or `develop` if testing)
   - **Framework Preset:** None (choose `Other`)
   - **Build Command:**
     ```bash
     cd apps/frontend && flutter build web --release --no-source-maps
     ```
   - **Build Output Directory:** `/apps/frontend/build/web`
5. **Environment Variables:**
   - Add `BASE_URL`: `https://api.your-real-domain.com`
   - (Optional) Add your Google Client IDs here if not using a `.env` file in CI.

## 4. Custom Domain Configuration

1. Once the deployment is finished, go to the **Custom domains** tab in your Pages project.
2. Click **Set up a custom domain**.
3. Enter `chatdp.duyphan-dz-dev.win`.
4. Cloudflare will automatically handle the DNS records and SSL certificate.

## 5. Path Strategy (SPA) Support

The file `apps/frontend/web/_redirects` contains:

```text
/*    /index.html   200
```

This tells Cloudflare to serve `index.html` for any URL path, allowing Flutter's `go_router` to handle the routing correctly without showing 404 errors on page refresh.

## 6. Security Note

Your `.env` file and production API domain are **NOT** committed to Git. Cloudflare Pages will use the build command to generate the app. If you need the secrets during build time, provided them via Cloudflare's **Environment Variables** dashboard instead of committing them.
