(() => {
  'use strict';
  const config = window.AILYRO_CONFIG;
  if (!config) return;
  const links = [...document.querySelectorAll('[data-download]')];
  const meta = [...document.querySelectorAll('[data-release-meta]')];
  const status = document.querySelector('[data-download-status]');
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manualReduced = false;

  document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = config.name; });
  document.querySelectorAll('[data-repository]').forEach(el => { el.href = config.repositoryUrl; });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const userAgent = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const isMobile = navigator.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(userAgent) || (/Mac/i.test(platform) && navigator.maxTouchPoints > 1);
  const isWindows = !isMobile && (/Windows|Win32|Win64/i.test(platform) || /Windows NT/i.test(userAgent));

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  for (const link of links) {
    if (isWindows) {
      link.href = config.downloadUrl;
      link.addEventListener('click', () => {
        setStatus(`Le téléchargement démarre… Ouvre ${config.assetName} une fois terminé. Si Windows SmartScreen apparaît pour cet installateur, clique sur Informations complémentaires → Exécuter quand même.`);
        document.dispatchEvent(new CustomEvent('ailyro:download'));
      });
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('role', 'link');
      link.setAttribute('tabindex', '0');
      link.querySelector('[data-download-label]').textContent = 'Disponible sur Windows';
      link.addEventListener('click', event => { event.preventDefault(); });
      link.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
      });
    }
  }

  const copyContainer = document.querySelector('[data-copy-container]');
  if (!isWindows && copyContainer) copyContainer.hidden = false;
  const copyButton = document.querySelector('[data-copy-link]');
  const copyFallback = document.querySelector('[data-copy-fallback]');
  copyButton?.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(config.downloadUrl);
      setStatus('Lien copié. Retrouve-le sur ton PC Windows pour télécharger le navigateur.');
    } catch {
      if (!copyFallback) return;
      copyFallback.value = config.downloadUrl;
      copyFallback.hidden = false;
      copyFallback.focus();
      copyFallback.select();
      setStatus('Sélectionne et copie ce lien pour le retrouver sur ton PC Windows.');
    }
  });

  function updateMotion() {
    const reduced = manualReduced || reducedQuery.matches;
    window.ailyroMotionAllowed = !reduced;
    document.documentElement.classList.toggle('reduce-motion', reduced);
    const button = document.querySelector('[data-motion-toggle]');
    if (button) {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(reduced));
      button.querySelector('[data-motion-label]').textContent = reduced ? (reducedQuery.matches ? 'Animations réduites (système)' : 'Activer les animations') : 'Réduire les animations';
    }
    document.dispatchEvent(new CustomEvent('ailyro:motion', { detail: { reduced } }));
  }
  document.querySelector('[data-motion-toggle]')?.addEventListener('click', () => {
    manualReduced = reducedQuery.matches ? false : !manualReduced;
    updateMotion();
  });
  if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', updateMotion);
  else reducedQuery.addListener(updateMotion);
  updateMotion();

  // Only animate the transform, and only while the preview is in view.
  const preview = document.querySelector('[data-preview]');
  let previewVisible = true;
  let frame = 0;
  function paintPreview() {
    frame = 0;
    if (!preview) return;
    if (!window.ailyroMotionAllowed || document.hidden || window.innerWidth <= 480) {
      preview.style.removeProperty('transform');
      return;
    }
    if (!previewVisible) return;
    const rect = preview.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    preview.style.transform = `rotateX(${(4 - progress * 4).toFixed(2)}deg)`;
  }
  function schedulePreview() {
    if (!frame) frame = requestAnimationFrame(paintPreview);
  }
  if (preview && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      previewVisible = entries[0].isIntersecting;
      if (previewVisible) schedulePreview();
    }, { rootMargin: '80px' });
    observer.observe(preview);
  }
  window.addEventListener('scroll', schedulePreview, { passive: true });
  window.addEventListener('resize', schedulePreview, { passive: true });
  document.addEventListener('visibilitychange', schedulePreview);
  document.addEventListener('ailyro:motion', schedulePreview);
  schedulePreview();

  // A release API failure must never prevent the ordinary download link.
  async function loadRelease() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(config.releaseApiUrl, { signal: controller.signal, headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit' });
      if (!response.ok) return;
      const release = await response.json();
      const asset = Array.isArray(release.assets) ? release.assets.find(item => item.name === config.assetName) : null;
      if (!asset) return;
      const parts = [];
      if (typeof release.tag_name === 'string' && release.tag_name.trim()) parts.push(release.tag_name.trim());
      parts.push('Windows 10 et 11');
      if (typeof asset.size === 'number' && asset.size > 0) parts.push(`${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(asset.size / 1000000)} Mo`);
      const date = new Date(release.published_at);
      if (release.published_at && !Number.isNaN(date.getTime())) parts.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
      const releaseText = parts.join(' · ');
      meta.forEach(el => { el.textContent = releaseText; });
    } catch {
      // Offline, API rate limits and incomplete releases retain the fallback.
    } finally {
      window.clearTimeout(timeout);
    }
  }
  loadRelease();
})();
