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

    function applyPlatformTheme(platform) {
        document.body.classList.remove('platform-twitch', 'platform-youtube');
        if (platform) {
            document.body.classList.add('platform-' + platform);
        }
    }

    // ── Модалка "Кто ты?" ────────────────────────────────────────────
    const modalOverlay = document.getElementById('intro-modal-overlay');
    const introNickname = document.getElementById('intro-nickname');
    const introError = document.getElementById('intro-error');
    const introSubmit = document.getElementById('intro-submit');
    let selectedPlatform = '';

    // Кнопки выбора платформы в модалке
    document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(b => b.classList.remove('selected'));
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
        applyPlatformTheme(selectedPlatform);
        updateUserBadge(nickname, selectedPlatform);
        hideIntroModal();
    });

    // Enter в поле ника
    introNickname.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            introSubmit.click();
        }
    });

    // ── Бейдж пользователя в подвале сайдбара ────────────────────────
    const sidebarFooter = document.querySelector('.sidebar-footer');

    function updateUserBadge(nickname, platform) {
        // Удаляем старый бейдж, если есть
        const oldBadge = document.querySelector('.user-badge');
        if (oldBadge) oldBadge.remove();

        const badge = document.createElement('div');
        badge.className = 'user-badge';
        badge.innerHTML = `
            <span class="user-badge-label">Вы:</span>
            <span class="user-badge-name">${escapeHtml(nickname)}</span>
            <span class="user-badge-platform ${platform}">${platform}</span>
            <button class="user-badge-change" id="user-badge-change-btn">Сменить</button>
        `;
        sidebarFooter.insertBefore(badge, sidebarFooter.firstChild);

        document.getElementById('user-badge-change-btn').addEventListener('click', function() {
            localStorage.removeItem(LS_KEY);
            selectedPlatform = '';
            document.querySelectorAll('#intro-modal-overlay .modal-platform-btn').forEach(b => b.classList.remove('selected'));
            introNickname.value = '';
            introError.textContent = '';
            showIntroModal();
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Инициализация ────────────────────────────────────────────────
    const userData = getUserData();
    if (userData && userData.nickname && userData.platform) {
        applyPlatformTheme(userData.platform);
        updateUserBadge(userData.nickname, userData.platform);
    } else {
        showIntroModal();
    }

    // ── Навигация по вкладкам ────────────────────────────────────────
    const nav = document.querySelector('nav');
    const navItems = nav.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const indicator = nav.querySelector('.nav-indicator');
    let activeItem = nav.querySelector('.nav-item.active');

    function updateIndicator(el) {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        indicator.style.width = rect.width + 'px';
        indicator.style.height = rect.height + 'px';
        indicator.style.transform = `translate(${rect.left - navRect.left}px, ${rect.top - navRect.top}px)`;
    }

    function switchTab(targetId) {
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');

        navItems.forEach(item => item.classList.remove('active'));
        const newActive = Array.from(navItems).find(item => item.dataset.target === targetId);
        if (newActive) {
            newActive.classList.add('active');
            activeItem = newActive;
            updateIndicator(newActive);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.dataset.target;
            if (target) switchTab(target);
        });
    });

    document.querySelectorAll('.about-link[data-target]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.dataset.target;
            if (target) {
                switchTab(target);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    if (activeItem) {
        setTimeout(() => updateIndicator(activeItem), 50);
    }

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
                statusEl.textContent = `✓ Отправлено! ID: ${result.id}`;
            } else {
                const err = await resp.json();
                const msg = err.detail?.error || err.detail || 'Ошибка сервера';
                statusEl.className = 'form-status error';
                statusEl.textContent = `✗ ${msg}`;
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