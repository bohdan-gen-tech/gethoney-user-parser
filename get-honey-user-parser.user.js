// ==UserScript==
// @name         Get-Honey User Parser from LocalStorage
// @namespace    https://github.com/bohdan-gen-tech
// @version      2025.07.08.9
// @description  Shows decoded user info from localStorage persist:user on get-honey domains
// @author       Bohdan S.
// @match        https://get-honey.ai/*
// @match        https://get-honey.online/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=get-honey.ai
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bohdan-gen-tech/gethoney-user-parser/main/get-honey-user-parser.user.js
// @downloadURL  https://raw.githubusercontent.com/bohdan-gen-tech/gethoney-user-parser/main/get-honey-user-parser.user.js
// ==/UserScript==


(function () {
  'use strict';

  // --- CONFIGURATION ---
  const config = {
    storage: {
      userKey: 'persist:user',
      positionKey: 'userInfoPanelPosition',
    },
    api: {
      loginUrl: '/Authenticate/login',
      subscriptionUrl: '/Payments/admin-set-free-subscription',
      credentials: {
        email: "", // <------- ENTER EMAIL
        password: "" // <------- ENTER PASS
      },
      productIds: {
        'get-honey.ai': '1529fee5-e88b-49a9-af27-ee5f0520e2eb', //<---- Change prod product Id if it needs
        'get-honey.online': 'c7d4f153-6a27-4d92-ab63-401c33c05c82', //<---- Change stage product Id if it needs
      }
    },
    checkInterval: 1000,
    domains: ['get-honey.ai', 'get-honey.online'],
    selectors: {
      container: '#userInfoPanel',
      copyIdBtn: '[data-action="copy-id"]',
      copyIdIcon: '[data-icon="copy-id"]',
      activateBtn: '[data-action="activate-sub"]',
      clearBtn: '[data-action="clear-data"]',
      closeBtn: '[data-action="close"]',
      dragHandle: '[data-handle="drag"]',
    },
  };

  // --- STATE ---
  let lastPersistUser = null;
  let ui = {
    container: null,
    loader: null,
  };

  // --- DOM & UI ---

  /**
   * Shows a simple loading indicator.
   */
  function showLoader() {
    if (ui.container) {
      ui.container.remove();
      ui.container = null;
    }
    if (!ui.loader) {
      ui.loader = document.createElement('div');
      ui.loader.textContent = '⏳ Loading data...';
      Object.assign(ui.loader.style, {
        position: 'fixed', bottom: '20px', right: '20px', padding: '8px 12px',
        background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px',
        fontFamily: 'monospace', borderRadius: '9px', zIndex: 9999, backdropFilter: 'blur(4px)',
      });
      document.body.appendChild(ui.loader);
    }
  }

  /**
   * Removes the loading indicator.
   */
  function hideLoader() {
    if (ui.loader) {
      ui.loader.remove();
      ui.loader = null;
    }
  }

  /**
   * Renders the main user info panel.
   * @param {object} user - The user data object.
   */
  function renderPanel(user) {
    hideLoader(); // <-- Сначала скрываем загрузчик
    if (ui.container) ui.container.remove();

    const {
      id, email, utmSource, url, isTUser, userFeatures, nEnabled, activeSubscription
    } = user;

    let displayUrl = url;
    if (url && url.length > 77) {
      displayUrl = url.substring(0, 77) + '...';
    }

    const container = document.createElement('div');
    container.id = config.selectors.container.substring(1);
    Object.assign(container.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '280px',
      fontSize: '9px', background: 'rgba(0,0,0,0.5)', color: '#fff',
      padding: '3px 3px 3px', zIndex: 9999, fontFamily: 'monospace',
      backdropFilter: 'blur(5px)', borderRadius: '8px', overflow: 'hidden',
    });

    const featuresHTML = userFeatures ? `
      <div style="margin: 10px 0 6px 0;">🔧 userFeatures:</div>
      ${Object.entries(userFeatures).map(([key, value]) => `
        <div style="color: ${value === true ? 'limegreen' : (value === false ? 'crimson' : 'white')};">${key}: ${value}</div>
      `).join('')}
    ` : '';

    const subscriptionHTML = activeSubscription ? `
      <div style="margin-top: 8px">💳 subscription:</div>
      <div>priceID: ${activeSubscription.productId}</div>
      <div>startDate: ${activeSubscription.startDate}</div>
      <div>endDate: ${activeSubscription.endDate}</div>
      <div>status: ${activeSubscription.status}</div>
    ` : `
      <div style="margin-top: 8px; user-select: text;">
        <span>💳 subscription: </span>
        <button data-action="activate-sub" title="Click to activate monthly subscription" style="cursor: pointer; background-color: #444; color: #0ff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-family: monospace;">
          🫵 activate 1 month?
        </button>
      </div>
    `;

    container.innerHTML = `
      <div data-handle="drag" style="cursor: move; font-weight: bold; margin-bottom: 8px; margin-left: -2px; margin-right: -2px; margin-top: -2px; user-select: none; position: relative; background: black; padding: 4px 4px 3px; border-radius: 2px;">
        User Info Panel
        <button data-action="close" title="Close" style="position: absolute; top: 0; right: 0; border: none; background: transparent; color: #fff; font-size: 14px; cursor: pointer; padding: 0 4px;">✖</button>
      </div>
      <div>🌐 utmSource: <b style="color: ${utmSource !== '-' ? 'white' : '#888'}">${utmSource}</b></div>

      <div style="display: flex; align-items: baseline; line-height: 1.3;">
        <span style="white-space: nowrap; flex-shrink: 0;">🔗 url:&nbsp;</span>
        <b style="color: ${url !== '-' ? 'white' : '#888'}; word-break: break-all;">${displayUrl}</b>
      </div>

      <div>🧩 isTUser: <b style="color: ${isTUser === true ? 'limegreen' : isTUser === false ? 'crimson' : '#888'}">${isTUser}</b></div>
      <div style="margin: 6px 0 2px;">📩 email: ${email}</div>
      <div style="margin: 6px 0;">
        <span data-icon="copy-id">🆔 user: </span>
        <span data-action="copy-id" title="Click to copy user.id" style="color: #0ff; cursor: pointer; background-color: #444; padding: 2px 4px; border-radius: 4px; user-select: text;">
          ${id}
        </span>
      </div>
      ${subscriptionHTML}
      ${featuresHTML}
      ${user.hasOwnProperty('nEnabled') ? `<div style="margin-top: 8px; color: ${nEnabled ? 'limegreen' : 'crimson'};">🔞 nEnabled: ${nEnabled}</div>` : ''}
      <button data-action="clear-data" style="margin-top: 10px; padding: 5px 10px; border-radius: 6px; border: none; background: #333; color: #fff; cursor: pointer; font-size: 9px; width: 100%;">
        🧹 Clear site data
      </button>
    `;

    document.body.appendChild(container);
    ui.container = container;

    makeDraggable(container);
    attachEventListeners(container, user);
    applySavedPosition(container);
  }

  /**
   * Attaches event listeners to the panel's interactive elements.
   * @param {HTMLElement} container - The panel's container element.
   * @param {object} user - The user data object.
   */
  function attachEventListeners(container, user) {
    container.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      const actions = {
        'close': () => container.remove(),
        'copy-id': () => handleCopy(e.target, user.id),
        'clear-data': () => handleClearData(e.target),
        'activate-sub': () => handleSubscriptionActivation(e.target, user.id),
      };

      actions[action]?.();
    });
  }

  // --- LOGIC & HANDLERS ---

  /**
   * Handles copying text to the clipboard and provides visual feedback.
   * @param {HTMLElement} target - The element that was clicked.
   * @param {string} text - The text to copy.
   */
  async function handleCopy(target, text) {
      const icon = ui.container.querySelector(config.selectors.copyIdIcon);
      try {
          await navigator.clipboard.writeText(text);
          target.style.backgroundColor = 'limegreen';
          icon.textContent = '✅ user: ';
      } catch (err) {
          target.style.backgroundColor = 'crimson';
          icon.textContent = '❌ user: ';
          console.error("Copy failed:", err);
      } finally {
          setTimeout(() => {
              target.style.backgroundColor = '#444';
              icon.textContent = '🆔 user: ';
          }, 1000);
      }
  }

  /**
   * Handles the logic for clearing site data.
   * @param {HTMLElement} button - The clear data button element.
   */
  function handleClearData(button) {
    const origin = window.location.hostname;
    if (!config.domains.some(d => origin.includes(d))) {
        button.style.background = 'crimson';
        button.textContent = '❌ Invalid domain!';
        setTimeout(() => {
            button.style.background = '#333';
            button.textContent = '🧹 Clear site data';
        }, 1500);
        return;
    }

    try {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        button.style.background = 'limegreen';
        button.textContent = '✅ Cleared!';
    } catch (e) {
        console.error('Error clearing site data:', e);
        button.style.background = 'crimson';
        button.textContent = '❌ Error!';
    } finally {
        setTimeout(() => window.location.reload(), 800);
    }
  }

  /**
   * Handles activating a free subscription via API calls.
   * @param {HTMLElement} button - The activation button element.
   * @param {string} userId - The ID of the user to activate the subscription for.
   */
  async function handleSubscriptionActivation(button, userId) {
      button.disabled = true;
      button.textContent = '⏳ Processing...';
      button.style.backgroundColor = '#666';

      try {
          const domain = window.location.hostname.replace(/^www\./, '');
          const apiBase = `https://api.${domain}/api`;
          const productId = config.api.productIds[domain];

          if (!productId) throw new Error('Unsupported domain for activation');

          // 1. Login
          const loginResp = await fetch(apiBase + config.api.loginUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config.api.credentials),
          });
          if (!loginResp.ok) throw new Error(`admin login failed: ${loginResp.status}`);
          const { accessToken } = await loginResp.json();
          if (!accessToken) throw new Error('No accessToken received');

          // 2. Activate
          const activateResp = await fetch(apiBase + config.api.subscriptionUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ userId, productId }),
          });
          if (!activateResp.ok) throw new Error(`subscription failed: ${activateResp.status}`);

          button.style.backgroundColor = 'limegreen';
          button.style.color = 'black';
          button.textContent = '🎉 Activated! Refresh page.';

      } catch (err) {
          button.style.backgroundColor = 'crimson';
          button.style.color = 'white';
          button.textContent = `🤦‍♂️ ${err.message}`;
          console.error(err);
          setTimeout(() => {
              button.style.backgroundColor = '#444';
              button.style.color = '#0ff';
              button.textContent = '🫵 activate 1 month?';
              button.disabled = false;
          }, 5000);
      }
  }

  // --- DRAGGING & POSITIONING ---

  /**
   * Applies the saved position to the container.
   * @param {HTMLElement} container - The element to position.
   */
  function applySavedPosition(container) {
      const savedPos = localStorage.getItem(config.storage.positionKey);
      if (savedPos) {
          try {
              const pos = JSON.parse(savedPos);
              container.style.left = `${pos.left}px`;
              container.style.top = `${pos.top}px`;
              container.style.right = 'auto';
              container.style.bottom = 'auto';
          } catch {}
      }
  }

  /**
   * Makes an element draggable.
   * @param {HTMLElement} container - The draggable container element.
   */
  function makeDraggable(container) {
    const dragHandle = container.querySelector(config.selectors.dragHandle);
    let isDragging = false;
    let offsetX, offsetY;

    const onMouseDown = (e) => {
        isDragging = true;
        offsetX = e.clientX - container.getBoundingClientRect().left;
        offsetY = e.clientY - container.getBoundingClientRect().top;
        container.style.transition = 'none';
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (isDragging) {
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        }
    };

    const onMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            localStorage.setItem(config.storage.positionKey, JSON.stringify({
                left: container.offsetLeft,
                top: container.offsetTop,
            }));
        }
    };

    dragHandle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // --- INITIALIZATION ---

  /**
   * The main function that checks for user data and starts the process.
   */
  function main() {
    setInterval(() => {
      const raw = localStorage.getItem(config.storage.userKey);
      if (!raw || raw === lastPersistUser) return;
      lastPersistUser = raw;

      try {
        const outer = JSON.parse(raw);
        if (!outer.user || outer.user === 'null') return;

        const inner = JSON.parse(outer.user);
        const { id, isTUser } = inner;

        if (id && isTUser !== null) {
          showLoader();
          const user = {
            id, isTUser,
            email: inner.email || '-',
            utmSource: inner.utmSource || '-',
            url: inner.url || '-',
            userFeatures: inner.userFeatures || null,
            nEnabled: inner.nEnabled,
            activeSubscription: inner.activeSubscription || null,
          };
          renderPanel(user);
        }
      } catch (err) {
        console.warn('❌ Error parsing persist:user:', err);
        hideLoader();
      }
    }, config.checkInterval);
  }

  /**
   * Waits for the page to be fully loaded before running the script.
   */
  function waitForLoad() {
    if (document.readyState === 'complete') {
        setTimeout(main, 1500); // Small delay to ensure everything is settled
    } else {
        window.addEventListener('load', () => setTimeout(main, 1500));
    }
  }

  // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
  // Сначала показываем загрузчик, а потом ждем загрузки страницы.
  showLoader();
  waitForLoad();

})();
