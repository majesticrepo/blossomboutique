// Split footer text into per-letter spans so CSS can stagger a wave animation
  document.querySelectorAll('.wave-text').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'letter' + (char === ' ' ? ' is-space' : '');
      span.textContent = char === ' ' ? ' ' : char;
      span.style.animationDelay = (i * 0.06) + 's';
      el.appendChild(span);
    });
  });

// nav shrink on scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ----- Overlay: only one page visible at a time (colour page OR flower
  // detail page), and you can't scroll past it without going back first -----
  const overlay = document.getElementById('colourOverlay');
  const overlayPages = overlay.querySelectorAll('.colour-page, .detail-page');

  function showOverlayPage(id){
    overlay.style.display = 'block';
    document.body.classList.add('scroll-locked');
    overlayPages.forEach(p => {
      const isMatch = p.id === id;
      p.style.display = isMatch ? 'flex' : 'none';
      p.classList.remove('active');
      if(isMatch) p.scrollTop = 0;
    });
    const activePage = document.getElementById(id);
    if(activePage){
      // next frame so the transition actually fires
      requestAnimationFrame(() => requestAnimationFrame(() => {
        activePage.classList.add('active');
      }));
    }
  }

  function hideColourOverlay(){
    overlay.style.display = 'none';
    document.body.classList.remove('scroll-locked');
  }

  function handleHash(){
    const hash = window.location.hash;
    if(hash.startsWith('#page-') || hash.startsWith('#detail-')){
      showOverlayPage(hash.replace('#', ''));
    } else {
      hideColourOverlay();
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash(); // in case the page loads with a colour already in the URL

  // Prevent the browser's own anchor-jump for swatch/photo links; we handle
  // showing/hiding entirely ourselves so the background never scrolls.
  document.querySelectorAll('a.flower-item, a.nav-dot, a.bloom-link, a.back-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href').replace('#', '');
    });
  });

  // Hero is now a full-bleed scene, so petals spread across the whole
  // photo rather than one smaller canopy box.
  const heroCanopyPoints = [
    {x:8,y:10},{x:20,y:6},{x:32,y:14},{x:44,y:8},{x:14,y:22},{x:26,y:26},
    {x:38,y:20},{x:50,y:24},{x:60,y:12},{x:70,y:20},{x:18,y:36},{x:34,y:40},
    {x:48,y:34},{x:58,y:38},{x:66,y:30},{x:10,y:44},{x:42,y:48},{x:54,y:46}
  ];

  const wrap = document.getElementById('heroPetals');
  const petalsPerSpawn = 34;
  for(let i=0; i<petalsPerSpawn; i++){
    const p = document.createElement('div');
    p.className = 'petal soft';
    const origin = heroCanopyPoints[Math.floor(Math.random()*heroCanopyPoints.length)];
    const leftPct = origin.x + (Math.random()*3 - 1.5);
    const topPct = origin.y + (Math.random()*3 - 1.5);
    const duration = 9 + Math.random()*9;
    const delay = Math.random()*14;
    const drift = (Math.random()*220 - 60) + 'px';
    const fallDist = (350 + Math.random()*300) + 'px';
    const scale = 0.6 + Math.random()*0.9;
    p.style.left = leftPct + '%';
    p.style.top = topPct + '%';
    p.style.setProperty('--drift', drift);
    p.style.setProperty('--fallDist', fallDist);
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';
    p.style.transform = 'scale(' + scale + ')';
    wrap.appendChild(p);
  }

  // Sakura detail page: same falling-petal idea, but soft/translucent since
  // they drift across the whole painting rather than one hero canopy.
  const sakuraWrap = document.getElementById('sakuraPetals');
  if(sakuraWrap){
    const sakuraPoints = [
      {x:8,y:10},{x:20,y:6},{x:32,y:14},{x:44,y:8},{x:14,y:22},{x:26,y:26},
      {x:38,y:20},{x:50,y:24},{x:60,y:12},{x:70,y:20},{x:18,y:36},{x:34,y:40},
      {x:48,y:34},{x:58,y:38},{x:66,y:30},{x:10,y:44},{x:42,y:48},{x:54,y:46}
    ];
    for(let i=0; i<36; i++){
      const p = document.createElement('div');
      p.className = 'petal soft';
      const origin = sakuraPoints[Math.floor(Math.random()*sakuraPoints.length)];
      const leftPct = origin.x + (Math.random()*3 - 1.5);
      const topPct = origin.y + (Math.random()*3 - 1.5);
      const duration = 9 + Math.random()*9;
      const delay = Math.random()*14;
      const drift = (Math.random()*220 - 60) + 'px';
      const fallDist = (350 + Math.random()*300) + 'px';
      const scale = 0.6 + Math.random()*0.9;
      p.style.left = leftPct + '%';
      p.style.top = topPct + '%';
      p.style.setProperty('--drift', drift);
      p.style.setProperty('--fallDist', fallDist);
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = delay + 's';
      p.style.transform = 'scale(' + scale + ')';
      sakuraWrap.appendChild(p);
    }
  }
