(function() {
    'use strict';

    const SUGGESTION_URL = API_BASE + '/public/suggestions';
    const VIDEO_IDEA_URL = API_BASE + '/public/video-ideas';

    // ── Данные пользователя из localStorage ──────────────────────────
    const LS_KEY = 'slyrix_viewer_user';

    function getUserData() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY));
        } catch {
            return null;
        }
    }

    function saveUserData(nickname, platform) {
        localStorage.setItem(LS_KEY, JSON.stringify({ nickname, platform }));
    }

    // ── Модалка "Кто ты?" ────────────────────────────────────────────
    const modalOverlay = document.getElementById('intro-modal-overlay');
    const introNickname = document.getElementById('intro-nickname');
    const introError = document.getElementById('intro-error');
    const introSubmit = document.getElementById('intro-submit');
    let selectedPlatform = '';

    document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(function(b) { b.classList.remove('selected'); });
            this.classList.add('selected');
            selectedPlatform = this.dataset.platform;
        });
    });

    function showIntroModal() {
        modalOverlay.classList.add('open');
        introNickname.focus();
    }

    function hideIntroModal() {
        modalOverlay.classList.remove('open');
    }

    window.closeIntroModal = hideIntroModal;

    introSubmit.addEventListener('click', function() {
        const nickname = introNickname.value.trim();
        if (!nickname) {
            introError.textContent = 'Введи свой ник';
            introError.className = 'tfa-status tfa-status-error';
            return;
        }
        if (!selectedPlatform) {
            introError.textContent = 'Выбери платформу';
            introError.className = 'tfa-status tfa-status-error';
            return;
        }
        introError.textContent = '';
        introError.className = 'tfa-status';

        saveUserData(nickname, selectedPlatform);
        updateProfile(nickname, selectedPlatform);
        hideIntroModal();
    });

    introNickname.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            introSubmit.click();
        }
    });

    // ── Профиль ──────────────────────────────────────────────────────
    const profileNickname = document.getElementById('profile-nickname');
    const profileBadge = document.getElementById('profile-platform-badge');
    const profileChangeBtn = document.getElementById('profile-change-btn');
    const badgeName = document.getElementById('user-badge-name');
    const badgeChangeBtn = document.getElementById('user-badge-change-btn');

    function platformBadgeHtml(platform) {
        if (!platform) return '';
        var icon = platform === 'twitch'
            ? '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M4 3h16v11l-4 4h-4l-3 3v-3H4z"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M10 8l8 4-8 4z"/><rect x="2" y="4" width="20" height="16" rx="3"/></svg>';
        return '<span class="platform-badge">' + icon + platform + '</span>';
    }

    function updateProfile(nickname, platform) {
        profileNickname.textContent = nickname || '—';
        profileBadge.innerHTML = platformBadgeHtml(platform);
        badgeName.textContent = nickname || '—';
    }

    function openChangeModal() {
        const current = getUserData();
        introNickname.value = current ? current.nickname || '' : '';
        selectedPlatform = current ? current.platform || '' : '';
        document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(function(b) {
            b.classList.toggle('selected', b.dataset.platform === selectedPlatform);
        });
        introError.textContent = '';
        showIntroModal();
    }

    profileChangeBtn.addEventListener('click', openChangeModal);
    badgeChangeBtn.addEventListener('click', openChangeModal);

    // ── Инициализация ────────────────────────────────────────────────
    const userData = getUserData();
    if (userData && userData.nickname && userData.platform) {
        updateProfile(userData.nickname, userData.platform);
    } else {
        showIntroModal();
    }

    // ── Слайд-навигация (как в nav.js) ──────────────────────────────
    const items = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const itemsOrder = Array.from(items);
    const navEl = document.querySelector('nav');
    const navIndicator = document.querySelector('.nav-indicator');

    function setSectionInstant(el, pct) {
        el.style.transition = 'none';
        el.style.transform = 'translateY(' + pct + '%) translateZ(0)';
        void el.offsetHeight;
        el.style.transition = '';
    }

    function activateSection(oldSection, newSection, direction) {
        if (newSection === oldSection) return;

        if (direction === 0) {
            if (oldSection && oldSection !== newSection) {
                oldSection.classList.remove('active');
                oldSection.inert = true;
                setSectionInstant(oldSection, 100);
            }
            if (newSection) {
                setSectionInstant(newSection, 0);
                newSection.classList.add('active');
                newSection.inert = false;
            }
            return;
        }

        if (newSection) {
            setSectionInstant(newSection, direction * 100);
            newSection.inert = false;
        }

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                if (newSection) {
                    newSection.classList.add('active');
                    newSection.style.transform = 'translateY(0)';
                }
                if (oldSection) {
                    oldSection.classList.remove('active');
                    oldSection.style.transform = 'translateY(' + (direction * -100) + '%)';
                    oldSection.inert = true;
                }
            });
        });
    }

    function moveNavIndicator(target, instant) {
        if (!navEl || !navIndicator || !target) return;
        var navRect = navEl.getBoundingClientRect();
        var itemRect = target.getBoundingClientRect();
        var apply = function() {
            navIndicator.style.width = itemRect.width + 'px';
            navIndicator.style.height = itemRect.height + 'px';
            navIndicator.style.transform = 'translate(' + (itemRect.left - navRect.left) + 'px, ' + (itemRect.top - navRect.top) + 'px)';
        };
        if (instant) {
            navIndicator.style.transitionProperty = 'none';
            apply();
            navIndicator.offsetHeight;
            navIndicator.style.transitionProperty = '';
        } else {
            apply();
        }
    }

    moveNavIndicator(document.querySelector('.nav-item.active'), true);

    items.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var oldBtn = document.querySelector('.nav-item.active');
            var oldIndex = oldBtn ? itemsOrder.indexOf(oldBtn) : -1;
            var newIndex = itemsOrder.indexOf(btn);
            var direction = (oldIndex === -1 || oldIndex === newIndex) ? 0 : (newIndex > oldIndex ? 1 : -1);

            items.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            moveNavIndicator(btn, false);

            var oldSection = document.querySelector('.section.active');
            var target = document.getElementById(btn.dataset.target);
            activateSection(oldSection, target, direction);
            target.scrollTop = 0;
        });
    });

    document.querySelectorAll('.about-link[data-target]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var target = this.dataset.target;
            if (target) {
                var btn = document.querySelector('.nav-item[data-target="' + target + '"]');
                if (btn) btn.click();
            }
        });
    });

    // ── Докбар для мобилок ──────────────────────────────────────────
    function renderDock() {
        var dock = document.getElementById('mobile-dock');
        if (!dock) return;

        var activeBtn = document.querySelector('.nav-item.active');
        var activeId = activeBtn ? activeBtn.dataset.target : 'videos';

        var dockItems = [
            { id: 'videos', label: 'Видео', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 10.5 21 7v10l-6-3.5"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>' },
            { id: 'commands', label: 'Команды', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v14H4z"/><path d="M8 9l3 3-3 3M13 15h4"/></svg>' },
            { id: 'profile', label: 'Профиль', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>' },
            { id: 'about', label: 'О сайте', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>' },
        ];

        var indicator = dock.querySelector('.dock-indicator');
        var html = '';
        dockItems.forEach(function(item) {
            var isActive = item.id === activeId;
            html += '<button class="dock-item' + (isActive ? ' active' : '') + '" data-target="' + item.id + '">' +
                '<span class="dock-icon">' + item.icon + '</span>' +
                '<span class="dock-label">' + item.label + '</span>' +
                '</button>';
        });

        dock.innerHTML = html;

        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'dock-indicator';
            indicator.setAttribute('aria-hidden', 'true');
        }
        dock.insertBefore(indicator, dock.firstChild);

        requestAnimationFrame(function() { moveDockIndicator(); });
    }

    function moveDockIndicator() {
        var dock = document.getElementById('mobile-dock');
        var indicator = document.querySelector('.dock-indicator');
        if (!dock || !indicator) return;

        var activeBtn = dock.querySelector('.dock-item.active');
        if (!activeBtn) {
            indicator.style.display = 'none';
            return;
        }

        indicator.style.display = 'block';
        var dockRect = dock.getBoundingClientRect();
        var btnRect = activeBtn.getBoundingClientRect();
        indicator.style.width = btnRect.width + 'px';
        indicator.style.height = btnRect.height + 'px';
        indicator.style.transform = 'translate(' + (btnRect.left - dockRect.left) + 'px, ' + (btnRect.top - dockRect.top) + 'px)';
    }

    function handleDockClick(e) {
        var dockBtn = e.target.closest('.dock-item');
        if (!dockBtn) return;
        var target = dockBtn.dataset.target;
        if (target) {
            var btn = document.querySelector('.nav-item[data-target="' + target + '"]');
            if (btn) btn.click();
        }
    }

    var dockWrap = document.getElementById('mobile-dock-wrap');
    if (dockWrap) {
        dockWrap.addEventListener('click', handleDockClick);
    }

    var navObserver = new MutationObserver(function() { renderDock(); });
    document.querySelectorAll('.nav-item').forEach(function(el) {
        navObserver.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    });

    renderDock();

    // ── Утилита: отправка формы ──────────────────────────────────────
    async function submitForm(url, data, statusEl, submitBtn) {
        submitBtn.disabled = true;
        statusEl.className = 'form-status';
        statusEl.textContent = 'Секунду...';
        statusEl.style.display = 'block';

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (resp.ok) {
                const result = await resp.json();
                statusEl.className = 'form-status success';
                statusEl.textContent = '✓ Отправлено! ID: ' + result.id;
            } else {
                const err = await resp.json();
                const msg = err.detail?.error || err.detail || 'Ошибка сервера';
                statusEl.className = 'form-status error';
                statusEl.textContent = '✗ ' + msg;
            }
        } catch (e) {
            statusEl.className = 'form-status error';
            statusEl.textContent = '✗ Ошибка соединения с сервером';
        } finally {
            submitBtn.disabled = false;
        }
    }

    function getBodyData(extraFields) {
        const user = getUserData();
        if (!user) {
            showIntroModal();
            return null;
        }
        return {
            ...extraFields,
            platform: user.platform,
            nickname: user.nickname,
        };
    }

    // ── Форма предложения команды ────────────────────────────────────
    const suggForm = document.getElementById('suggestion-form');
    const suggStatus = document.getElementById('suggestion-status');
    const suggBtn = document.getElementById('suggestion-submit');

    if (suggForm) {
        suggForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const command_name = document.getElementById('command_name').value.trim();
            const bot_response = document.getElementById('bot_response').value.trim();
            const reason = document.getElementById('reason').value.trim();

            if (!command_name || !bot_response || !reason) {
                suggStatus.className = 'form-status error';
                suggStatus.textContent = '✗ Заполни все поля';
                suggStatus.style.display = 'block';
                return;
            }

            const body = getBodyData({
                command_name: command_name.replace(/^!/, ''),
                bot_response,
                reason,
            });
            if (body) submitForm(SUGGESTION_URL, body, suggStatus, suggBtn);
        });
    }

    // ── Форма идеи видео ─────────────────────────────────────────────
    const videoForm = document.getElementById('video-form');
    const videoStatus = document.getElementById('video-status');
    const videoBtn = document.getElementById('video-submit');

    if (videoForm) {
        videoForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const idea = document.getElementById('idea').value.trim();
            if (!idea) {
                videoStatus.className = 'form-status error';
                videoStatus.textContent = '✗ Заполни все поля';
                videoStatus.style.display = 'block';
                return;
            }

            const body = getBodyData({ idea });
            if (body) submitForm(VIDEO_IDEA_URL, body, videoStatus, videoBtn);
        });
    }

})();