# Extension Release Process

## Automatic Release System

The extension is automatically built and released whenever changes are pushed to the extension folder.

### How It Works

1. **Trigger**: Any change to `apps/extension/**` automatically triggers a build
2. **Version**: Auto-generated as `YYYY.MM.DD-commitHash` (e.g., `2024.08.13-a3f2b1c`)
3. **Output**: Creates a GitHub release with the extension ZIP file

### Making a Release

Simply push your changes:

```bash
# Make your changes to the extension
git add apps/extension/
git commit -m "your commit message"
git push origin main
```

That's it! GitHub Actions will automatically:
- Build the extension
- Create a ZIP file
- Create a GitHub release
- Upload the extension package

### Download Releases

All releases are available in the [Releases](../../releases) section of the repository.

### Manual Build

To build locally:

```bash
cd apps/extension
bun run build
# Output will be in .output/chrome-mv3/
```