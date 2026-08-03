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
  // over the hero photo (transitions smoothly back to gold once past it).
  // Pages without a hero (about/contact) never gain the on-hero class.
  const nav = document.getElementById('nav');
  const heroSection = document.getElementById('home');
  function updateNavState(){
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if(heroSection){
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      nav.classList.toggle('on-hero', window.scrollY + nav.offsetHeight < heroBottom);
    }
  }
  window.addEventListener('scroll', updateNavState);
  window.addEventListener('resize', updateNavState);
  updateNavState();

  // ----- Hamburger menu: only present below the desktop breakpoint, but
  // wired up everywhere so it works if the viewport is resized down.
  // The colour dots stay visible in the bar at all times; only the text
  // links (#navLinks) collapse behind the toggle. -----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if(navToggle && navLinks){
    function closeMenu(){
      navLinks.classList.remove('open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    function openMenu(){
      navLinks.classList.add('open');
      navToggle.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    }
    navToggle.addEventListener('click', () => {
      if(navLinks.classList.contains('open')) closeMenu(); else openMenu();
    });
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if(window.innerWidth > 900) closeMenu(); });
  }

  // ----- Overlay: only one page visible at a time (colour page OR flower
  // detail page), and you can't scroll past it without going back first.
  // Only present on index.html - about/contact link back into it instead. -----
  const overlay = document.getElementById('colourOverlay');
  const overlayPages = overlay ? overlay.querySelectorAll('.colour-page, .detail-page') : [];

  // Everything below only applies where the overlay markup exists (index.html).
  // On about.html/contact.html the same nav-dot/hash links just navigate
  // straight back to index.html#page-... as plain browser links.
  if(overlay){
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
  }

  // ----- Bloom colour palette, shared by the cursor tint and the click burst.
  // White is mapped to the site's gold accent rather than its literal near-
  // white hex, since a white-on-white cursor/outline would be invisible -----
  const bloomPalette = {
    red:'#C0392B', orange:'#D96C2B', yellow:'#DDAF35', green:'#6B8F52',
    blue:'#5F8DBF', purple:'#8B6FA8', pink:'#E39FB0', brown:'#7B5A3E',
    black:'#2A2622', white:'#C6A15B', beige:'#D8C7A8', gold:'#9C7A32'
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

  // ----- Reviews page: star-rating picker, submit/edit/delete/report, and
  // the average-rating summary at the top. No backend, so every review -
  // seed and submitted alike - lives in localStorage as one editable list,
  // each with a stable id so cards can be deleted or updated in place. -----
  const reviewForm = document.getElementById('reviewForm');
  if(reviewForm){
    const STORAGE_KEY = 'bb_reviews_v2';
    const MAX_MEDIA_PER_REVIEW = 4;
    const MAX_FILE_BYTES = 4 * 1024 * 1024; // keep individual files sane for localStorage

    const defaultSeedReviews = [
      { id:'seed-1', name:'Amara O.', rating:5, text:"The Champagne Rose box was even more stunning in person - felt like unwrapping a piece of jewellery. Will absolutely order again.", date:'2026-06-14T10:00:00.000Z', media:[], reported:false },
      { id:'seed-2', name:'Priya K.', rating:5, text:'Ordered the Sakura arrangement for a birthday and it arrived perfectly fresh. The gold box made it feel extra special.', date:'2026-05-02T10:00:00.000Z', media:[], reported:false },
      { id:'seed-3', name:'Daniel R.', rating:4, text:'Beautiful flowers and fast delivery. Wish there were a couple more size options, but the quality made up for it.', date:'2026-03-21T10:00:00.000Z', media:[], reported:false }
    ];

    function makeId(){
      return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
    function loadReviews(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw){
          saveReviews(defaultSeedReviews);
          return defaultSeedReviews.slice();
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : defaultSeedReviews.slice();
      }catch(e){
        return defaultSeedReviews.slice();
      }
    }
    function saveReviews(list){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
      }catch(e){
        return false;
      }
    }

    let reviews = loadReviews();
    let editingId = null;
    let pendingMedia = []; // [{type:'image'|'video', dataUrl, name}]

    function formatDate(iso){
      return new Date(iso).toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
    }
    function escapeHtml(str){
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function renderSummary(){
      const count = reviews.length;
      const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
      document.getElementById('ratingStars').style.setProperty('--rating', average);
      document.getElementById('ratingAverage').textContent = average.toFixed(1);
      document.getElementById('ratingCount').textContent =
        'Based on ' + count + (count === 1 ? ' review' : ' reviews');
    }

    function mediaThumbHtml(item, index, removable){
      const inner = item.type === 'video'
        ? '<video src="' + item.dataUrl + '" controls muted playsinline></video>'
        : '<img src="' + item.dataUrl + '" alt="">';
      const removeBtn = removable
        ? '<button type="button" class="remove-media" data-index="' + index + '" aria-label="Remove media">&times;</button>'
        : '';
      return '<div class="review-media-thumb">' + inner + removeBtn + '</div>';
    }

    function renderMediaPreview(){
      document.getElementById('reviewMediaPreview').innerHTML =
        pendingMedia.map((m, i) => mediaThumbHtml(m, i, true)).join('');
    }

    function renderList(){
      const list = document.getElementById('reviewList');
      if(!reviews.length){
        list.innerHTML = '<p class="review-list-empty">No reviews yet - be the first to share yours.</p>';
        return;
      }
      list.innerHTML = reviews.map(r => {
        const filled = '★'.repeat(r.rating);
        const empty = '<span class="star-empty">' + '★'.repeat(5 - r.rating) + '</span>';
        const media = (r.media && r.media.length)
          ? '<div class="review-card-media">' + r.media.map((m, i) => mediaThumbHtml(m, i, false)).join('') + '</div>'
          : '';
        const reportedTag = r.reported ? '<span class="review-reported-tag">Reported</span>' : '';
        const editedTag = r.edited ? ' <span class="review-edited-tag">(edited)</span>' : '';
        return '<article class="review-card' + (r.reported ? ' is-reported' : '') + '" data-id="' + r.id + '">'
          + '<div class="review-menu">'
          + '<button type="button" class="review-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="Review options">&#8942;</button>'
          + '<div class="review-menu-dropdown">'
          + '<button type="button" data-action="edit">Edit</button>'
          + '<button type="button" data-action="report"' + (r.reported ? ' disabled' : '') + '>' + (r.reported ? 'Reported' : 'Report') + '</button>'
          + '<button type="button" data-action="delete" class="is-danger">Delete</button>'
          + '</div>'
          + '</div>'
          + '<div class="review-card-head">'
          + '<span class="review-card-name">' + escapeHtml(r.name) + reportedTag + '</span>'
          + '<span class="review-card-date">' + formatDate(r.date) + editedTag + '</span>'
          + '</div>'
          + '<div class="review-card-stars">' + filled + empty + '</div>'
          + '<p class="review-card-text">' + escapeHtml(r.text) + '</p>'
          + media
          + '</article>';
      }).join('');
    }

    // ----- star picker -----
    const starPicker = document.getElementById('starPicker');
    const starButtons = [...starPicker.querySelectorAll('.star-btn')];
    let selectedRating = 0;

    function paintStars(uptoValue){
      starButtons.forEach(btn => {
        btn.classList.toggle('is-active', Number(btn.dataset.value) <= uptoValue);
      });
    }
    starButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.value)));
      btn.addEventListener('click', () => {
        selectedRating = Number(btn.dataset.value);
        starButtons.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        paintStars(selectedRating);
      });
    });
    starPicker.addEventListener('mouseleave', () => paintStars(selectedRating));

    // ----- media picker (attach photos/videos from the customer's device) -----
    const mediaInput = document.getElementById('reviewMedia');
    const feedback = document.getElementById('reviewFeedback');
    mediaInput.addEventListener('change', () => {
      const files = [...mediaInput.files];
      mediaInput.value = '';
      files.forEach(file => {
        if(pendingMedia.length >= MAX_MEDIA_PER_REVIEW){
          feedback.classList.add('is-error');
          feedback.textContent = 'You can attach up to ' + MAX_MEDIA_PER_REVIEW + ' photos or videos per review.';
          return;
        }
        if(file.size > MAX_FILE_BYTES){
          feedback.classList.add('is-error');
          feedback.textContent = '"' + file.name + '" is too large - please keep files under 4MB.';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          pendingMedia.push({
            type: file.type.startsWith('video/') ? 'video' : 'image',
            dataUrl: reader.result,
            name: file.name
          });
          renderMediaPreview();
        };
        reader.readAsDataURL(file);
      });
    });
    document.getElementById('reviewMediaPreview').addEventListener('click', e => {
      const btn = e.target.closest('.remove-media');
      if(!btn) return;
      pendingMedia.splice(Number(btn.dataset.index), 1);
      renderMediaPreview();
    });

    // ----- edit-mode helpers -----
    const formTitle = document.querySelector('.review-form-title');
    const submitBtn = reviewForm.querySelector('.review-submit');
    const cancelEditBtn = document.getElementById('reviewCancelEdit');

    function resetForm(){
      reviewForm.reset();
      selectedRating = 0;
      pendingMedia = [];
      starButtons.forEach(b => b.setAttribute('aria-pressed', 'false'));
      paintStars(0);
      renderMediaPreview();
    }
    function enterEditMode(review){
      editingId = review.id;
      document.getElementById('reviewName').value = review.name;
      document.getElementById('reviewText').value = review.text;
      selectedRating = review.rating;
      starButtons.forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.value) === review.rating ? 'true' : 'false'));
      paintStars(review.rating);
      pendingMedia = (review.media || []).slice();
      renderMediaPreview();
      formTitle.textContent = 'Edit your review';
      submitBtn.textContent = 'Update Review';
      cancelEditBtn.hidden = false;
      feedback.classList.remove('is-error');
      feedback.textContent = '';
      reviewForm.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    function exitEditMode(){
      editingId = null;
      formTitle.textContent = 'Leave a review';
      submitBtn.textContent = 'Send Review';
      cancelEditBtn.hidden = true;
    }
    cancelEditBtn.addEventListener('click', () => {
      resetForm();
      exitEditMode();
    });

    // ----- per-card "..." menu: edit / report / delete (event-delegated
    // since cards are re-rendered from scratch on every change) -----
    const reviewList = document.getElementById('reviewList');
    function closeAllMenus(){
      reviewList.querySelectorAll('.review-menu.is-open').forEach(m => {
        m.classList.remove('is-open');
        m.querySelector('.review-menu-btn').setAttribute('aria-expanded', 'false');
      });
    }
    reviewList.addEventListener('click', e => {
      const menuBtn = e.target.closest('.review-menu-btn');
      if(menuBtn){
        const menu = menuBtn.closest('.review-menu');
        const wasOpen = menu.classList.contains('is-open');
        closeAllMenus();
        if(!wasOpen){
          menu.classList.add('is-open');
          menuBtn.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      const actionBtn = e.target.closest('[data-action]');
      if(!actionBtn || actionBtn.disabled) return;
      const id = actionBtn.closest('.review-card').dataset.id;
      const review = reviews.find(r => r.id === id);
      if(!review) return;

      if(actionBtn.dataset.action === 'delete'){
        if(!window.confirm("Delete this review? This can't be undone.")) return;
        reviews = reviews.filter(r => r.id !== id);
        saveReviews(reviews);
        if(editingId === id){ resetForm(); exitEditMode(); }
        renderSummary();
        renderList();
      } else if(actionBtn.dataset.action === 'report'){
        review.reported = true;
        saveReviews(reviews);
        renderList();
      } else if(actionBtn.dataset.action === 'edit'){
        closeAllMenus();
        enterEditMode(review);
      }
    });
    document.addEventListener('click', e => {
      if(!e.target.closest('.review-menu')) closeAllMenus();
    });

    // ----- submit: create a new review, or save changes to one being edited -----
    reviewForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('reviewName').value.trim();
      const text = document.getElementById('reviewText').value.trim();

      if(!name || !text || !selectedRating){
        feedback.classList.add('is-error');
        feedback.textContent = 'Please add your name, a rating, and a few words, then send again.';
        return;
      }

      const wasEditing = !!editingId;
      let rollback;
      if(wasEditing){
        const review = reviews.find(r => r.id === editingId);
        rollback = Object.assign({}, review);
        Object.assign(review, { name, text, rating:selectedRating, media:pendingMedia.slice(), edited:true });
      } else {
        reviews.unshift({
          id:makeId(), name, rating:selectedRating, text,
          date:new Date().toISOString(), media:pendingMedia.slice(), reported:false
        });
      }

      if(!saveReviews(reviews)){
        if(wasEditing){
          Object.assign(reviews.find(r => r.id === editingId), rollback);
        } else {
          reviews.shift();
        }
        feedback.classList.add('is-error');
        feedback.textContent = "That didn't fit in your browser's storage - try removing a photo or video and sending again.";
        return;
      }

      resetForm();
      if(wasEditing) exitEditMode();

      feedback.classList.remove('is-error');
      feedback.textContent = wasEditing ? 'Your review has been updated!' : 'Thank you - your review has been posted!';

      renderSummary();
      renderList();
    });

    renderSummary();
    renderList();
  }

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
