/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./background/api-client.ts"
/*!**********************************!*\
  !*** ./background/api-client.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getCredits: () => (/* binding */ getCredits),
/* harmony export */   lookupCompany: () => (/* binding */ lookupCompany),
/* harmony export */   lookupPerson: () => (/* binding */ lookupPerson),
/* harmony export */   saveLead: () => (/* binding */ saveLead),
/* harmony export */   verifyEmail: () => (/* binding */ verifyEmail)
/* harmony export */ });
/* harmony import */ var _shared_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
// Cursive API Client for Chrome Extension
// All API calls go through this module

async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(_shared_constants__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY_API, (result) => {
            resolve(result[_shared_constants__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEY_API] || null);
        });
    });
}
async function apiCall(endpoint, method = 'POST', body) {
    const apiKey = await getApiKey();
    if (!apiKey) {
        return { success: false, error: 'No API key configured. Open extension settings to add your Cursive API key.' };
    }
    try {
        const options = {
            method,
            headers: {
                'x-cursive-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        };
        if (body && method === 'POST') {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${_shared_constants__WEBPACK_IMPORTED_MODULE_0__.API_BASE}${endpoint}`, options);
        if (response.status === 401) {
            return { success: false, error: 'Invalid API key. Check your settings.' };
        }
        if (response.status === 402) {
            return { success: false, error: 'Insufficient credits. Purchase more at leads.meetcursive.com.' };
        }
        if (response.status === 403) {
            return { success: false, error: 'API key missing required permissions.' };
        }
        if (response.status === 429) {
            return { success: false, error: 'Rate limit reached. Please wait a moment.' };
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { success: false, error: err.error || `HTTP ${response.status}` };
        }
        const result = await response.json();
        return { success: true, data: result.data };
    }
    catch (error) {
        return { success: false, error: 'Network error. Check your connection.' };
    }
}
// --- Public API ---
async function lookupPerson(params) {
    return apiCall('/lookup', 'POST', params);
}
async function lookupCompany(domain) {
    return apiCall('/company', 'POST', { domain });
}
async function verifyEmail(email) {
    return apiCall('/verify-email', 'POST', { email });
}
async function saveLead(data) {
    return apiCall('/save-lead', 'POST', data);
}
async function getCredits() {
    return apiCall('/credits', 'GET');
}


/***/ },

/***/ "./shared/constants.ts"
/*!*****************************!*\
  !*** ./shared/constants.ts ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   API_BASE: () => (/* binding */ API_BASE),
/* harmony export */   CACHE_PREFIX: () => (/* binding */ CACHE_PREFIX),
/* harmony export */   CACHE_TTL_MS: () => (/* binding */ CACHE_TTL_MS),
/* harmony export */   STORAGE_KEY_API: () => (/* binding */ STORAGE_KEY_API)
/* harmony export */ });
// Extension constants
const API_BASE = 'https://leads.meetcursive.com/api/ext';
const STORAGE_KEY_API = 'cursive_api_key';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'cursive_cache_';


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./background/service-worker.ts ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _api_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api-client */ "./background/api-client.ts");
/* harmony import */ var _shared_constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
// Cursive Chrome Extension — Background Service Worker
// Handles all API communication, caching, context menus, and messaging


// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------
async function getCached(key) {
    return new Promise((resolve) => {
        const cacheKey = `${_shared_constants__WEBPACK_IMPORTED_MODULE_1__.CACHE_PREFIX}${key}`;
        chrome.storage.local.get(cacheKey, (result) => {
            const cached = result[cacheKey];
            if (!cached)
                return resolve(null);
            if (Date.now() - cached.timestamp > _shared_constants__WEBPACK_IMPORTED_MODULE_1__.CACHE_TTL_MS) {
                chrome.storage.local.remove(cacheKey);
                return resolve(null);
            }
            resolve(cached.data);
        });
    });
}
async function setCache(key, data) {
    const cacheKey = `${_shared_constants__WEBPACK_IMPORTED_MODULE_1__.CACHE_PREFIX}${key}`;
    return new Promise((resolve) => {
        chrome.storage.local.set({
            [cacheKey]: { data, timestamp: Date.now() },
        }, resolve);
    });
}
// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'cursive-find-email',
        title: 'Find email with Cursive',
        contexts: ['selection'],
    });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== 'cursive-find-email' || !info.selectionText)
        return;
    const selectedText = info.selectionText.trim();
    const parts = selectedText.split(/\s+/);
    if (parts.length < 2) {
        // Not enough for a name
        return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    // Try to get domain from the current page
    let domain;
    if (tab?.url) {
        try {
            const url = new URL(tab.url);
            if (!url.hostname.includes('google') && !url.hostname.includes('linkedin')) {
                domain = url.hostname.replace(/^www\./, '');
            }
        }
        catch {
            // Invalid URL
        }
    }
    const result = await (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.lookupPerson)({ first_name: firstName, last_name: lastName, domain });
    // Send result to the content script
    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: 'LOOKUP_RESULT',
            data: result,
        });
    }
});
// ---------------------------------------------------------------------------
// Message handler (content scripts <-> background)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse);
    return true; // Keep the message channel open for async response
});
async function handleMessage(message) {
    switch (message.type) {
        case 'LOOKUP': {
            const cacheKey = `lookup_${message.data.first_name}_${message.data.last_name}_${message.data.company || ''}`;
            const cached = await getCached(cacheKey);
            if (cached)
                return { success: true, data: cached };
            const result = await (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.lookupPerson)(message.data);
            if (result.success) {
                await setCache(cacheKey, result.data);
            }
            return result;
        }
        case 'LOOKUP_BY_EMAIL': {
            const cacheKey = `email_${message.data.email}`;
            const cached = await getCached(cacheKey);
            if (cached)
                return { success: true, data: cached };
            // Extract name from email for lookup
            const localPart = message.data.email.split('@')[0];
            const domain = message.data.email.split('@')[1];
            const nameParts = localPart.replace(/[._-]/g, ' ').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            const result = await (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.lookupPerson)({ first_name: firstName, last_name: lastName, domain });
            if (result.success) {
                await setCache(cacheKey, result.data);
            }
            return result;
        }
        case 'COMPANY': {
            const cacheKey = `company_${message.data.domain}`;
            const cached = await getCached(cacheKey);
            if (cached)
                return { success: true, data: cached };
            const result = await (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.lookupCompany)(message.data.domain);
            if (result.success) {
                await setCache(cacheKey, result.data);
            }
            return result;
        }
        case 'VERIFY_EMAIL': {
            const cacheKey = `verify_${message.data.email}`;
            const cached = await getCached(cacheKey);
            if (cached)
                return { success: true, data: cached };
            const result = await (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.verifyEmail)(message.data.email);
            if (result.success) {
                await setCache(cacheKey, result.data);
            }
            return result;
        }
        case 'SAVE_LEAD': {
            return (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.saveLead)(message.data);
        }
        case 'GET_CREDITS': {
            return (0,_api_client__WEBPACK_IMPORTED_MODULE_0__.getCredits)();
        }
        case 'GET_CACHED': {
            const cached = await getCached(message.data.key);
            if (cached)
                return { success: true, data: cached };
            return { success: false, error: 'Not cached' };
        }
        default:
            return { success: false, error: 'Unknown message type' };
    }
}

})();

/******/ })()
;
//# sourceMappingURL=service-worker.js.map