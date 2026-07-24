(function() {
    'use strict';

    const SUGGESTION_URL = API_BASE + '/public/suggestions';
    const VIDEO_IDEA_URL = API_BASE + '/public/video-ideas';

    // ── Хелпер: взять значение radio по name ─────────────────────────
    function getRadioValue(name) {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
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
            const platform = getRadioValue('suggestion_platform');
            const nickname = document.getElementById('suggestion_nickname').value.trim();

            if (!command_name || !bot_response || !reason || !platform || !nickname) {
                suggStatus.className = 'form-status error';
                suggStatus.textContent = '✗ Заполни все поля';
                suggStatus.style.display = 'block';
                return;
            }

            submitForm(SUGGESTION_URL, {
                command_name: command_name.replace(/^!/, ''),
                bot_response,
                reason,
                platform,
                nickname,
            }, suggStatus, suggBtn);
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
            const platform = getRadioValue('video_platform');
            const nickname = document.getElementById('video_nickname').value.trim();

            if (!idea || !platform || !nickname) {
                videoStatus.className = 'form-status error';
                videoStatus.textContent = '✗ Заполни все поля';
                videoStatus.style.display = 'block';
                return;
            }

            submitForm(VIDEO_IDEA_URL, { idea, platform, nickname }, videoStatus, videoBtn);
        });
    }

})();