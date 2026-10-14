# Milestone 8 — Records and development tools

Local implementation, build 8.0.0. No tests, game runs, automated simulations, benchmarks, builds, uploads, or ZIPs were performed. Runtime behavior has not been verified.

## Save and continue

Open **Save / Continue** from the title screen or pause menu. **Save adventure** writes one browser-local slot; **Save and quit** returns to the title screen only after the write completes. Saving is manual, not automatic. **Continue saved adventure** restores the saved run and leaves it paused. **Export current adventure** downloads a portable JSON backup; **Import save file** restores one, with confirmation before replacing an existing slot.

Saves contain the hero, equipment, inventory, progression RNG, quest sets, shop, current position, return destinations, elapsed time, and all visited regions. Region snapshots retain collision and exploration grids, doors, switches, chests, dropped loot, wildlife, enemy health and AI state, projectiles, combat clocks, event timers, colossal defeats, and wilderness pack state. Shared references and typed arrays are preserved. Presentation chunks and terrain hash functions are reconstructed without regenerating the adventure.

Browser storage uses IndexedDB and is specific to the site origin and browser profile. Changing server ports or opening a different hosted copy uses a different slot. Keep an exported file when moving the game. Storage failures leave the previous slot intact; exporting the in-memory run remains available. Imports can resume in memory when IndexedDB is unavailable.

Death or completing the story ends the run and removes its matching active slot. Separate legacy records retain completion/death counts, kills, active play time, discovered lore, the completion achievement, and all eight unlocked heroes. A locally recorded ended run cannot be resumed from an older backup in that browser. Legacy records are local to the browser; adventure exports do not include them. There are no permanent stat upgrades.

**Replay current seed** starts fresh with the same hero, seed and difficulty; it reproduces generation, not recorded player inputs. Existing restart and new-seed controls remain available. Starting a new in-memory run does not erase the saved slot until another save replaces it. Save schema 1 supports build 8.0.0; incompatible builds are rejected with the original file retained.

## Tools

Open **Development tools** from the title screen or pause menu. Each tool has its own page inside `game/tools/` and shares the game's data and generators.

- **World atlas:** Dunbarrow or Living Wilderness, seed and difficulty controls, schematic terrain/road/landmark/enemy view, collision overlay, explicit connectivity inspection, map import/export, and playable preview.
- **Dungeon architect:** Classic dungeons with 4, 9 or 16 rooms, Raider Cellar, Bone Chapel, and all three Underkeep floors. Story room graphs remain fixed. Shows doors, enemies, traps, keys, chests and exits. Supports JSON import/export and playable preview.
- **Sprite library:** all 111 sheets and 1,776 audited labels, text search, individual cells and coordinates, source crop details, scale, adjustable A/B timing, stone backdrop, feet collider, and optional keyboard movement preview. Only selected artwork loads. Animation/movement must be enabled by the user.
- **Encounter workshop:** choose a dungeon layout, place/remove enemies inside non-entrance rooms, normal/elite rank, difficulty and clear rewards, import/export encounter configurations, and play the formation through the real game combat module.

Generate buttons create one map at a time. Connectivity inspection runs only when explicitly clicked; it treats doors as open and does not prove quest/lock ordering. We did not run these controls during implementation.

**Explore in game** opens a separate developer run using the exported layout. Campaign travel and campaign saves are disabled there; the existing save slot and legacy remain protected. Preview clears can grant their configured gold/potions only in that preview. Return to the title menu to continue the campaign. Changing a seed or regenerating a tool map replaces unsaved tool edits; export first to keep them.

Session debug controls include collision/state overlay, invulnerability, frozen enemy decisions, outdoor fog hiding, and the existing movement-speed controls. Debug toggles reset on new or loaded adventures and are not stored in save files. Their gameplay consequences, such as loot collected while invulnerable, are ordinary run state.

## Scope and handoff

Refresh the game to load build 8.0.0. Use the existing local server or your hosted copy; ES modules and sprite loading require HTTP(S). Copy/upload the full updated `game` directory, including `src`, `tools`, existing assets, HTML and CSS. No asset sheets were replaced or regenerated. There is no ZIP delivery.

Earlier builds did not persist adventures, so there is no older disk-save migration. Balance and gameplay refinement remain deferred. The new controls and persistence are ready for your own playthrough; this is an implementation handoff, not a tested-stability claim.
