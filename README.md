# Deploying to GitHub Pages

This repo is configured to deploy automatically with GitHub Actions.

## What was added

- Workflow: `.github/workflows/deploy-github-pages.yml`
- Trigger: push to `main` or `master` (and manual trigger from Actions tab)
- Build path in CI:
  - Uses `/<repo-name>/` for project sites
  - Uses `/` automatically if the repo name ends with `.github.io` (user/org site)

## One-time setup in GitHub

1. Push this repo to GitHub.
2. Open your repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Commit/push to `main` (or `master`) to trigger deployment.

## How to deploy

1. Push to `main` or `master`.
2. Open `Actions` tab and watch `Deploy to GitHub Pages`.
3. After it succeeds, your site will be live at:
   - Project site: `https://<your-github-username>.github.io/<repo-name>/`
   - User/org site (`<user>.github.io` repo): `https://<your-github-username>.github.io/`

## Manual redeploy

1. Open `Actions`.
2. Select `Deploy to GitHub Pages`.
3. Click `Run workflow`.

## Local build check

```bash
npm ci
npm run build
```
