# Horizon cleaned masters

Transparent, centered, no-background masters for Horizon companions.

**These PNG files are not committed yet** (binary push limitation from the agent side).

## One-command import

1. Download `horizon_cleaned_assets.zip` from the chat (or the smaller `lineups_key.zip`).
2. Place the zip in the **repo root**.
3. Run:

```bash
bash tools/import_cleaned_art.sh horizon_cleaned_assets.zip
```

4. Then:

```bash
git add tools/reference_art/horizon_cleaned tools/lineups tools/sprites_96
git status   # confirm many new .png files
git commit -m "Add cleaned Horizon masters (transparent) + contact sheets"
git push origin main
```

After that, this folder will contain the real 59 transparent masters and `tools/lineups/` will have the contact sheets.
