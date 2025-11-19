# Hostel Hive - GitHub Pages Ready

This repository was prepared from the uploaded package and includes a GitHub Actions workflow
that will automatically deploy the site's contents to **GitHub Pages** when you push to the `main` branch.

## How to publish (pick one)

### Option A — using GitHub CLI (recommended if you have `gh` installed and authenticated)

1. Install and authenticate the GitHub CLI (`gh auth login`) if not done already.
2. From this folder:
```bash
cd repo  # replace with the path where you extracted this repo
# Create a new repository on GitHub and push the contents:
gh repo create YOUR_GH_USERNAME/hostel-hive --public --source=. --remote=origin --push
# Make sure the default branch is 'main' (gh creates 'main' by default)
```

The workflow `.github/workflows/pages.yml` will run on that push and deploy to GitHub Pages automatically.

### Option B — using git + GitHub web

1. Create a new repository on GitHub (Settings: Public, initialize WITHOUT README).
2. On your machine, in this repo folder:
```bash
git init
git branch -M main
git remote add origin https://github.com/YOUR_GH_USERNAME/hostel-hive.git
git add .
git commit -m "Initial commit - prepared for GitHub Pages"
git push -u origin main
```

3. The GitHub Actions workflow will run and deploy the site.

### Notes & troubleshooting
- The workflow assumes your site’s static files (`index.html`, `assets/`, etc.) are at the **root** of the repository. 
- If your build produces files in a `dist/` or `public/` folder, edit `.github/workflows/pages.yml` and change the `path` in `upload-pages-artifact` to that folder (e.g., `path: 'dist'`).
- After the Actions job succeeds, your site will be live at `https://<YOUR_GH_USERNAME>.github.io/hostel-hive/` (or the repository name you choose).
- If you prefer GitHub Pages from `gh-pages` branch or a different setup, I can modify the workflow.

## Files added automatically
- .github/workflows/pages.yml  — deploy workflow
- README.md                    — this file

