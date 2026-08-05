# Knowledge Registry

## Purpose

`KnowledgeRegistry` is the central, append-only catalog for government laws,
regulations, circulars, manuals, templates, FAQs, and datasets. It provides a common
validated contract and immutable read boundary for every GovPrompt module.

## Knowledge contract and identity

Each entry has a stable `id`, `type`, `title`, and either inline `content` or an
external `reference`. Metadata records source, authority, version, effective date,
category, tags, language, and confidence from zero to one.

Two duplicate guards apply:

- the same `id` and `version` cannot be registered twice;
- the same type, authority, source, and version cannot be registered under another ID.

New versions are appended instead of replacing prior knowledge. `getKnowledge(id)`
returns the version with the latest effective date, while an explicit version and
`getVersionHistory(id)` support reproducible historical decisions.

## Search

`search(query, filters)` performs deterministic Unicode-aware token matching over
titles, types, sources, authorities, categories, and tags. Results are ranked by
text score, source confidence, and effective date. Filters support type, category,
tags, language, authority, and minimum confidence. Returned entries are deep clones
and include a computed `searchScore`.

## Context integration

Runtime registration records `knowledge.registered`; searches record
`knowledge.searched` with the query and result count. Both events use
ContextManager's shared transaction history, so observability can follow knowledge
use across module switches.

```js
registerKnowledge({
  id: "procurement-act",
  type: "law",
  title: "Public Procurement Act",
  reference: "https://knowledge.example/act",
  metadata: {
    source: "Royal Gazette",
    authority: "Parliament",
    version: "2025",
    effectiveDate: "2025-01-01",
    category: "procurement",
    tags: ["procurement", "budget"],
    language: "th",
    confidence: 0.98,
  },
});

const results = searchKnowledge("procurement", { type: "law", minConfidence: 0.9 });
```

Legacy `register()` and `get()` aliases remain available for gradual migration.
