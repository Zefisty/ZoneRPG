# ZoneRPG v7 navigation patch QA

## Automated
- Run: node tests/navigation.cjs (6 checks).
- Choices/result survive inventory, character, quests, map, More and nested panels.
- Read-only expedition map and engine travel guard preserve origin, location and encounter.
- Global Explore is blocked; encounter Continue still advances depth.
- Only More contains Save; load restores the same expedition result and inventory.
- All 29 location screens omit literal preparation JS and duplicate inventory/save CTAs.
- Combat dock routes inventory to existing combat items; panels preserve enemy and turn.
- Existing regression/polish/world-logic/expedition/audio suites: 79 checks passed.

## Browser verification — pending, patch not fully verified
HTTP server was launched on 127.0.0.1:41736. In-app browser navigation repeatedly returned ERR_CONNECTION_TIMED_OUT. Shell HTTP requests timed out too, including after network permission was granted and server was restarted. No real current-version browser scene was loaded; desktop/mobile spacing, hit testing, panel scrolling and Console are not yet verified.

When localhost is reachable, open tests/browser.html?scenario=v7-expedition, load the fixture, begin exploration, check every dock section before/after a result, inspect locked map, Continue twice, Save in More, reload and Load. Check More on desktop, mobile portrait and landscape: separated 48px targets, no horizontal overflow, dock below dialog content and clickable. Fixture uses isolated session storage, not the player's production save.

No commit or push performed. Expedition schema, content and balance remain unchanged.
