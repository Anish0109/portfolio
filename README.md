# Anish Patil: car animation portfolio

A dark 3D sphere where visitors sweep their headlights to find the animations.
It's a plain static website, so any free static host can serve it. The steps below use GitHub Pages.

## What's in this folder

| File | What it is | Do you edit it? |
|---|---|---|
| `content.js` | The trailer lines, the list of videos, and the floating signs | Yes, this is the main one |
| `videos/` | The video files | Add, swap or remove videos here |
| `index.html` | The page: your name, the "about" text, the LinkedIn link | Sometimes, for the intro text |
| `style.css` | Colours, fonts and sizes | Rarely |
| `app.js` | The 3D scene: sky, headlights, frames, signs, sparks | No |
| `sky.jpg` | The night sky (NightSkyHDRI003 from ambientCG, CC0) | No |
| `preview.bat`, `preview.py` | Preview the site on your PC | No |

## Preview on your PC

Double-click `preview.bat`. It opens http://localhost:8000 in your browser. Close the black window to stop it.

Opening `index.html` directly does not work, because browsers block videos inside 3D scenes on `file://` pages.

## Change texts or videos

- **Swap a video:** put the new file in `videos/`, then change its `file:` line in `content.js`.
- **Add a video:** copy one `{id: ..., file: ..., name: ..., short: ..., sell: ...},` line in `content.js` and fill it in. Up to 10 videos keep fixed spots in the sphere. The first video in the list is the one straight ahead.
- **Remove a video:** delete its line in `content.js`.
- **Texts:** the start-screen lines are under `trailer:`. Each video's caption is its `sell:` line. The floating signs are under `signs:`. A sign's `to:` names a video `id`, or `'near'` / `'far'`.
- **Name, about text, LinkedIn:** in `index.html`. Search for `Anish Patil` or `linkedin`.

After an edit, reload the preview page to see it.

Use MP4 files with H.264 video, which is Blender's "FFmpeg video, MPEG-4, H.264" output. They play in every browser.
Keep each file under 100 MB, the GitHub limit. Smaller files start faster for visitors: about 5–20 MB for a short clip is a good target.

## Put it online with GitHub Pages (free)

1. Sign in at github.com, or create an account.
2. Create a new **public** repository named `YOUR-USERNAME.github.io`. Leave out the README.
3. In this folder, run:
   ```
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-USERNAME.github.io.git
   git push -u origin main
   ```
   Use git, not the website's "Upload files" button. That button refuses files over 25 MB, and `c63-teaser.mp4` is 57 MB.
4. On GitHub, open the repository's **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**, then **main** and **/ (root)**, and click **Save**.
5. After a minute or two the site is live at `https://YOUR-USERNAME.github.io`. Put that link on your CV and LinkedIn.

## Update the live site later

Edit the files, check them with `preview.bat`, then run:
```
git add .
git commit -m "Update portfolio"
git push
```
GitHub republishes the site in about a minute. Press Ctrl+F5 in your browser if you still see the old version.
