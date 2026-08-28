-- Store the buyer's detected (or self-selected) site platform on the funnel
-- order, so the portal can show install steps for THEIR stack instead of a
-- generic "paste before </head>".
--
-- Nullable by design: null means "not determined yet", which the portal renders
-- as the platform picker. We never block the funnel on knowing this.

alter table funnel_orders
  add column if not exists pixel_platform text;

comment on column funnel_orders.pixel_platform is
  'Site platform for install instructions (shopify|wordpress|webflow|squarespace|wix|bigcommerce|drupal|hubspot|framer|gtm|nextjs|other). Auto-detected from response headers + homepage HTML at pixel creation; buyer can override in the portal. NULL = undetermined, portal shows the picker.';
