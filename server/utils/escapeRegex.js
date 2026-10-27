// Makes user text safe to use inside a search pattern, so typing "(" or ".*"
// is treated as plain text and cannot break or slow down the search.
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
