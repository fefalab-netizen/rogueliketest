# Milestone 7.5 — The Living Wilderness

Implemented in the existing game directory. No uploads, ZIPs, tests, simulations, benchmarks, compilation, or browser playthroughs were performed.

## Included

- Optional expedition: Volcanic Wastes, Deep Jungle, Frozen Peaks, Drowned Coast. A safe central Outpost, connected winding trails, region-specific terrain, guarded supplies, hazardous off-road ground, and discovery messages.
- Iona's caravan on the east side of Dunbarrow camp: explicit confirmation, 40 gold first outward journey, 20 thereafter, free returns. Artwork must load before payment. Returning preserves the expedition.
- Four remote colossal encounters: Juggernaut, Matron, Tyrant, Admiral. Different marked attacks, long recovery windows, limited territory, and one-time named legendary rewards.
- Three seeded legendary events per adventure: timed, persistent, one-attempt. At most two unresolved entrances simultaneously. Timers use active game time. Entry and abandoning a one-attempt dungeon require confirmation. Guardian rewards are earned once.
- Wildlife with shared A/B animation registration: wander, flee, defend territory, hunt prey, scavenge remains. Nearby simulation is throttled; no wildlife loot or XP.
- Explorer, Adventurer, Veteran, Nightmare. Damage, HP, encounter budgets, coordination, elite frequency and environmental pressure differ; difficulty is fixed for the run.
- Normal kills: 60% chance of 1–3 gold, 6% potion chance, independent 1.7% common / 0.6% uncommon / 0.1% rare equipment rolls. No guaranteed first-kill weapon, normal epic, or normal legendary drops. Campaign boss rewards remain guaranteed.
- Equipment styles trade power, haste, reach, stagger, chill, mobility and defense. Legendary is rarity 4; earlier rarity IDs remain stable. Shops retain one-time stock and resale below purchase prices.
- 22px equipment drops replace 18px icons and square outlines. Rarity glows, separate coin/potion visuals, unchanged pickup range.
- Winding Dunbarrow roads, clustered vegetation, irregular clearings, varied stone flooring, architectural wall details, actual open/closed doors and Sheet 102 stairs.
- Bounded runtime route, arrival, monster-clearance and dungeon-link repairs. F4 still changes walking speed only.

## Assets and delivery

111 sheets / 1,776 physical cells are registered. Sheets 101–111 and the updated label inventory were copied successfully from the supplied local directory; there were no missing files in that copy operation. Existing sheet IDs remain unchanged. New mappings follow the supplied labels. Animation and appearance review are left to the player.

Core sheets load at startup; expedition and campaign dungeon groups load on demand. Original alpha and adjacent frame-pair registration are retained. The game never requests all 111 sheets together.

Upload the contents of the existing game folder as before. Browser asset/module version is 7.5. No new package or build step is required.

## For your playthrough

1. Choose a hero and difficulty. Follow Aldric's original campaign; compare movement, doors and stairs.
2. Earn 40 gold from campaign rewards or supply chests. Find Iona east of the campfire. Cancel once, then confirm the fare. Try a free return and a 20-gold revisit.
3. Follow Outpost trails into the four regions. Check animal frame orientation, terrain readability, retreat routes and hazard warnings.
4. Approach the remote colossal territories. Check attack visibility and whether escape feels fair. Rewards and deaths should persist when revisiting.
5. Watch for the region-specific legendary announcements. Check the three entry rules and whether dungeon rewards require effort.
6. Report balance, animation or interaction problems you notice. Runtime behavior and performance have not been verified here.

## Scope limits

This is an implementation handoff, not a claim of tested stability. Wildlife uses the supplied two-frame idle pairs while roaming; no new directional animations were generated. Legendary rooms reuse the existing dungeon architecture. Deep water blocks movement; there is no swimming system. State persists during the current adventure only. Disk saves and Milestone 8 tools remain deferred.
