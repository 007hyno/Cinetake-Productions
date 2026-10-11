const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
const ytEmbed = (id, extra = '') => `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1${extra}`;
const icons = () => window.lucide && lucide.createIcons();

async function init() {
  let cfg;
  try { cfg = await (await fetch('config.json')).json(); }
  catch (e) { document.body.insertAdjacentHTML('afterbegin', '<p style="padding:16px">Could not load config.json (serve via a web server / GitHub Pages).</p>'); return; }

  renderHeader(cfg); renderHero(cfg); renderWork(cfg); renderGrading(cfg); renderAbout(cfg); renderFooter(cfg);
  setupNav(); setupModal(); startTimecode();
  window.addEventListener('load', icons); icons();
}

function renderHeader({ site, nav }) {
  const logo = $('#brand-logo'); logo.src = site.logo; logo.onerror = () => logo.removeAttribute('src');
  $('#brand-name').textContent = site.name;
  $('#main-nav').innerHTML = nav.map(n => `<a href="${n.target}">${n.label}</a>`).join('');
}

function renderHero({ hero }) {
  $('#hero-eyebrow').textContent = hero.eyebrow;
  $('#hero-title').textContent = hero.title;
  $('#hero-roles').innerHTML = hero.roles.join(' / ');
  $('#hero-cta span').textContent = hero.buttonLabel;
  $('#hero-side').textContent = hero.sideText;
  $('#hero-video').src = ytEmbed(hero.videoId, `&autoplay=1&mute=1&loop=1&playlist=${hero.videoId}&controls=0&modestbranding=1`);
}

function renderWork({ work }) {
  $('#work-title').textContent = work.title;
  const grid = $('#work-grid'), btn = $('#work-toggle');
  let expanded = false;
  const draw = () => {
    grid.innerHTML = '';
    (expanded ? work.items : work.items.slice(0, work.initialVisible)).forEach(item => {
      const card = el('article', 'card', `
        <button class="thumb" data-id="${item.youtubeId}" aria-label="Play ${item.title}">
          <img src="https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg" alt="" loading="lazy">
          <i data-lucide="play" class="play"></i>
        </button>
        <h3 class="card-title"><i data-lucide="${item.icon}"></i>${item.title}</h3>
        <p class="card-sub">${item.subtitle}</p>
        <ul class="tags">${item.tags.map(t => `<li>${t}</li>`).join('')}</ul>`);
      grid.appendChild(card);
    });
    btn.innerHTML = expanded ? 'Show less' : 'View all <i data-lucide="arrow-right"></i>';
    icons();
  };
  btn.hidden = work.items.length <= work.initialVisible;
  btn.onclick = () => { expanded = !expanded; draw(); };
  draw();
}

function renderGrading({ grading }) {
  $('#grading-title').textContent = grading.title;
  const grid = $('#grading-grid');
  grading.items.forEach(item => {
    const card = el('article', 'grade-card', `
      <div class="compare">
        <img src="${item.after}" alt="${item.title} after grading" loading="lazy">
        <img class="before" src="${item.before}" alt="${item.title} before grading" loading="lazy">
        <span class="compare-label l-before">Before</span><span class="compare-label l-after">After</span>
        <span class="compare-line"></span>
        <span class="compare-knob"><i data-lucide="chevrons-left-right"></i></span>
        <input type="range" min="0" max="100" value="50" aria-label="Before and after slider for ${item.title}">
      </div>
      <h3 class="card-title"><i data-lucide="${item.icon || 'palette'}"></i>${item.title}</h3>
      <p class="card-sub">${item.subtitle}</p>
      <ul class="tags">${item.tags.map(t => `<li>${t}</li>`).join('')}</ul>`);
    const box = $('.compare', card), input = $('input', card);
    input.addEventListener('input', () => box.style.setProperty('--pos', input.value + '%'));
    grid.appendChild(card);
  });
  $('#grading-videos').innerHTML = (grading.videos || []).map(v => `
    <div class="compare-video">
      <iframe src="${ytEmbed(v.youtubeId, `&autoplay=1&mute=1&loop=1&playlist=${v.youtubeId}&controls=0&modestbranding=1`)}" title="${v.label} grading video" allow="autoplay; encrypted-media" loading="lazy"></iframe>
      <span class="compare-label l-before">${v.label}</span>
    </div>`).join('');
}

function renderAbout({ about }) {
  $('#about-title').textContent = about.title;
  $('#about-headline').textContent = about.headline;
  $('#about-text').textContent = about.text;
  const link = $('#about-link'); link.textContent = about.linkLabel; link.href = about.linkTarget;
  $('#about-img').src = about.illustration;
  $('#about-hand').src = about.handwriting;
  $('#about-values').innerHTML = about.values.map(v => `<li><i data-lucide="${v.icon}"></i>${v.text}</li>`).join('');
}

function renderFooter({ site, contact, footer }) {
  $('#contact-eyebrow').textContent = contact.eyebrow;
  $('#contact-headline').textContent = contact.headline;
  $('#contact-text').textContent = contact.text;
  $('#link-instagram').href = site.instagram;
  $('#link-email').href = `mailto:${site.email}`;
  $('#copyright').textContent = `© ${new Date().getFullYear()} ${footer.owner}. All rights reserved.`;
}

function setupNav() {
  const nav = $('#main-nav'), toggle = $('.nav-toggle');
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', nav.classList.toggle('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); } });
  const links = [...nav.querySelectorAll('a')];
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  ['home', 'work', 'grading', 'about', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function setupModal() {
  const dlg = $('#video-modal'), frame = $('#modal-iframe');
  $('#work-grid').addEventListener('click', e => {
    const t = e.target.closest('.thumb'); if (!t) return;
    frame.src = ytEmbed(t.dataset.id, '&autoplay=1'); dlg.showModal();
  });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('.modal-close')) dlg.close(); });
  dlg.addEventListener('close', () => { frame.src = ''; });
}

function startTimecode() {
  const out = $('#timecode');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const start = performance.now(), offset = ((2 * 60 + 34) * 24 + 18); // 00:02:34:18
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const f = offset + Math.floor((performance.now() - start) / (1000 / 24));
    out.textContent = `${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
    requestAnimationFrame(tick);
  };
  tick();
}

init();