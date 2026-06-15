# SSOT Contracts

This directory is the maintenance entry point for Noxionite feature contracts.
Each document names the source of truth, required invariants, and the minimum
verification expected before changing that feature.

Use these files before broad code searches when working on:

- Notion content ingestion and cache behavior
- Routing, locales, and canonical URLs
- SEO metadata, Open Graph, robots, sitemap, and feed output
- Social image generation
- Vercel deployment and dependency policy

When a feature behavior changes, update the matching contract in the same
change set.
