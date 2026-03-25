/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!**************************!*\
  !*** ./content/gmail.ts ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
const GMAIL_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const PROCESSED_ATTR = 'data-cursive-processed';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
function gmailCacheKey(email) {
    return `cursive_gmail_${email.toLowerCase().trim()}`;
}
async function getGmailCache(email) {
    return new Promise((resolve) => {
        const key = gmailCacheKey(email);
        chrome.storage.local.get(key, (result) => {
            const entry = result[key];
            if (!entry) {
                resolve(null);
                return;
            }
            if (Date.now() - entry.timestamp > GMAIL_CACHE_TTL_MS) {
                chrome.storage.local.remove(key);
                resolve(null);
                return;
            }
            resolve(entry);
        });
    });
}
async function setGmailCache(email, update) {
    return new Promise((resolve) => {
        const key = gmailCacheKey(email);
        chrome.storage.local.get(key, (result) => {
            const existing = result[key] || { timestamp: Date.now() };
            const merged = {
                ...existing,
                ...update,
                timestamp: Date.now(),
            };
            chrome.storage.local.set({ [key]: merged }, resolve);
        });
    });
}
// ---------------------------------------------------------------------------
// Email Extraction
// ---------------------------------------------------------------------------
function extractEmailFromReadView(container) {
    // Strategy 1: span[email] attribute (most reliable)
    const emailSpan = container.querySelector('span[email]');
    if (emailSpan) {
        const email = emailSpan.getAttribute('email');
        if (email && EMAIL_REGEX.test(email))
            return email.toLowerCase().trim();
    }
    // Strategy 2: data-hovercard-id (often contains email)
    const hovercardEl = container.querySelector('[data-hovercard-id]');
    if (hovercardEl) {
        const hcid = hovercardEl.getAttribute('data-hovercard-id');
        if (hcid && EMAIL_REGEX.test(hcid))
            return hcid.toLowerCase().trim();
    }
    // Strategy 3: Parse from visible text with angle brackets pattern
    const headerText = container.textContent || '';
    const angleMatch = headerText.match(/<([^\s@]+@[^\s@]+\.[^\s@>]+)>/);
    if (angleMatch)
        return angleMatch[1].toLowerCase().trim();
    return null;
}
function extractEmailFromComposeView() {
    // Strategy 1: input[name="to"]
    const toInput = document.querySelector('input[name="to"]');
    if (toInput?.value && EMAIL_REGEX.test(toInput.value.trim())) {
        return toInput.value.trim().toLowerCase();
    }
    // Strategy 2: Composed recipient chips with data-hovercard-id
    const chips = document.querySelectorAll('[data-hovercard-id]');
    for (const chip of chips) {
        const email = chip.getAttribute('data-hovercard-id');
        if (email && EMAIL_REGEX.test(email))
            return email.toLowerCase().trim();
    }
    // Strategy 3: Recipient container spans with email attribute
    const recipientSpans = document.querySelectorAll('.wO.nr span[email], .afp span[email]');
    for (const span of recipientSpans) {
        const email = span.getAttribute('email');
        if (email && EMAIL_REGEX.test(email))
            return email.toLowerCase().trim();
    }
    return null;
}
// ---------------------------------------------------------------------------
// Badge Rendering
// ---------------------------------------------------------------------------
function createBadge(email, status) {
    const badge = document.createElement('span');
    badge.className = `cursive-email-badge cursive-email-badge--${status}`;
    badge.setAttribute('data-cursive-email', email);
    badge.setAttribute('title', getBadgeTitle(status));
    badge.innerHTML = getBadgeIcon(status);
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleBadgeClick(email, badge);
    });
    return badge;
}
function getBadgeIcon(status) {
    switch (status) {
        case 'valid':
            return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        case 'catch-all':
            return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        case 'invalid':
            return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        default:
            return `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    }
}
function getBadgeTitle(status) {
    const map = {
        valid: 'Verified email',
        'catch-all': 'Catch-all domain',
        invalid: 'Invalid email',
        checking: 'Verifying...',
    };
    return map[status] || 'Unknown status';
}
function updateBadge(email, status) {
    const badges = document.querySelectorAll(`[data-cursive-email="${CSS.escape(email)}"]`);
    badges.forEach((badge) => {
        badge.className = `cursive-email-badge cursive-email-badge--${status}`;
        badge.setAttribute('title', getBadgeTitle(status));
        badge.innerHTML = getBadgeIcon(status);
        // Re-attach click handler
        const newBadge = badge.cloneNode(true);
        badge.replaceWith(newBadge);
        newBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleBadgeClick(email, newBadge);
        });
    });
}
// ---------------------------------------------------------------------------
// Enrichment Card
// ---------------------------------------------------------------------------
function createEnrichmentCard(data, anchor) {
    removeEnrichmentCard();
    const card = document.createElement('div');
    card.className = 'cursive-email-card';
    const statusColor = getEmailStatusColor(data.email_status);
    card.innerHTML = `
    <div class="cursive-card-header">
      <div class="cursive-card-name">${escapeHtml(data.first_name)} ${escapeHtml(data.last_name)}</div>
      <button class="cursive-card-close" aria-label="Close">&times;</button>
    </div>
    <div class="cursive-card-body">
      <div class="cursive-card-row">
        <span class="cursive-card-label">Title</span>
        <span class="cursive-card-value">${data.title ? escapeHtml(data.title) : 'N/A'}</span>
      </div>
      <div class="cursive-card-row">
        <span class="cursive-card-label">Company</span>
        <span class="cursive-card-value">${data.company ? escapeHtml(data.company) : 'N/A'}</span>
      </div>
      <div class="cursive-card-row">
        <span class="cursive-card-label">Email</span>
        <span class="cursive-card-value">
          <span class="cursive-badge-inline" style="background:${statusColor}"></span>
          ${escapeHtml(data.email)}
        </span>
      </div>
      <div class="cursive-card-row">
        <span class="cursive-card-label">Phone</span>
        <span class="cursive-card-value">${data.phone ? escapeHtml(data.phone) : 'N/A'}</span>
      </div>
      <div class="cursive-card-row">
        <span class="cursive-card-label">Industry</span>
        <span class="cursive-card-value">${data.industry ? escapeHtml(data.industry) : 'N/A'}</span>
      </div>
    </div>
  `;
    const closeBtn = card.querySelector('.cursive-card-close');
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeEnrichmentCard();
    });
    // Position card near the badge
    const rect = anchor.getBoundingClientRect();
    card.style.top = `${rect.bottom + window.scrollY + 8}px`;
    card.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 300)}px`;
    document.body.appendChild(card);
    // Close card when clicking outside
    const outsideHandler = (e) => {
        if (!card.contains(e.target) && e.target !== anchor) {
            removeEnrichmentCard();
            document.removeEventListener('click', outsideHandler, true);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', outsideHandler, true);
    }, 0);
}
function createLoadingCard(anchor) {
    removeEnrichmentCard();
    const card = document.createElement('div');
    card.className = 'cursive-email-card';
    card.innerHTML = `
    <div class="cursive-card-body cursive-card-loading">
      <div class="cursive-gmail-spinner"></div>
      <span>Loading enrichment...</span>
    </div>
  `;
    const rect = anchor.getBoundingClientRect();
    card.style.top = `${rect.bottom + window.scrollY + 8}px`;
    card.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 300)}px`;
    document.body.appendChild(card);
}
function removeEnrichmentCard() {
    const existing = document.querySelector('.cursive-email-card');
    if (existing)
        existing.remove();
}
// ---------------------------------------------------------------------------
// Verification Flow
// ---------------------------------------------------------------------------
async function verifyAndBadge(email, anchorEl) {
    if (anchorEl.querySelector(`[data-cursive-email="${CSS.escape(email)}"]`))
        return;
    // Check cache first
    const cached = await getGmailCache(email);
    if (cached?.verify) {
        const badge = createBadge(email, cached.verify.status);
        anchorEl.style.position = 'relative';
        anchorEl.appendChild(badge);
        return;
    }
    // Show "checking" badge
    const badge = createBadge(email, 'checking');
    anchorEl.style.position = 'relative';
    anchorEl.appendChild(badge);
    chrome.runtime.sendMessage({ type: 'VERIFY_EMAIL', data: { email } }, async (response) => {
        if (chrome.runtime.lastError)
            return;
        if (response?.data) {
            const verify = response.data;
            await setGmailCache(email, { verify });
            updateBadge(email, verify.status);
        }
    });
}
async function handleBadgeClick(email, badge) {
    // Check if enrichment is already cached
    const cached = await getGmailCache(email);
    if (cached?.enrichment) {
        createEnrichmentCard(cached.enrichment, badge);
        return;
    }
    createLoadingCard(badge);
    chrome.runtime.sendMessage({ type: 'LOOKUP', data: { email } }, async (response) => {
        if (chrome.runtime.lastError) {
            removeEnrichmentCard();
            return;
        }
        if (response?.data) {
            const enrichment = response.data;
            await setGmailCache(email, { enrichment });
            createEnrichmentCard(enrichment, badge);
        }
        else {
            removeEnrichmentCard();
        }
    });
}
// ---------------------------------------------------------------------------
// DOM Scanning
// ---------------------------------------------------------------------------
function scanReadEmails() {
    // Scan email headers in thread view for sender email addresses
    // Gmail uses various containers — we try multiple strategies
    // Strategy 1: Elements with `email` attribute
    const emailSpans = document.querySelectorAll(`span[email]:not([${PROCESSED_ATTR}])`);
    emailSpans.forEach((span) => {
        const email = span.getAttribute('email');
        if (!email || !EMAIL_REGEX.test(email))
            return;
        span.setAttribute(PROCESSED_ATTR, 'true');
        verifyAndBadge(email.toLowerCase().trim(), span);
    });
    // Strategy 2: Elements with data-hovercard-id containing email
    const hovercardEls = document.querySelectorAll(`[data-hovercard-id]:not([${PROCESSED_ATTR}])`);
    hovercardEls.forEach((el) => {
        const hcid = el.getAttribute('data-hovercard-id');
        if (!hcid || !EMAIL_REGEX.test(hcid))
            return;
        el.setAttribute(PROCESSED_ATTR, 'true');
        verifyAndBadge(hcid.toLowerCase().trim(), el);
    });
}
function scanComposeEmails() {
    const email = extractEmailFromComposeView();
    if (!email)
        return;
    // Find the compose container and badge it
    const composeContainers = document.querySelectorAll('.wO.nr, .afp');
    composeContainers.forEach((container) => {
        if (container.getAttribute(PROCESSED_ATTR) === email)
            return;
        // Look for the chip or input that holds the email
        const chip = container.querySelector('span[email], [data-hovercard-id]');
        if (chip && !chip.querySelector(`[data-cursive-email="${CSS.escape(email)}"]`)) {
            container.setAttribute(PROCESSED_ATTR, email);
            verifyAndBadge(email, chip);
        }
    });
}
function scanAll() {
    scanReadEmails();
    scanComposeEmails();
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
function getEmailStatusColor(status) {
    const map = {
        valid: '#22c55e',
        'catch-all': '#eab308',
        invalid: '#ef4444',
        unknown: '#9ca3af',
    };
    return map[status] || map.unknown;
}
// ---------------------------------------------------------------------------
// MutationObserver — detect DOM changes
// ---------------------------------------------------------------------------
function observeGmailDom() {
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scanAll, 300);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
    // Initial scan after a brief delay to let Gmail render
    setTimeout(scanAll, 1500);
    observeGmailDom();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}


/******/ })()
;
//# sourceMappingURL=gmail.js.map