# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PochaCoding is a visual game maker for children (ages 8-12) that combines Blockly's block-based programming with Phaser 3's game engine. Similar to Scratch, but outputs real Phaser games.

## Tech Stack

- React 19 + TypeScript
- Phaser 3.90 (game engine)
- Blockly 12 (visual programming)
- Zustand (state management)
- Dexie/IndexedDB (local storage)
- Vite + Tailwind CSS

## Common Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (runs tsc first)
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## Architecture

```
Left Panel (40%)     │  Right Panel (60%)
─────────────────────┼──────────────────────
Blockly Editor       │  Scene Tabs
- Per-object code    │  Phaser Canvas (stage)
- Custom blocks      │  Sprite Shelf (objects)
```

### Key Concepts

- **Project** → contains multiple **Scenes**
- **Scene** → contains **GameObjects** + background + camera config
- **GameObject** → has sprite, position, physics config, and Blockly code (XML)
- **Reusable Object** → saved to global library, can be inserted into any scene

### State Management

- `projectStore.ts` - Project/Scene/Object CRUD operations
- `editorStore.ts` - UI state (selection, play mode, dialogs)

### Data Flow

1. User creates blocks in Blockly → saved as XML to `GameObject.blocklyXml`
2. Play button → XML converted to JS → executed in Phaser runtime
3. Projects saved to IndexedDB via Dexie

## File Organization

| Path | Purpose |
|------|---------|
| `src/types/index.ts` | All TypeScript interfaces |
| `src/db/database.ts` | Dexie DB + repositories |
| `src/store/` | Zustand stores |
| `src/components/blockly/toolbox.ts` | Custom block definitions |
| `src/components/stage/PhaserCanvas.tsx` | Phaser integration |

## Development Guidelines

### Commit Strategy

**Commit immediately after each feature or bug fix.** Do not batch multiple changes into one commit.

- One feature = one commit
- One bug fix = one commit
- Include descriptive commit messages explaining what changed and why

### Versioning

This project uses **three types of versions**:

| Version | Location | Purpose |
|---------|----------|---------|
| **App Version** | `package.json` → `version` | Release version (semver) |
| **Schema Version** | `src/db/database.ts` → `CURRENT_SCHEMA_VERSION` | Project data structure version |
| **DB Version** | `src/db/database.ts` → Dexie `version()` | IndexedDB table/index structure |

#### When to Increment Versions

**App Version** (`package.json` AND `src/db/database.ts` → `APP_VERSION`):
- Patch (0.0.X): Bug fixes
- Minor (0.X.0): New features (backward compatible)
- Major (X.0.0): Breaking changes
- **Keep both locations in sync!**

**Schema Version** (`CURRENT_SCHEMA_VERSION`):
Increment when changing the structure of:
- `Project`, `Scene`, `GameObject` interfaces in `src/types/index.ts`
- Adding/removing/renaming fields that affect saved project files
- Adding new block types that store data in new ways
- **Must add migration function** in `database.ts` → `migrations` object

```typescript
// Example: Adding a migration when incrementing from v1 to v2
const migrations: Record<number, MigrationFn> = {
  2: (project) => {
    // Migrate from v1 to v2
    project.scenes.forEach(scene => {
      scene.newField = scene.newField ?? 'default';
    });
    return project;
  },
};
```

**DB Version** (Dexie):
Increment when changing IndexedDB structure:
- Adding new tables
- Adding/removing indexes
- Changing primary keys

### Adding New Blocks

1. Add block definition in `src/components/blockly/toolbox.ts` → `registerCustomBlocks()`
2. Add to toolbox category in `getToolboxConfig()`
3. Add code generator in `src/phaser/CodeGenerator.ts`
4. Add runtime method in `src/phaser/RuntimeEngine.ts` (if needed)
5. **Commit after completing the block**

Note: If the block stores new data in the project (e.g., new field in GameObject), increment `CURRENT_SCHEMA_VERSION`.

### Block Color Conventions

| Category | Color |
|----------|-------|
| Events | #FFAB19 (yellow) |
| Motion | #4C97FF (blue) |
| Looks | #9966FF (purple) |
| Physics | #40BF4A (green) |
| Control | #FFBF00 (orange) |
| Sensing | #5CB1D6 (cyan) |
| Operators | #59C059 (light green) |
| Variables | #FF8C1A (red-orange) |
| Camera | #0fBDA8 (teal) |
| Sound | #CF63CF (pink) |

## Current Status

See `plan.md` for detailed implementation progress and phase checklist.
