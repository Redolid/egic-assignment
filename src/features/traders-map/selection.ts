/**
 * The selected trader plus WHERE it was selected from.
 * - from the list  → the map flies to the marker and opens its popup
 * - from the map   → the marker's popup is already open; the list only highlights the item
 * A new object is created on every click, so clicking the same list item again re-centres the map.
 */
export type Selection = { id: number; source: 'list' | 'map' } | null
