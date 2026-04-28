/**
 * GHL CustomJS widget — script source.
 *
 * Served as application/javascript directly. The agency installs this URL
 * in their GHL CustomJS module (one-time, agency-level). Inside the GHL
 * dashboard the script:
 *   1. Reads the location's `identity_pixel_id` Custom Value
 *   2. Fetches /api/integrations/ghl-app/widget-data
 *   3. Renders a small floating card with visitor counts + Open Cursive btn
 *
 * Constraints (per GHL marketplace review):
 *   - No obfuscated code
 *   - No external file loads beyond this single source
 *   - Self-contained
 *   - Uses AppUtils.Utilities.getCurrentLocation() for context
 *
 * Cached aggressively — widget code rarely changes.
 */

export const runtime = 'edge'

const WIDGET_JS = `(function () {
  'use strict';

  var BASE = '${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com'}'.replace(/\\/$/, '');
  var WIDGET_ID = 'cursive-ghl-widget';

  function getPixelIdFromCustomValues() {
    // GHL's AppUtils exposes location custom values via JS; for v1 we read
    // from a known DOM node the agency placed (or via window.cursivePixelId
    // set in CustomJS settings).
    if (typeof window === 'undefined') return null;
    if (window.cursivePixelId) return window.cursivePixelId;
    // Fallback: read from a meta tag the agency may add
    var meta = document.querySelector('meta[name="cursive-pixel-id"]');
    if (meta) return meta.getAttribute('content');
    return null;
  }

  function fmt(n) {
    if (typeof n !== 'number') return '0';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\\.0$/, '') + 'k';
    return String(n);
  }

  function statusBadge(status) {
    var map = {
      not_deployed: ['Setup needed', '#9CA3AF'],
      pending: ['Awaiting first event', '#F59E0B'],
      active: ['Live', '#10B981'],
      manual_required: ['Re-embed needed', '#F97316'],
      error: ['Error', '#EF4444']
    };
    var entry = map[status] || map.not_deployed;
    return '<span style="padding:2px 8px;border-radius:9999px;background:' + entry[1] + ';color:#fff;font-size:11px;">' + entry[0] + '</span>';
  }

  function render(data) {
    var existing = document.getElementById(WIDGET_ID);
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.id = WIDGET_ID;
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;width:300px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.08);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;z-index:9999;overflow:hidden;';

    if (!data) {
      container.innerHTML = '<div style="padding:16px;font-size:13px;color:#6B7280;">Cursive widget — install the pixel to enable visitor identification.</div>';
      document.body.appendChild(container);
      return;
    }

    var html = '';
    html += '<div style="padding:14px 16px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;justify-content:space-between;">';
    html += '  <div style="font-weight:600;color:#111827;font-size:14px;">Cursive</div>';
    html += '  ' + statusBadge(data.pixel_status);
    html += '</div>';
    html += '<div style="padding:14px 16px;">';
    html += '  <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Identified visitors</div>';
    html += '  <div style="display:flex;justify-content:space-between;margin-bottom:12px;">';
    html += '    <div><div style="font-size:18px;font-weight:600;color:#111827;">' + fmt(data.visitors.last_24h) + '</div><div style="font-size:11px;color:#9CA3AF;">24h</div></div>';
    html += '    <div><div style="font-size:18px;font-weight:600;color:#111827;">' + fmt(data.visitors.last_7d) + '</div><div style="font-size:11px;color:#9CA3AF;">7d</div></div>';
    html += '    <div><div style="font-size:18px;font-weight:600;color:#111827;">' + fmt(data.visitors.last_30d) + '</div><div style="font-size:11px;color:#9CA3AF;">30d</div></div>';
    html += '  </div>';
    html += '  <div style="font-size:12px;color:#374151;">';
    html += '    <div style="margin-bottom:4px;">High intent (7d): <strong>' + fmt(data.high_intent_7d) + '</strong></div>';
    if (data.sync_enabled) {
      html += '    <div style="color:#6B7280;">Synced ' + fmt(data.synced_count) + ' contacts to GHL</div>';
    }
    html += '  </div>';
    html += '  <a href="' + BASE + '/dashboard" target="_blank" style="display:block;margin-top:12px;padding:8px 12px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;text-align:center;font-weight:500;">Open Cursive Portal →</a>';
    html += '</div>';

    container.innerHTML = html;
    document.body.appendChild(container);
  }

  function init() {
    var pixelId = getPixelIdFromCustomValues();
    if (!pixelId) {
      render(null);
      return;
    }
    fetch(BASE + '/api/integrations/ghl-app/widget-data?pixel_id=' + encodeURIComponent(pixelId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.error) {
          render(null);
        } else {
          render(data);
        }
      })
      .catch(function () { render(null); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render on GHL route change (their Vue dashboard fires routeChangeEvent)
  window.addEventListener('routeChangeEvent', function () { setTimeout(init, 500); });
})();`

export async function GET() {
  return new Response(WIDGET_JS, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600', // 5min browser, 1h CDN
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
