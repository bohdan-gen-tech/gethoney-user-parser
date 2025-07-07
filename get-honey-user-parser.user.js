// ==UserScript==
// @name         Get-Honey User Parser from LocalStorage
// @namespace    https://github.com/bohdan-gen-tech
// @version      2025.07.01.1
// @description  Shows decoded user info from localStorage persist:user on get-honey domains
// @author       Bohdan S.
// @match        https://get-honey.ai/*
// @match        https://get-honey.online/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=get-honey.ai
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bohdan-gen-tech/get-honey-user-parser/main/get-honey-user-parser.user.js
// @downloadURL  https://raw.githubusercontent.com/bohdan-gen-tech/get-honey-user-parser/main/get-honey-user-parser.user.js
// ==/UserScript==


(function () {
  'use strict';

  let lastPersistUser = null;
  let currentContainer = null;
  let loadingContainer = null;

  const checkInterval = 1000;
  const STORAGE_POS_KEY = 'userInfoPanelPosition';

  const startScript = () => {
    const intervalId = setInterval(() => {
      const raw = localStorage.getItem('persist:user');
      if (!raw || raw === lastPersistUser) return;

      lastPersistUser = raw;
      showLoader();

      try {
        const outer = JSON.parse(raw);
        if (!outer.user || outer.user === 'null') return;

        const inner = JSON.parse(outer.user);
        const userId = inner.id || null;
        const email = inner.email || '-';
        const utmSource = inner.utmSource || '-';
        const url = inner.url || '-';
        const isTUser = inner.hasOwnProperty('isTUser') ? inner.isTUser : null;
        const features = inner.userFeatures || null;
        const nEnabled = inner.nEnabled;
        const activeSubscription = inner.activeSubscription || null;

        if (userId && isTUser !== null) {
          if (currentContainer) currentContainer.remove();
          currentContainer = renderInfo(userId, email, utmSource, url, isTUser, features, nEnabled, activeSubscription, inner);
          document.body.appendChild(currentContainer);

          const savedPos = localStorage.getItem(STORAGE_POS_KEY);
          if (savedPos) {
            try {
              const pos = JSON.parse(savedPos);
              if (typeof pos.left === 'number' && typeof pos.top === 'number') {
                currentContainer.style.left = pos.left + 'px';
                currentContainer.style.top = pos.top + 'px';
                currentContainer.style.right = 'auto';
                currentContainer.style.bottom = 'auto';
                currentContainer.style.position = 'fixed';
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('❌ Error parsing persist:user:', err);
      }
    }, checkInterval);
  };

  function showLoader() {
    if (currentContainer) {
      currentContainer.remove();
      currentContainer = null;
    }
    if (!loadingContainer) {
      loadingContainer = document.createElement('div');
      loadingContainer.textContent = '⏳ Loading data...';
      Object.assign(loadingContainer.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontSize: '10px',
        fontFamily: 'monospace',
        borderRadius: '9px',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      });
      document.body.appendChild(loadingContainer);
    }
  }

  function renderInfo(userId, email, utmSource, url, isTUser, features, nEnabled, activeSubscription, inner) {
    if (loadingContainer) {
      loadingContainer.remove();
      loadingContainer = null;
    }

    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '270px',
      fontSize: '9px',
      background: 'rgba(0,0,0,0.5)',
      color: '#fff',
      padding: '6px 8px 8px',
      zIndex: 9999,
      fontFamily: 'monospace',
      backdropFilter: 'blur(4px)',
      borderRadius: '8px',
    });
    container.id = 'userFeaturesDraggable';

    const dragHandle = document.createElement('div');
    dragHandle.textContent = 'User Info Panel';
    Object.assign(dragHandle.style, {
      cursor: 'move',
      fontWeight: 'bold',
      marginBottom: '8px',
      userSelect: 'none',
      position: 'relative',
    });
    container.appendChild(dragHandle);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '0',
      right: '0',
      border: 'none',
      background: 'transparent',
      color: '#fff',
      fontSize: '14px',
      cursor: 'pointer',
      padding: '0 4px',
      userSelect: 'none',
    });
    closeBtn.title = 'Close';
    closeBtn.onclick = () => container.remove();
    dragHandle.appendChild(closeBtn);

    const infoBlock = document.createElement('div');
    infoBlock.innerHTML = `
      <div>🌐 utmSource: <b style="color: ${utmSource !== '-' ? 'white' : '#888'}">${utmSource}</b></div>
      <div style="overflow: hidden;text-overflow: ellipsis;display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;white-space: normal;">
        🔗 url: <b style="color: ${url !== '-' ? 'white' : '#888'}">${url}</b>
      </div>
      <div>🧩 isTUser: <b style="color: ${isTUser === true ? 'limegreen' : isTUser === false ? 'crimson' : '#888'}">${isTUser}</b></div>
    `;
    infoBlock.style.marginBottom = '10px';
    container.appendChild(infoBlock);

    const emailBlock = document.createElement('div');
    emailBlock.textContent = `📩 email: ${email}`;
    emailBlock.style.margin = '6px 0 2px';
    container.appendChild(emailBlock);

    const userIdBlock = document.createElement('div');
    userIdBlock.style.margin = '6px 0';

    const userIdContainer = document.createElement('div');
    userIdContainer.style.marginTop = '2px';
    userIdContainer.style.display = 'inline-block';

    const userIdEmoji = document.createElement('span');
    userIdEmoji.textContent = '🆔 user: ';
    userIdEmoji.style.userSelect = 'none';

    const userIdSpan = document.createElement('span');
    userIdSpan.textContent = userId;
    userIdSpan.style.color = '#0ff';
    userIdSpan.style.cursor = 'pointer';
    userIdSpan.style.backgroundColor = '#444';
    userIdSpan.style.padding = '2px 4px';
    userIdSpan.style.borderRadius = '4px';
    userIdSpan.style.userSelect = 'text';
    userIdSpan.title = 'Click to copy user.id';

    userIdContainer.appendChild(userIdEmoji);
    userIdContainer.appendChild(userIdSpan);
    userIdBlock.appendChild(userIdContainer);
    container.appendChild(userIdBlock);

    userIdSpan.onclick = () => {
      navigator.clipboard.writeText(userId)
        .then(() => {
          userIdSpan.style.color = 'white';
          userIdSpan.style.backgroundColor = 'limegreen';
          userIdEmoji.textContent = '✅ user: ';
          setTimeout(() => {
            userIdSpan.style.color = '#0ff';
            userIdSpan.style.backgroundColor = '#444';
            userIdEmoji.textContent = '🆔 user: ';
          }, 1000);
        })
        .catch(() => {
          userIdSpan.style.color = 'white';
          userIdSpan.style.backgroundColor = 'crimson';
          userIdEmoji.textContent = '❌ user: ';
          setTimeout(() => {
            userIdSpan.style.color = '#0ff';
            userIdSpan.style.backgroundColor = '#444';
            userIdEmoji.textContent = '🆔 user: ';
          }, 1000);
        });
    };

    if (features && typeof features === 'object') {
      const title = document.createElement('div');
      title.textContent = '🔧 userFeatures:';
      title.style.margin = '10px 0 6px 0';
      container.appendChild(title);

      for (const [key, value] of Object.entries(features)) {
        const line = document.createElement('div');
        line.textContent = `${key}: ${value}`;
        line.style.color = value === true ? 'limegreen' : value === false ? 'crimson' : 'white';
        container.appendChild(line);
      }
    }

    if (activeSubscription && typeof activeSubscription === 'object') {
      const subBlock = document.createElement('div');
      subBlock.innerHTML = `
        <div style="margin-top: 8px">💳 Subscription:</div>
        <div>priceID: ${activeSubscription.productId}</div>
        <div>startDate: ${activeSubscription.startDate}</div>
        <div>endDate: ${activeSubscription.endDate}</div>
        <div>status: ${activeSubscription.status}</div>
      `;
      container.appendChild(subBlock);
    }

    // nEnabled
    if (inner.hasOwnProperty('nEnabled')) {
        const nEnabledBlock = document.createElement('div');
        nEnabledBlock.textContent = `🔞 nEnabled: ${inner.nEnabled}`;
        nEnabledBlock.style.marginTop = '8px';
        nEnabledBlock.style.color = inner.nEnabled ? 'limegreen' : 'crimson';
        container.appendChild(nEnabledBlock);
    }

// Кнопка очистки данных сайта
    const clearButton = document.createElement('button');
    clearButton.textContent = '🧹 Clear site data';
    Object.assign(clearButton.style, {
      marginTop: '10px',
      padding: '5px 10px',
      borderRadius: '6px',
      border: 'none',
      background: '#333',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '9px',
      width: '100%',
    });

    clearButton.onclick = () => {
      const origin = location.origin;
      if (origin === 'https://get-honey.ai' || origin === 'https://get-honey.online') {
        try {
          localStorage.clear();
          sessionStorage.clear();

          // Удаление всех cookies
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

                // Удаляем куки с разных параметрами пути и домена
                const domain = window.location.hostname.replace(/^www\./, '');
                const pathVariants = ['/', window.location.pathname];

                pathVariants.forEach(path => {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=.${domain}`;
                });
            });


          clearButton.style.background = 'limegreen';
          clearButton.textContent = '✅ Deleted!';
          setTimeout(() => {
            clearButton.style.background = '#333';
            clearButton.textContent = '🧹 Clear site data';
          }, 1200);
        } catch (e) {
          console.warn('Error of clear data:', e);
          clearButton.style.background = 'crimson';
          clearButton.textContent = '❌ Error!';
          setTimeout(() => {
            clearButton.style.background = '#333';
            clearButton.textContent = '🧹 Clear site data';
          }, 1200);
        }
      } else {
        clearButton.style.background = 'crimson';
        clearButton.textContent = '❌ Не тот домен!';
        setTimeout(() => {
          clearButton.style.background = '#333';
          clearButton.textContent = '🧹 Очистить сайт данные';
        }, 1200);
      }
    };

    container.appendChild(clearButton);

    makeDraggable(container, dragHandle);
    return container;
  }

  function makeDraggable(container, dragHandle) {
    let isDragging = false;
    let offsetX, offsetY;

    dragHandle.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.clientX - container.getBoundingClientRect().left;
      offsetY = e.clientY - container.getBoundingClientRect().top;
      container.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (isDragging) {
        container.style.left = `${e.clientX - offsetX}px`;
        container.style.top = `${e.clientY - offsetY}px`;
        container.style.right = 'auto';
        container.style.bottom = 'auto';
        container.style.position = 'fixed';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({
          left: parseFloat(currentContainer.style.left) || 20,
          top: parseFloat(currentContainer.style.top) || (window.innerHeight - 100),
        }));
      }
      isDragging = false;
    });
  }

  showLoader();

  const waitForFullLoad = () => {
    const isFullyLoaded = document.readyState === 'complete' && performance.timing.loadEventEnd > 0;
    if (isFullyLoaded) {
      setTimeout(startScript, 1000);
    } else {
      requestAnimationFrame(waitForFullLoad);
    }
  };

  waitForFullLoad();
})();