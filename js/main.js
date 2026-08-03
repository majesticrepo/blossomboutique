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

// nav shrink on scroll, and swap gold text for white while the nav sits
  // over the hero photo (transitions smoothly back to gold once past it)
  const nav = document.getElementById('nav');
  const heroSection = document.getElementById('home');
  function updateNavState(){
    nav.classList.toggle('scrolled', window.scrollY > 50);
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    nav.classList.toggle('on-hero', window.scrollY + nav.offsetHeight < heroBottom);
  }
  window.addEventListener('scroll', updateNavState);
  window.addEventListener('resize', updateNavState);
  updateNavState();

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
  document.querySelectorAll('a.nav-dot, a.back-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href').replace('#', '');
    });
  });

  // ----- Bloom colour palette, shared by the cursor tint and the click burst -----
  const bloomPalette = {
    red:'#C0392B', orange:'#D96C2B', yellow:'#DDAF35', green:'#6B8F52',
    blue:'#5F8DBF', purple:'#8B6FA8', pink:'#E39FB0', brown:'#7B5A3E',
    black:'#2A2622', white:'#FBF8F2', beige:'#D8C7A8', gold:'#9C7A32'
  };

  function bloomNameFromLink(link){
    const item = link.closest('.flower-item');
    if(item){
      const swatchClass = [...item.classList].find(c => c.startsWith('c-'));
      if(swatchClass) return swatchClass.slice(2);
    }
    const page = link.closest('[id^="page-"], [id^="detail-"]');
    if(page) return page.id.replace('page-', '').replace('detail-', '');
    return null;
  }

  function bloomColour(link){
    return bloomPalette[bloomNameFromLink(link)] || '#C6A15B';
  }

  // ----- Mouse-only: tint the cursor to match the bloom being hovered -----
  const canHoverWithMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(canHoverWithMouse){
    document.querySelectorAll('a.flower-item, a.bloom-link').forEach(link => {
      const hex = bloomColour(link);
      const cursorSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'>"
        + "<circle cx='15' cy='15' r='11' fill='" + hex + "' stroke='white' stroke-width='2.5'/></svg>";
      const cursorUrl = 'url("data:image/svg+xml,' + encodeURIComponent(cursorSvg) + '") 15 15, pointer';
      link.addEventListener('mouseenter', () => { link.style.cursor = cursorUrl; });
      link.addEventListener('mouseleave', () => { link.style.cursor = ''; });
    });
  }

  // ----- Click a bloom: it grows into a full-screen burst of its colour,
  // transitioning into the next page, then fades to reveal it -----
  const burst = document.getElementById('flowerBurst');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function goToHash(hash){
    window.location.hash = hash;
  }

  function triggerBloomBurst(link, hash){
    if(reduceMotion){
      goToHash(hash);
      return;
    }
    const icon = link.querySelector('.swatch, .cartoon-flower') || link;
    const rect = icon.getBoundingClientRect();
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';
    burst.style.background = bloomColour(link);
    burst.classList.remove('burst-fade');
    void burst.offsetWidth; // restart the transition
    burst.classList.add('burst-grow');

    setTimeout(() => {
      goToHash(hash);
      setTimeout(() => {
        burst.classList.remove('burst-grow');
        burst.classList.add('burst-fade');
      }, 80);
    }, 550);
  }

  document.querySelectorAll('a.flower-item, a.bloom-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      triggerBloomBurst(link, link.getAttribute('href').replace('#', ''));
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
