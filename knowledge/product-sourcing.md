---
type: Document
title: Sourcing Product Data the Right Way
description: How to get accurate, current, and properly licensed Amazon product images, prices, and details for your affiliate content.
status: stable
generated: { by: "process:claude-code", at: 2026-09-21T00:00:00Z }
sources:
  - id: amazon-associates-operating-agreement
    title: Amazon Associates Program Operating Agreement
    resource: "https://affiliate-program.amazon.com/help/operating/agreement"
ksor:
  audience: [public]
  approval: { by: "human:you", at: 2026-09-21T00:00:00Z }
---

Picking a good product to promote is only half the job — you then need its
image, price, and details on your own page, kept accurate and licensed
correctly. Getting this step wrong is how affiliates end up with broken
images, stale prices, and the kind of copied content that gets a site
penalized rather than ranked.

## Where Product Data Comes From

- **SiteStripe**: the toolbar Amazon Associates gives approved members
  while they browse Amazon itself — it generates an affiliate link, and
  grabs the product's official image and text, directly from the live
  product page. This is the simplest way to source a single product
  correctly, and it's Amazon's own intended workflow for it.
- **The Product Advertising API (PA-API)**: a programmatic feed of prices,
  images, titles, and availability, meant for sourcing many products at
  once or keeping a large site's listings updated automatically. Access is
  gated — an account needs an approved Associates status and a qualifying
  level of recent sales activity before Amazon grants API access.
- **Manual copy**: opening a product page and copying the price, title, and
  description by hand. The simplest option with no tooling required, and
  also the one most likely to go stale, since nothing reminds you to check
  it again.

## Image and Content Licensing Rules

Only use Amazon's own product images, and only through one of the two
approved methods above — SiteStripe or the PA-API. The Operating Agreement
governs what an Associate may and may not do with Amazon's content, and
pulling images from a third-party site, a competitor's page, or a general
image search is outside that license, whatever the image actually
shows.[^amazon-associates-operating-agreement]

- **Don't hotlink or screenshot from unrelated sites.** An image that
  happens to show the right product but didn't come from Amazon's own
  approved tools isn't licensed for your use, even if it's technically
  accurate.
- **Don't alter product images** beyond simple resizing — adding your own
  text, logos, or edits to an Amazon product photo goes beyond what the
  license covers.

## Keeping Data Fresh

A price or availability status sourced once and never rechecked rots
quietly: the product goes out of stock, the price rises or falls, or the
listing is discontinued, and the page keeps confidently showing the old
information to every visitor.

- **Recheck high-traffic pages more often.** A page bringing in real clicks
  is worth a monthly (or more frequent) spot-check; a low-traffic page can
  go longer between checks.
- **Recheck automatically where you can.** A PA-API-backed page can pull
  current data on every load or on a schedule — this is the main reason
  larger sites invest in API access rather than manual updates.
- **Watch for discontinued products specifically.** A dead product page is
  worse than a slightly stale price — it sends a paying visitor to a dead
  end.

## Red Flags to Avoid

- **Scraping third-party sites for Amazon images or copy** instead of
  using SiteStripe or the PA-API — outside the license, and often lower
  quality besides.
- **Promoting a product whose listing has changed materially** — a
  different variant, a big price jump, or a discontinued status — without
  updating your own page to match.
- **Copying another affiliate's review text or listing copy.** Beyond the
  plagiarism problem, duplicate content is exactly what search engines and
  Amazon itself scrutinize a thin affiliate site for.
