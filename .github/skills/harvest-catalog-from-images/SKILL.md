---
name: harvest-catalog-from-images
description: 'Create or update a Township card catalog JSON from ordered screenshots. Use when the user provides catalog screenshots in temp/, asks to extract card names, identify categories, or classify star, gold, and diamond cards.'
argument-hint: 'Provide ordered catalog screenshots in temp/ and identify the target catalog JSON, version, and label.'
user-invocable: true
---

# Harvest Catalog From Images

Convert an ordered set of Township card collection screenshots into the repository's catalog JSON format.

## Repository Context

- Screenshot input directory: `temp/`
- Catalog files: `src/data/catalog/*.json`
- Catalog schema: `src/types/catalog.ts`
- Each catalog has `version`, `label`, and ordered `categories`.
- Each category has exactly the cards visible in its screenshot, in reading order.
- Supported rarities are `one_star`, `two_star`, `three_star`, `four_star`, `five_star`, `gold`, and `diamond`.

## Procedure

1. Inspect `temp/` and sort image files by their filename/order. Confirm the expected image count before transcription.
2. Read the screenshots in order. Treat the visible set/category title as the category name, not the filename.
3. For each screenshot, make a scratch table before editing the JSON. Record all ten card slots in reading order: top row left to right, then bottom row left to right. For every slot record the card name, visible star count, frame color, and resulting rarity. Include unrevealed cards whose names and stars are visible on the card backs.
4. Determine rarity per card from both the star count and the frame, never from its position in the row or from another card:
   - Blue/silver frame with one, two, three, four, or five stars: `one_star`, `two_star`, `three_star`, `four_star`, or `five_star`.
   - Gold outer frame: `gold`, regardless of whether it displays three, four, or five stars.
   - Purple outer frame in the dedicated final diamond screenshot: `diamond`.
   - A five-star card with a normal blue/silver frame is `five_star`, not `gold` or `diamond`.
   - A gold card is identified by its gold outer frame, not merely because it appears in the bottom row, has many stars, or is near the end of a set. For example, if a set has ordinary four/five-star cards followed by gold-framed cards, keep the ordinary cards as `four_star`/`five_star` and mark only the gold-framed cards as `gold`.
5. Perform a second pass against the scratch table before writing: zoom or crop crowded star/frame areas as needed, check every rarity against the image, and specifically review transitions between ordinary five-star, gold, and diamond cards.
6. Treat the dedicated diamond screenshot at the end as a supplemental rarity mapping. Its cards belong to the categories identified in that screenshot or by matching names to the preceding category screenshots; do not create a new category solely because the diamond cards are shown separately.
7. Preserve the screenshot order for both categories and cards. Preserve displayed capitalization as normal title case, and use the existing JSON spelling where a name is unambiguous.
8. Create the target catalog JSON if it does not exist, or update only the requested catalog if it already exists. Keep its `version` and `label` unchanged unless the user specifies new values.
9. Register a new catalog version in `src/lib/catalog.ts` when creating a new catalog: add its import, add it to `CATALOG_FILES`, and update `CURRENT_CATALOG_VERSION` if the user intends it to be active.
10. Validate the JSON and run the project's available typecheck/build command. Report any visual ambiguities instead of silently guessing.

## Important Rarity Rules

Do not derive rarity from star count alone, but also do not use gold as a catch-all for high-star cards. Read the star count and frame independently for every card. Gold-framed cards are `gold`, even when they have the same number of stars as ordinary cards; ordinary blue/silver five-star cards remain `five_star`. Diamond cards are `diamond` only when they appear in the dedicated purple-border diamond screenshot or are explicitly identified as diamond by the user.

Gold and diamond cards are unsendable in this application, so their exact classification affects application behavior.

## Output Checklist

Before finishing, verify:

- Every expected screenshot was processed in order.
- Every category contains ten cards unless the screenshots clearly show a different layout.
- Category and card names are not accidentally copied from UI labels such as `New`, reward counts, or set counters.
- Each card's rarity was checked against both its star count and frame color in the source image.
- Ordinary five-star cards were not accidentally converted to `gold`.
- Gold cards use `gold` and diamond cards use `diamond`.
- No temporary placeholders such as `TBD` were introduced.
- The target JSON parses and the app imports the selected catalog successfully.
