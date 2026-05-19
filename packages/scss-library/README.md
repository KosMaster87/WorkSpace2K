# @dev2k/scss-library

> Wiederverwendbare SCSS-Bibliothek mit CSS Custom Properties und modernen Mixins

## Übersicht

- CSS Custom Properties (`var(--variable)`) statt SCSS-Variablen — überschreibbar pro Projekt
- Responsive Breakpoint-Mixins
- Flexbox & Layout Mixins
- Typography System
- Modern CSS Reset
- Dark Mode via `[data-theme="dark"]`

---

## Installation

### Via GitHub (empfohlen)

```json
// package.json
"@dev2k/scss-library": "github:KosMaster87/scss-library#v1.1.0"
```

```bash
npm install
```

Kein npmjs.com-Account nötig. Der `#v1.1.0` Tag pinnt auf einen stabilen Stand.

### angular.json — Sass-Suchpfad konfigurieren

```json
"stylePreprocessorOptions": {
  "includePaths": ["node_modules/@dev2k"]
}
```

Damit reicht `@use 'scss-library'` statt des vollen Pfads.

---

## Verwendung

### Globaler Import (`styles.scss`)

```scss
@use "scss-library"; // lädt Reset, Variables, Typography, Utils
```

### Komponenten-SCSS (Mixins verwenden)

```scss
@use "scss-library" as lib;

.my-component {
  @include lib.flex-center;
  padding: var(--space-4);
}
```

### Selektiver Import (nur Mixins, ohne Base-Styles)

```scss
@use "scss-library/abstracts" as lib;
```

---

## Projekt-spezifische Anpassung

Die Library definiert generische Defaults — **jedes Projekt überschreibt nur was abweicht**, in seiner eigenen `styles.scss`. Kein Fork, kein Branch nötig.

```scss
// styles.scss
@use "scss-library";

// Light Theme
:root,
[data-theme="light"] {
  --primary-color: #your-brand-color;
  --background-primary: #ffffff;
  --text-primary: #1c2128;
  --font-family-primary: "Inter", sans-serif;
}

// Dark Theme (ThemeService setzt data-theme="dark" auf <html>)
[data-theme="dark"] {
  --background-primary: #0d1117;
  --text-primary: #e6edf3;
  --border-color: #30363d;
}
```

**Farben, Fonts, Spacing** — alle Tokens sind in `abstracts/_variables.scss` dokumentiert.

---

## Dateistruktur

```
scss-library/
├── _index.scss              # Haupteinstiegspunkt (@forward abstracts, base, utils)
├── abstracts/
│   ├── _variables.scss      # CSS Custom Properties (Design Tokens)
│   ├── _mixins-breakpoints.scss
│   ├── _mixins-flexbox.scss
│   ├── _mixins-layout.scss
│   ├── _mixins-typography.scss
│   ├── _mixins-buttons.scss
│   └── _mixins-utilities.scss
├── base/
│   ├── _reset.scss          # Modern CSS Reset (box-sizing, margin, html/body)
│   └── _typography.scss     # Heading/Text Styles
└── utils/
    └── _helpers.scss        # Utility Classes
```

---

## Lokale Entwicklung (npm link)

Für Änderungen an der Library während eines laufenden Projekts — **ohne `package.json` anzufassen**:

```bash
# Einmalig: Library global registrieren
cd path/to/scss-library
npm link

# Einmalig pro Projekt: Symlink setzen
cd path/to/my-project
npm link @dev2k/scss-library
```

Änderungen in der Library sind sofort wirksam — `ng serve` pickt sie im Watch-Mode automatisch auf.

---

## Neue Version veröffentlichen

```bash
# package.json version hochzählen
git add . && git commit -m "feat: ..."
git tag v1.2.0
git push && git push --tags

# In Projekten updaten:
"@dev2k/scss-library": "github:KosMaster87/scss-library#v1.2.0"
npm install
```

---

## Lizenz

MIT — © dev2k
