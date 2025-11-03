# Contributing to Civitai Tag Collector

Thank you for your interest in contributing! This extension helps users curate their Civitai experience, and community contributions are welcome.

## Ways to Contribute

### 🐛 Report Bugs

If you find a bug, please [open an issue](https://github.com/LaughterOnWater/civitai-tag-collector/issues) with:

- **Browser and version** (Chrome 120, Edge 119, etc.)
- **Extension version** (check `manifest.json`)
- **Civitai image URL** where the issue occurs
- **Console logs** (F12 → Console tab, screenshot any errors)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**

### 💡 Suggest Features

Have an idea for improvement? [Open an issue](https://github.com/LaughterOnWater/civitai-tag-collector/issues) with:

- **Clear description** of the feature
- **Use case**: Why would this be useful?
- **Implementation ideas** (optional)

### 🔧 Submit Code Changes

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/your-feature-name`
3. **Make your changes**
   - Follow existing code style
   - Add JSDoc comments for new functions
   - Test on actual Civitai pages
4. **Commit with clear messages**: `git commit -m "Add feature: description"`
5. **Push to your fork**: `git push origin feature/your-feature-name`
6. **Open a Pull Request** with:
   - Description of changes
   - Screenshots/examples if applicable
   - Any breaking changes noted

## Development Guidelines

### Code Style

- Use **JSDoc comments** for all functions
- Use `const` and `let`, not `var`
- Descriptive variable names (`imageId`, not `id`)
- Console logs for debugging (use `console.log`, `console.warn`, `console.error` appropriately)

### Testing Before Submitting

1. Load the extension as unpacked
2. Test on multiple Civitai image pages
3. Check console for errors (F12)
4. Test all features:
   - Data collection
   - Enable/disable toggle
   - JSON export
   - Clear data
5. Verify data structure in exported JSON

### Common Areas for Contribution

- **Extraction improvements**: Civitai changes their UI frequently
- **Additional data fields**: What else would be useful to collect?
- **Filter recommendations**: New filtering strategies
- **UI improvements**: Better button design, notifications, etc.
- **Documentation**: Clarify installation, usage, or filtering tips
- **Bug fixes**: Check the Issues tab

## Civitai DOM Structure

The extension relies on Civitai's Mantine UI classes. If Civitai updates their UI, extraction may break. Key selectors:

- `div.mantine-Group-root` - Tag container
- `.mantine-Badge-root` - Tag badges
- `p.mantine-Text-root` - Section headers
- `p.underline` - Resource names
- `.mantine-Badge-label` - Resource types

See `CLAUDE.md` for detailed architecture documentation.

## Questions?

Not sure about something? Feel free to [open an issue](https://github.com/LaughterOnWater/civitai-tag-collector/issues) and ask!

## Support Me!

It's just me. Projects like this put food on the table. If you found this useful, [anything helps!](https://shop.low.li/downloads/help-the-legend-sail-on/) Thanks!

## Code of Conduct

Be respectful and constructive. This is a community tool to help people curate their experience.
