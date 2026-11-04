# Alfred Pansacala · Portfolio Studio

The project includes the complete static site in `dist/`, the portfolio content in `content/`, and the Python build and validation scripts in `scripts/`.

## Preview locally

Open `dist/index.html` in your browser, or run `python3 -m http.server 8000 --directory dist` and open `http://localhost:8000`.

## Publish on GitHub Pages

1. Extract the ZIP and commit its contents, including the hidden `.github/` folder, to the default branch of your GitHub repository.
2. Open **Settings → Pages**. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Publish portfolio → Run workflow**. The completed run shows the published URL under the `github-pages` environment.

The workflow rebuilds the site, verifies the portfolio content, and publishes `dist/`. It also sets the contact form's source URL to your Pages address. See the [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Update content

Edit `content/portfolio.json`, then run `python3 scripts/build.py` and `python3 scripts/validate_content.py`. For the inquiry form setup and delivery checks, see [FORMSUBMIT-SETUP.md](FORMSUBMIT-SETUP.md).
