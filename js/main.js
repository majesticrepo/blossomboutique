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
      // The bar now renders above the overlay on mobile (see CSS) so the
      // toggle stays reachable; force its opaque/gold look regardless of
      // scroll position so it reads clearly against every colour page.
      nav.classList.add('scrolled');
      nav.classList.remove('on-hero');
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
      updateNavState();
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
    // "Back to Products" links point at the real products.html page rather
    // than a same-page hash, so those are left alone to navigate normally.
    document.querySelectorAll('a.nav-dot, a.back-link').forEach(link => {
      const href = link.getAttribute('href');
      if(!href.startsWith('#')) return;
      link.addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = href.replace('#', '');
      });
    });
  }

  // ----- Bloom colour palette + cursor tint: these apply on every page that
  // has colour swatches - home's flower grid, the products page's colour
  // row, and the product cards - not just index.html. -----
  const bloomPalette = {
    red:'#C0392B', orange:'#D96C2B', yellow:'#DDAF35', green:'#6B8F52',
    blue:'#5F8DBF', purple:'#8B6FA8', pink:'#E39FB0', brown:'#7B5A3E',
    black:'#2A2622', white:'#FFFFFF', beige:'#D8C7A8', gold:'#9C7A32'
  };

  function bloomNameFromLink(link){
    const item = link.closest('.flower-item');
    if(item){
      const swatchClass = [...item.classList].find(c => c.startsWith('c-'));
      if(swatchClass) return swatchClass.slice(2);
    }
    const page = link.closest('[id^="page-"], [id^="detail-"], [id^="product-"]');
    if(page) return page.id.replace('page-', '').replace('detail-', '').replace('product-', '');
    return null;
  }

  function bloomColour(link){
    if(link.dataset.colourHex) return link.dataset.colourHex;
    return bloomPalette[bloomNameFromLink(link)] || '#C6A15B';
  }

  // ----- Mouse-only: tint the cursor to match the bloom being hovered -----
  const canHoverWithMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(canHoverWithMouse){
    document.querySelectorAll('a.flower-item, a.bloom-link').forEach(link => {
      const hex = bloomColour(link);
      // A white ring on a white fill would be invisible, so white gets a
      // gold ring instead - every other colour keeps its white ring.
      const ringColour = (hex === '#FFFFFF' || hex === '#FBF8F2') ? '#C6A15B' : 'white';
      const cursorSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'>"
        + "<circle cx='15' cy='15' r='11' fill='" + hex + "' stroke='" + ringColour + "' stroke-width='2.5'/></svg>";
      const cursorUrl = 'url("data:image/svg+xml,' + encodeURIComponent(cursorSvg) + '") 15 15, pointer';
      link.addEventListener('mouseenter', () => { link.style.cursor = cursorUrl; });
      link.addEventListener('mouseleave', () => { link.style.cursor = ''; });
    });
  }

  // ----- Click a bloom: only on index.html, where the colour-overlay exists,
  // does clicking grow it into a full-screen burst transition; elsewhere
  // (including the products page) the same links navigate their own way -----
  if(overlay){
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
    const hex = bloomColour(link);
    burst.style.left = (rect.left + rect.width / 2) + 'px';
    burst.style.top = (rect.top + rect.height / 2) + 'px';
    burst.style.background = hex;
    // White needs a gold ring to stay visible while it grows over the
    // ivory page background - every other colour has enough contrast on its own.
    burst.classList.toggle('burst-white', hex === '#FFFFFF');
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
  } // if(overlay)

  // Hero is now a full-bleed scene, so petals spread across the whole
  // photo rather than one smaller canopy box.
  const heroCanopyPoints = [
    {x:8,y:10},{x:20,y:6},{x:32,y:14},{x:44,y:8},{x:14,y:22},{x:26,y:26},
    {x:38,y:20},{x:50,y:24},{x:60,y:12},{x:70,y:20},{x:18,y:36},{x:34,y:40},
    {x:48,y:34},{x:58,y:38},{x:66,y:30},{x:10,y:44},{x:42,y:48},{x:54,y:46}
  ];

  // ----- Reviews page: star-rating picker, submit/edit/delete/report, and
  // the average-rating summary at the top. Reviews live in localStorage as
  // the always-available copy, each with a stable id so cards can be
  // deleted or updated in place. When REMOTE_REVIEWS_URL below is set to a
  // real endpoint, the same list is also synced there so every visitor sees
  // the same reviews, refreshed on a timer - see syncFromRemote(). -----
  const reviewForm = document.getElementById('reviewForm');
  if(reviewForm){
    const STORAGE_KEY = 'bb_reviews_v2';
    const MAX_MEDIA_PER_REVIEW = 4;
    const MAX_FILE_BYTES = 4 * 1024 * 1024; // keep individual files sane for localStorage

    // ----- media lightbox: click any attached photo/video (the reviewer's
    // own picks while composing, or media on a published review) to see it
    // enlarged - covers both "the person" and "others" reading reviews -----
    const mediaLightbox = document.createElement('div');
    mediaLightbox.className = 'media-lightbox';
    mediaLightbox.setAttribute('aria-hidden', 'true');
    mediaLightbox.innerHTML =
      '<div class="media-lightbox-backdrop"></div>' +
      '<button type="button" class="media-lightbox-close" aria-label="Close">&times;</button>' +
      '<div class="media-lightbox-content"></div>';
    document.body.appendChild(mediaLightbox);
    const lightboxContent = mediaLightbox.querySelector('.media-lightbox-content');
    function closeLightbox(){
      mediaLightbox.classList.remove('is-open');
      mediaLightbox.setAttribute('aria-hidden', 'true');
      lightboxContent.innerHTML = '';
      document.body.classList.remove('lightbox-open');
    }
    function openLightbox(mediaEl){
      lightboxContent.innerHTML = '';
      let clone;
      if(mediaEl.tagName === 'VIDEO'){
        clone = document.createElement('video');
        clone.src = mediaEl.currentSrc || mediaEl.src;
        clone.controls = true;
        clone.autoplay = true;
        clone.playsInline = true;
      } else {
        clone = document.createElement('img');
        clone.src = mediaEl.currentSrc || mediaEl.src;
        clone.alt = '';
      }
      lightboxContent.appendChild(clone);
      mediaLightbox.classList.add('is-open');
      mediaLightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }
    mediaLightbox.querySelector('.media-lightbox-close').addEventListener('click', closeLightbox);
    mediaLightbox.querySelector('.media-lightbox-backdrop').addEventListener('click', closeLightbox);
    window.addEventListener('keydown', e => { if(e.key === 'Escape' && mediaLightbox.classList.contains('is-open')) closeLightbox(); });
    document.addEventListener('click', e => {
      if(e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO'){
        const thumb = e.target.closest('.review-media-thumb');
        if(thumb) openLightbox(e.target);
      }
    });

    // Set this to a real endpoint to make reviews shared across every visitor
    // instead of just the browser that posted them (see README for how to
    // get one, e.g. a free npoint.io bin). Left blank, reviews stay
    // per-browser exactly as before. Expected contract: GET returns the
    // reviews array (or {reviews:[...]}) as JSON; POST with a JSON array
    // body overwrites it.
    const REMOTE_REVIEWS_URL = '';

    const defaultSeedReviews = [
      { id:'seed-1', name:'Amara O.', rating:5, text:"The Champagne Fan box was even more stunning in person - felt like unwrapping a piece of jewellery. Will absolutely order again.", date:'2026-06-14T10:00:00.000Z', media:[], reported:false },
      { id:'seed-2', name:'Priya K.', rating:5, text:'Ordered the Sakura Fan for a birthday and it arrived perfectly wrapped. The gold box made it feel extra special.', date:'2026-05-02T10:00:00.000Z', media:[], reported:false },
      { id:'seed-3', name:'Daniel R.', rating:4, text:'Beautiful craftsmanship and fast delivery. Wish there were a couple more size options, but the quality made up for it.', date:'2026-03-21T10:00:00.000Z', media:[], reported:false }
    ];

    function makeId(){
      return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'r-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    // ----- per-browser author id, so a customer can only delete reviews they themselves posted -----
    const AUTHOR_KEY = 'bb_review_author_id';
    let authorId = localStorage.getItem(AUTHOR_KEY);
    if(!authorId){
      authorId = makeId();
      try{ localStorage.setItem(AUTHOR_KEY, authorId); }catch(e){}
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
        pushRemote(list); // best-effort; localStorage above is the source of truth if this fails
        return true;
      }catch(e){
        return false;
      }
    }

    // ----- optional shared backend: pushes/pulls the same list everyone else
    // sees. Silently no-ops when REMOTE_REVIEWS_URL is blank. -----
    function pushRemote(list){
      if(!REMOTE_REVIEWS_URL) return;
      fetch(REMOTE_REVIEWS_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(list)
      }).catch(() => {}); // offline/unreachable - localStorage still has it
    }
    async function fetchRemote(){
      if(!REMOTE_REVIEWS_URL) return null;
      try{
        const res = await fetch(REMOTE_REVIEWS_URL, { cache:'no-store' });
        if(!res.ok) return null;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.reviews;
        return Array.isArray(list) ? list : null;
      }catch(e){
        return null;
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
      document.getElementById('ratingStars').innerHTML = [1,2,3,4,5].map(i => {
        const fill = Math.max(0, Math.min(1, average - (i - 1))) * 100;
        return '<span class="rs-star" style="--fill:' + fill + '%">★</span>';
      }).join('');
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
        const reportReason = (r.reported && r.reportReason)
          ? '<div class="review-report-reason">Reported for: ' + escapeHtml(r.reportReason) + '</div>'
          : '';
        const editedTag = r.edited ? ' <span class="review-edited-tag">(edited)</span>' : '';
        const isOwner = r.authorId && r.authorId === authorId;
        return '<article class="review-card' + (r.reported ? ' is-reported' : '') + '" data-id="' + r.id + '">'
          + '<div class="review-menu">'
          + '<button type="button" class="review-menu-btn" aria-haspopup="true" aria-expanded="false" aria-label="Review options">&#8942;</button>'
          + '<div class="review-menu-dropdown">'
          + (isOwner ? '<button type="button" data-action="edit">Edit</button>' : '')
          + '<button type="button" data-action="report"' + (r.reported ? ' disabled' : '') + '>' + (r.reported ? 'Reported' : 'Report') + '</button>'
          + (isOwner ? '<button type="button" data-action="delete" class="is-danger">Delete</button>' : '')
          + '</div>'
          + '</div>'
          + '<div class="review-card-head">'
          + '<span class="review-card-name">' + escapeHtml(r.name) + reportedTag + '</span>'
          + '<span class="review-card-date">' + formatDate(r.date) + editedTag + '</span>'
          + '</div>'
          + '<div class="review-card-stars">' + filled + empty + '</div>'
          + '<p class="review-card-text">' + escapeHtml(r.text) + '</p>'
          + reportReason
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

    // "Files" opens the picker as-is; the "+" button reveals Files/Videos/Photos
    // shortcuts that scope the picker's accept type - choosing Photos or Videos
    // is what lets the browser open straight to the device's gallery/camera roll.
    const mediaPicker = document.getElementById('mediaPicker');
    const mediaFilesBtn = document.getElementById('mediaFilesBtn');
    const mediaAddBtn = document.getElementById('mediaAddBtn');
    const mediaAddMenu = document.getElementById('mediaAddMenu');

    function closeMediaMenu(){
      mediaPicker.classList.remove('is-open');
      mediaAddBtn.setAttribute('aria-expanded', 'false');
    }
    mediaFilesBtn.addEventListener('click', () => {
      mediaInput.accept = 'image/*,video/*';
      mediaInput.click();
    });
    mediaAddBtn.addEventListener('click', () => {
      const willOpen = !mediaPicker.classList.contains('is-open');
      closeMediaMenu();
      if(willOpen){
        mediaPicker.classList.add('is-open');
        mediaAddBtn.setAttribute('aria-expanded', 'true');
      }
    });
    mediaAddMenu.addEventListener('click', e => {
      const btn = e.target.closest('button[data-accept]');
      if(!btn) return;
      mediaInput.accept = btn.dataset.accept;
      closeMediaMenu();
      mediaInput.click();
    });
    document.addEventListener('click', e => {
      if(!e.target.closest('#mediaPicker')) closeMediaMenu();
    });

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
        if(review.authorId !== authorId) return; // you can only delete your own reviews
        if(!window.confirm("Delete this review? This can't be undone.")) return;
        reviews = reviews.filter(r => r.id !== id);
        saveReviews(reviews);
        if(editingId === id){ resetForm(); exitEditMode(); }
        renderSummary();
        renderList();
      } else if(actionBtn.dataset.action === 'report'){
        closeAllMenus();
        openReportModal(id);
      } else if(actionBtn.dataset.action === 'edit'){
        if(review.authorId !== authorId) return; // you can only edit your own reviews
        closeAllMenus();
        enterEditMode(review);
      }
    });
    document.addEventListener('click', e => {
      if(!e.target.closest('.review-menu')) closeAllMenus();
    });

    // ----- report modal: pick a reason before a review gets flagged -----
    const reportModal = document.getElementById('reportModal');
    let reportTargetId = null;
    function openReportModal(id){
      reportTargetId = id;
      reportModal.querySelectorAll('input[name="reportReason"]').forEach(i => { i.checked = false; });
      document.getElementById('reportModalError').hidden = true;
      reportModal.hidden = false;
    }
    function closeReportModal(){
      reportModal.hidden = true;
      reportTargetId = null;
    }
    if(reportModal){
      document.getElementById('reportModalCancel').addEventListener('click', closeReportModal);
      document.getElementById('reportModalBackdrop').addEventListener('click', closeReportModal);
      window.addEventListener('keydown', e => { if(e.key === 'Escape' && !reportModal.hidden) closeReportModal(); });
      document.getElementById('reportModalSubmit').addEventListener('click', () => {
        const chosen = reportModal.querySelector('input[name="reportReason"]:checked');
        if(!chosen){
          document.getElementById('reportModalError').hidden = false;
          return;
        }
        const review = reviews.find(r => r.id === reportTargetId);
        if(review){
          review.reported = true;
          review.reportReason = chosen.value;
          saveReviews(reviews);
          renderList();
        }
        closeReportModal();
      });
    }

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
          date:new Date().toISOString(), media:pendingMedia.slice(), reported:false, authorId
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

    // ----- keep the page live -----
    function applyIncomingList(list){
      if(JSON.stringify(list) === JSON.stringify(reviews)) return;
      reviews = list;
      if(editingId && !reviews.some(r => r.id === editingId)){
        resetForm();
        exitEditMode();
      }
      renderSummary();
      renderList();
    }
    // Same-device multi-tab: pick up reviews saved from another tab right away.
    function refreshFromStorage(){
      applyIncomingList(loadReviews());
    }
    window.addEventListener('storage', e => {
      if(e.key === STORAGE_KEY) refreshFromStorage();
    });

    if(REMOTE_REVIEWS_URL){
      // Every visitor: pull the shared list on load, then every 60s so a
      // review posted by someone else shows up for everyone within a minute.
      async function refreshFromRemote(){
        const remote = await fetchRemote();
        if(!remote) return;
        applyIncomingList(remote);
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); }catch(e){}
      }
      refreshFromRemote();
      setInterval(refreshFromRemote, 60 * 1000);
    } else {
      // No shared backend configured - fall back to the local-only refresh
      // so at least this browser's own tabs stay in sync with each other.
      setInterval(refreshFromStorage, 2 * 60 * 1000);
    }
  }

  // ----- Contact page: no backend, so submitting just confirms in place
  // and keeps a copy in localStorage in case it's ever worth wiring to a
  // real inbox later (same pattern as reviews' shared-store hook). -----
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();
      const feedback = document.getElementById('contactFeedback');
      if(!name || !email || !message){
        feedback.textContent = 'Please fill in every field before sending.';
        return;
      }
      try{
        const key = 'bb_contact_messages';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push({ name, email, message, date:new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(list));
      }catch(err){}
      contactForm.reset();
      feedback.textContent = 'Thank you, ' + name.split(' ')[0] + ' — we\'ll get back to you soon.';
    });
  }

  // ----- Home page: small "what customers say" preview, reading the same
  // review list the Reviews page uses (falls back to a couple of curated
  // lines if nothing has been saved to this browser yet). -----
  const homePreview = document.getElementById('homeReviewsPreview');
  if(homePreview){
    const fallback = [
      { name:'Amara O.', rating:5, text:"The Champagne Fan box was even more stunning in person - felt like unwrapping a piece of jewellery." },
      { name:'Priya K.', rating:5, text:'Ordered the Sakura Fan for a birthday and it arrived perfectly wrapped. The gold box made it feel extra special.' },
      { name:'Daniel R.', rating:4, text:'Beautiful craftsmanship and fast delivery. Wish there were a couple more size options, but the quality made up for it.' }
    ];
    let list = fallback;
    try{
      const raw = localStorage.getItem('bb_reviews_v2');
      if(raw){
        const parsed = JSON.parse(raw);
        if(Array.isArray(parsed) && parsed.length) list = parsed;
      }
    }catch(e){}
    const top = list.filter(r => !r.reported).slice().sort((a, b) => b.rating - a.rating).slice(0, 3);
    const escape = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
    homePreview.innerHTML = top.map(r => {
      const filled = '★'.repeat(r.rating);
      const empty = '<span class="star-empty">' + '★'.repeat(5 - r.rating) + '</span>';
      return '<div class="reviews-teaser-card">'
        + '<div class="reviews-teaser-stars">' + filled + empty + '</div>'
        + '<p class="reviews-teaser-text">“' + escape(r.text) + '”</p>'
        + '<div class="reviews-teaser-name">' + escape(r.name) + '</div>'
        + '</div>';
    }).join('');
  }

  const wrap = document.getElementById('heroPetals');
  const petalsPerSpawn = 34;
  for(let i=0; wrap && i<petalsPerSpawn; i++){
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

// ----- Account: sign up / log in with an email, Google address, or phone
  // number, plus a nickname. This site has no backend, so there's no real
  // authentication, OAuth, or SMS involved - "logging in" just looks up the
  // nickname + cart saved under that identifier in this browser's storage,
  // so coming back and using the same email/phone/Google address on this
  // device restores your cart. Injected into every page's nav since the nav
  // markup itself is duplicated per-page rather than shared. -----
  (function(){
    const ACCOUNTS_KEY = 'bb_accounts';
    const CURRENT_ACCOUNT_KEY = 'bb_current_account';
    const METHOD_LABELS = { email: 'Email address', google: 'Google email', phone: 'Phone number' };
    const METHOD_PLACEHOLDERS = { email: 'you@example.com', google: 'you@gmail.com', phone: '+1 555 123 4567' };
    const METHOD_INPUT_TYPES = { email: 'email', google: 'email', phone: 'tel' };

    function getAccounts(){
      try{ return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {}; }
      catch(e){ return {}; }
    }
    function saveAccounts(accounts){
      try{ localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }catch(e){}
    }
    function getCurrentAccountId(){
      try{ return localStorage.getItem(CURRENT_ACCOUNT_KEY); }catch(e){ return null; }
    }
    function setCurrentAccountId(id){
      try{
        if(id) localStorage.setItem(CURRENT_ACCOUNT_KEY, id);
        else localStorage.removeItem(CURRENT_ACCOUNT_KEY);
      }catch(e){}
    }
    function getCurrentAccount(){
      const id = getCurrentAccountId();
      return id ? getAccounts()[id] : null;
    }
    window.bbAccount = { getCurrentAccountId, cartKeyFor: id => id ? 'bb_cart_' + id : 'bb_cart' };

    // ----- nav: "Sign In" (logged out) or "Hi, <nickname>  Log out" (logged
    // in), inserted just after the Cart link on whichever page is open -----
    const navLinks = document.getElementById('navLinks');
    let navAccount = null;
    if(navLinks){
      const cartLi = navLinks.querySelector('.nav-cart-link')?.closest('li');
      navAccount = document.createElement('li');
      navAccount.id = 'navAccount';
      navAccount.className = 'nav-account';
      if(cartLi) cartLi.after(navAccount);
      else navLinks.appendChild(navAccount);
    }
    function renderAccountNav(){
      if(!navAccount) return;
      navAccount.innerHTML = '';
      const account = getCurrentAccount();
      if(account){
        const name = document.createElement('span');
        name.className = 'nav-account-name';
        name.textContent = 'Hi, ' + account.nickname;
        const logout = document.createElement('a');
        logout.href = '#';
        logout.className = 'nav-account-logout';
        logout.textContent = 'Log out';
        logout.addEventListener('click', e => {
          e.preventDefault();
          setCurrentAccountId(null);
          renderAccountNav();
          if(typeof refreshCartViews === 'function') refreshCartViews();
        });
        navAccount.append(name, logout);
      } else {
        const link = document.createElement('a');
        link.href = '#';
        link.id = 'accountNavLink';
        link.textContent = 'Sign In';
        link.addEventListener('click', e => { e.preventDefault(); openAccountModal(); });
        navAccount.appendChild(link);
      }
    }

    // ----- modal: a Sign In / Log In tab switch on top of one shared method
    // row (Email/Google/Phone) + nickname + identifier. The tabs only relabel
    // the title and submit button - submitting still looks the identifier up
    // underneath: an existing match logs straight in (nickname + cart come
    // from what was saved before), a new one signs up and carries over
    // whatever's currently in the cart. -----
    const modal = document.createElement('div');
    modal.className = 'account-modal';
    modal.id = 'accountModal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="account-modal-backdrop"></div>' +
      '<div class="account-modal-panel" role="dialog" aria-modal="true" aria-labelledby="accountModalTitle">' +
        '<button type="button" class="account-modal-close" aria-label="Close">&times;</button>' +
        '<div class="account-mode-row" role="tablist" aria-label="Sign in or log in">' +
          '<button type="button" class="account-mode-btn is-active" data-mode="signin" role="tab" aria-selected="true">Sign In</button>' +
          '<button type="button" class="account-mode-btn" data-mode="login" role="tab" aria-selected="false">Log In</button>' +
        '</div>' +
        '<h3 id="accountModalTitle">Sign in to your account</h3>' +
        '<p class="account-modal-sub">This site doesn’t have a server, so there’s no real Google sign-in or SMS — use any email, Google address, or phone number as your key, and this browser remembers your nickname and cart for it.</p>' +
        '<div class="account-method-row" role="group" aria-label="Sign-in method">' +
          '<button type="button" class="account-method-btn is-active" data-method="email">Email</button>' +
          '<button type="button" class="account-method-btn" data-method="google">Google</button>' +
          '<button type="button" class="account-method-btn" data-method="phone">Phone</button>' +
        '</div>' +
        '<form id="accountForm">' +
          '<label class="account-field">' +
            '<span id="accountIdentifierLabel">Email address</span>' +
            '<input type="email" id="accountIdentifier" autocomplete="email" required>' +
          '</label>' +
          '<label class="account-field" id="accountNicknameField">' +
            '<span>Nickname</span>' +
            '<input type="text" id="accountNickname" placeholder="Pick a nickname" autocomplete="nickname">' +
          '</label>' +
          '<p class="account-modal-error" id="accountModalError" hidden></p>' +
          '<button type="submit" class="account-submit-btn">Sign In</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    const modeBtns = modal.querySelectorAll('.account-mode-btn');
    const titleEl = modal.querySelector('#accountModalTitle');
    const submitBtn = modal.querySelector('.account-submit-btn');
    const nicknameField = modal.querySelector('#accountNicknameField');
    const MODE_TITLES = { signin: 'Sign in to your account', login: 'Log in to your account' };
    const MODE_SUBMIT_LABELS = { signin: 'Sign In', login: 'Log In' };
    let currentMode = 'signin';
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        modeBtns.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-selected', String(isActive));
        });
        titleEl.textContent = MODE_TITLES[currentMode];
        submitBtn.textContent = MODE_SUBMIT_LABELS[currentMode];
        // Log In is for returning customers only - they already picked a
        // nickname when they signed up, so there's nothing to ask here.
        // (.account-field has its own `display:block`, which beats the
        // UA [hidden] stylesheet rule, so set display directly instead.)
        nicknameField.style.display = currentMode === 'login' ? 'none' : '';
        errorEl.hidden = true;
      });
    });

    const backdrop = modal.querySelector('.account-modal-backdrop');
    const closeBtn = modal.querySelector('.account-modal-close');
    const methodBtns = modal.querySelectorAll('.account-method-btn');
    const identifierInput = modal.querySelector('#accountIdentifier');
    const identifierLabel = modal.querySelector('#accountIdentifierLabel');
    const nicknameInput = modal.querySelector('#accountNickname');
    const errorEl = modal.querySelector('#accountModalError');
    const form = modal.querySelector('#accountForm');
    let currentMethod = 'email';

    function openAccountModal(){
      modal.hidden = false;
      document.body.classList.add('account-modal-open');
      errorEl.hidden = true;
      identifierInput.value = '';
      nicknameInput.value = '';
      identifierInput.focus();
    }
    function closeAccountModal(){
      modal.hidden = true;
      document.body.classList.remove('account-modal-open');
    }
    backdrop.addEventListener('click', closeAccountModal);
    closeBtn.addEventListener('click', closeAccountModal);
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && !modal.hidden) closeAccountModal();
    });
    methodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentMethod = btn.dataset.method;
        methodBtns.forEach(b => b.classList.toggle('is-active', b === btn));
        identifierLabel.textContent = METHOD_LABELS[currentMethod];
        identifierInput.placeholder = METHOD_PLACEHOLDERS[currentMethod];
        identifierInput.type = METHOD_INPUT_TYPES[currentMethod];
      });
    });

    function showError(message){
      errorEl.textContent = message;
      errorEl.hidden = false;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const identifier = identifierInput.value.trim();
      const nickname = nicknameInput.value.trim();
      if(!identifier){ showError('Please enter your ' + METHOD_LABELS[currentMethod].toLowerCase() + '.'); return; }

      const accountId = currentMethod + ':' + identifier.toLowerCase();
      const accounts = getAccounts();
      const existing = accounts[accountId];

      if(!existing && currentMode === 'login'){
        showError('We couldn’t find an account for that ' + METHOD_LABELS[currentMethod].toLowerCase() + ' — switch to Sign In to create one.');
        return;
      }

      if(!existing && !nickname){
        showError('Pick a nickname to finish signing up — you won’t need it again after that.');
        return;
      }

      if(!existing){
        // New sign-up: carry over whatever's already in the guest cart so
        // nothing they'd already added gets lost.
        let guestCart = [];
        try{ guestCart = JSON.parse(localStorage.getItem('bb_cart')) || []; }catch(err){}
        accounts[accountId] = { method: currentMethod, identifier, nickname, createdAt: Date.now() };
        saveAccounts(accounts);
        try{ localStorage.setItem('bb_cart_' + accountId, JSON.stringify(guestCart)); }catch(err){}
      }

      setCurrentAccountId(accountId);
      renderAccountNav();
      closeAccountModal();
      if(typeof refreshCartViews === 'function') refreshCartViews();
    });

    renderAccountNav();
  })();

// ----- Cart: localStorage-backed, shared across every page via the nav
  // badge and a Temu-style slide-in drawer. products.html's Add to Cart/Buy
  // buttons (grid cards and the single-product overlay) write to it, and
  // cart.html plus the drawer both read it back. Once signed in, the cart is
  // scoped to that account (see window.bbAccount above) so logging back in
  // with the same email/phone/Google address on this browser brings it back. -----
  function CART_KEY_FN(){ return window.bbAccount ? window.bbAccount.cartKeyFor(window.bbAccount.getCurrentAccountId()) : 'bb_cart'; }
  const DEFAULT_PRICE = 12.54;
  const colourHex = {
    Red:'#C0392B', Orange:'#D96C2B', Yellow:'#DDAF35', Green:'#6B8F52',
    Blue:'#5F8DBF', Purple:'#8B6FA8', Pink:'#E39FB0', Brown:'#7B5A3E',
    Black:'#2A2622', White:'#FBF8F2', Beige:'#D8C7A8', Gold:'#9C7A32',
  };

  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY_FN())) || []; }
    catch(e){ return []; }
  }
  function saveCart(cart){
    try{ localStorage.setItem(CART_KEY_FN(), JSON.stringify(cart)); }catch(e){}
  }
  function cartItemPrice(item){ return Number(item.price) || DEFAULT_PRICE; }
  function cartCount(cart){ return cart.reduce((sum, item) => sum + item.qty, 0); }
  function cartSubtotal(cart){ return cart.reduce((sum, item) => sum + cartItemPrice(item) * item.qty, 0); }
  function formatPrice(n){ return '$' + n.toFixed(2); }

  // ----- Order history: a receipt is saved (same account scoping as the
  // cart, guests included) each time checkout.html completes an order, so
  // the "My Orders" tab on cart.html has something to show even after the
  // cart itself has been cleared. -----
  function ORDERS_KEY_FN(){
    const id = window.bbAccount ? window.bbAccount.getCurrentAccountId() : null;
    return id ? 'bb_orders_' + id : 'bb_orders';
  }
  function getOrders(){
    try{ return JSON.parse(localStorage.getItem(ORDERS_KEY_FN())) || []; }
    catch(e){ return []; }
  }
  function saveOrders(orders){
    try{ localStorage.setItem(ORDERS_KEY_FN(), JSON.stringify(orders)); }catch(e){}
  }
  function addOrder(order){
    const orders = getOrders();
    orders.unshift(order); // newest first
    saveOrders(orders);
  }

  function updateCartBadge(){
    const count = cartCount(getCart());
    document.querySelectorAll('#cartCount, .cart-count').forEach(badge => {
      badge.textContent = count;
      badge.hidden = count === 0;
    });
  }
  // ----- little two-note "ding" so adding to cart is audible, not just visual.
  // Synthesised with the Web Audio API rather than an audio file, so there's
  // nothing to fetch and it works the instant the page loads. -----
  let sharedAudioCtx = null;
  function playCartChime(){
    try{
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if(!AudioCtx) return;
      if(!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
      if(sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
      const ctx = sharedAudioCtx;
      const now = ctx.currentTime;
      [[880, 0], [1318.5, 0.09]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      });
    }catch(e){ /* audio is a nice-to-have, never block the cart on it */ }
  }

  function addToCart(product, colour, scent, price){
    const cart = getCart();
    const existing = cart.find(item => item.product === product);
    if(existing){ existing.qty += 1; }
    else{ cart.push({ product, colour, scent, price: Number(price) || DEFAULT_PRICE, qty: 1 }); }
    saveCart(cart);
    playCartChime();
    refreshCartViews();
  }
  function setQty(index, qty){
    const cart = getCart();
    if(!cart[index]) return;
    if(qty <= 0){ cart.splice(index, 1); } else { cart[index].qty = qty; }
    saveCart(cart);
    refreshCartViews();
  }
  function removeFromCart(index){
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    refreshCartViews();
  }

  // ----- shared line-item row builder: used by both the full cart page
  // (cart.html) and the nav drawer, each with its own quantity +/- steppers -----
  function buildCartItemRow(item, index){
    const li = document.createElement('li');
    li.className = 'cart-item';

    const swatch = document.createElement('div');
    swatch.className = 'cart-item-swatch';
    swatch.style.background = colourHex[item.colour] || '#ccc';

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = item.product;
    const scent = document.createElement('div');
    scent.className = 'cart-item-scent';
    scent.textContent = item.scent;
    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(cartItemPrice(item));
    info.append(name, scent, price);

    const stepper = document.createElement('div');
    stepper.className = 'qty-stepper';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Decrease quantity');
    minus.addEventListener('click', () => setQty(index, item.qty - 1));
    const qtyLabel = document.createElement('span');
    qtyLabel.textContent = item.qty;
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Increase quantity');
    plus.addEventListener('click', () => setQty(index, item.qty + 1));
    stepper.append(minus, qtyLabel, plus);

    const remove = document.createElement('button');
    remove.className = 'cart-item-remove';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => removeFromCart(index));

    li.append(swatch, info, stepper, remove);
    return li;
  }

  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.product, btn.dataset.colour, btn.dataset.scent, btn.dataset.price));
  });
  document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.product, btn.dataset.colour, btn.dataset.scent, btn.dataset.price);
      window.location.href = 'cart.html';
    });
  });

  // ----- full cart page (cart.html) -----
  const cartList = document.getElementById('cartList');
  let renderCartPage = () => {};
  if(cartList){
    const cartEmpty = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotalCount = document.getElementById('cartTotalCount');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    renderCartPage = function(){
      const cart = getCart();
      if(cart.length === 0){
        cartEmpty.hidden = false;
        cartList.hidden = true;
        cartSummary.hidden = true;
        return;
      }
      cartEmpty.hidden = true;
      cartList.hidden = false;
      cartSummary.hidden = false;
      cartList.innerHTML = '';
      cart.forEach((item, index) => cartList.appendChild(buildCartItemRow(item, index)));
      cartTotalCount.textContent = cartCount(cart);
      cartTotalPrice.textContent = formatPrice(cartSubtotal(cart));
    };
  }

  // ----- "My Orders" tab (cart.html): a receipt card per past order, built
  // from order history saved when checkout.html completes. -----
  const ordersList = document.getElementById('ordersList');
  let renderOrdersPage = () => {};
  if(ordersList){
    const ordersEmpty = document.getElementById('ordersEmpty');
    const FULFIL_LABELS = { pickup: 'Store Pickup', delivery: 'Delivery' };
    function formatOrderDate(iso){
      const d = new Date(iso);
      if(isNaN(d)) return '';
      return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
    }
    function buildOrderCard(order){
      const li = document.createElement('li');
      li.className = 'order-card';

      const head = document.createElement('div');
      head.className = 'order-card-head';
      const idDate = document.createElement('div');
      const id = document.createElement('div');
      id.className = 'order-id';
      id.textContent = order.id;
      const date = document.createElement('div');
      date.className = 'order-date';
      date.textContent = formatOrderDate(order.date);
      idDate.append(id, date);
      const status = document.createElement('span');
      status.className = 'order-status';
      status.textContent = FULFIL_LABELS[order.fulfilment] || 'Order Placed';
      head.append(idDate, status);

      const items = document.createElement('ul');
      items.className = 'order-items';
      (order.items || []).forEach(item => {
        const row = document.createElement('li');
        row.className = 'order-item-row';
        const swatch = document.createElement('span');
        swatch.className = 'order-item-swatch';
        swatch.style.background = colourHex[item.colour] || '#ccc';
        const name = document.createElement('span');
        name.className = 'order-item-name';
        name.textContent = item.product;
        const qty = document.createElement('span');
        qty.className = 'order-item-qty';
        qty.textContent = 'Qty ' + item.qty;
        const price = document.createElement('span');
        price.className = 'order-item-price';
        price.textContent = formatPrice(item.price * item.qty);
        row.append(swatch, name, qty, price);
        items.appendChild(row);
      });

      const foot = document.createElement('div');
      foot.className = 'order-card-foot';
      const totalLabel = document.createElement('span');
      totalLabel.className = 'cart-total-label';
      totalLabel.textContent = (order.count || 0) + (order.count === 1 ? ' item' : ' items');
      const totalValue = document.createElement('span');
      totalValue.className = 'order-total-value';
      totalValue.textContent = formatPrice(order.total || 0);
      foot.append(totalLabel, totalValue);

      li.append(head, items, foot);
      return li;
    }
    renderOrdersPage = function(){
      const orders = getOrders();
      if(orders.length === 0){
        ordersEmpty.hidden = false;
        ordersList.hidden = true;
        return;
      }
      ordersEmpty.hidden = true;
      ordersList.hidden = false;
      ordersList.innerHTML = '';
      orders.forEach(order => ordersList.appendChild(buildOrderCard(order)));
    };
  }

  // ----- Cart / My Orders tab toggle on cart.html -----
  (function(){
    const cartTabBtn = document.getElementById('cartTabBtn');
    const ordersTabBtn = document.getElementById('ordersTabBtn');
    const cartWrapEl = document.getElementById('cartWrap');
    const ordersWrapEl = document.getElementById('ordersWrap');
    if(!cartTabBtn || !ordersTabBtn) return;
    function showTab(tab){
      const isCart = tab === 'cart';
      cartWrapEl.hidden = !isCart;
      ordersWrapEl.hidden = isCart;
      cartTabBtn.classList.toggle('is-active', isCart);
      ordersTabBtn.classList.toggle('is-active', !isCart);
      cartTabBtn.setAttribute('aria-selected', String(isCart));
      ordersTabBtn.setAttribute('aria-selected', String(!isCart));
    }
    cartTabBtn.addEventListener('click', () => showTab('cart'));
    ordersTabBtn.addEventListener('click', () => showTab('orders'));
  })();

  // ----- Temu-style slide-in cart drawer: built once in JS and appended to
  // every page's <body>, so the nav's Cart link opens it instead of always
  // navigating away - cart.html itself stays as the full-page fallback. -----
  function buildCartDrawer(){
    const backdrop = document.createElement('div');
    backdrop.className = 'cart-drawer-backdrop';

    const drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML =
      '<div class="cart-drawer-head">' +
        '<h3>Your Cart</h3>' +
        '<button type="button" class="cart-drawer-close" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<ul class="cart-drawer-list"></ul>' +
      '<p class="cart-drawer-empty">Your cart is empty.</p>' +
      '<div class="cart-drawer-foot">' +
        '<div class="cart-drawer-subtotal"><span>Subtotal</span><span class="cart-drawer-subtotal-value"></span></div>' +
        '<a class="btn-buy cart-drawer-checkout" href="cart.html">View Cart &amp; Checkout</a>' +
      '</div>';

    document.body.append(backdrop, drawer);

    function open(){
      render();
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cart-drawer-open');
    }
    function close(){
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cart-drawer-open');
    }
    drawer.querySelector('.cart-drawer-close').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    window.addEventListener('keydown', e => { if(e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });

    document.querySelectorAll('.nav-cart-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        open();
      });
    });

    function render(){
      const cart = getCart();
      const list = drawer.querySelector('.cart-drawer-list');
      const empty = drawer.querySelector('.cart-drawer-empty');
      const foot = drawer.querySelector('.cart-drawer-foot');
      list.innerHTML = '';
      if(cart.length === 0){
        empty.hidden = false;
        list.hidden = true;
        foot.hidden = true;
        return;
      }
      empty.hidden = true;
      list.hidden = false;
      foot.hidden = false;
      cart.forEach((item, index) => list.appendChild(buildCartItemRow(item, index)));
      drawer.querySelector('.cart-drawer-subtotal-value').textContent = formatPrice(cartSubtotal(cart));
    }

    return { render };
  }
  const cartDrawer = buildCartDrawer();

  function refreshCartViews(){
    updateCartBadge();
    renderCartPage();
    renderOrdersPage();
    cartDrawer.render();
  }
  refreshCartViews();

  // ----- checkout.html: Temu-style checkout - delivery/pickup fulfilment,
  // a card payment form (front-end only, nothing is transmitted anywhere),
  // and an order summary built from the same cart used everywhere else.
  // Placing the order clears the cart so nothing lingers afterwards. -----
  const checkoutForm = document.getElementById('checkoutForm');
  if(checkoutForm){
    const checkoutWrap = document.getElementById('checkoutWrap');
    const checkoutEmpty = document.getElementById('checkoutEmpty');
    const checkoutSummaryList = document.getElementById('checkoutSummaryList');
    const checkoutTotalCount = document.getElementById('checkoutTotalCount');
    const checkoutTotalPrice = document.getElementById('checkoutTotalPrice');
    const checkoutFeedback = document.getElementById('checkoutFeedback');
    const checkoutSuccess = document.getElementById('checkoutSuccess');
    const checkoutSuccessMsg = document.getElementById('checkoutSuccessMsg');
    const addressBlock = document.getElementById('addressBlock');
    const pickupNote = document.getElementById('pickupNote');

    function renderCheckoutSummary(){
      const cart = getCart();
      if(cart.length === 0){
        checkoutWrap.hidden = true;
        checkoutEmpty.hidden = false;
        return false;
      }
      checkoutWrap.hidden = false;
      checkoutEmpty.hidden = true;
      checkoutSummaryList.innerHTML = cart.map(item => {
        const swatch = colourHex[item.colour] || '#ccc';
        return '<li class="checkout-summary-item">'
          + '<div class="checkout-summary-swatch" style="background:' + swatch + '"></div>'
          + '<div class="checkout-summary-info">'
          + '<div class="checkout-summary-name">' + item.product + '</div>'
          + '<div class="checkout-summary-qty">Qty ' + item.qty + '</div>'
          + '</div>'
          + '<div class="checkout-summary-price">' + formatPrice(cartItemPrice(item) * item.qty) + '</div>'
          + '</li>';
      }).join('');
      checkoutTotalCount.textContent = cartCount(cart);
      checkoutTotalPrice.textContent = formatPrice(cartSubtotal(cart));
      return true;
    }
    const hadItems = renderCheckoutSummary();

    // ----- fulfilment toggle: delivery shows the address block, pickup hides it -----
    const fulfilRadios = checkoutForm.querySelectorAll('input[name="fulfilment"]');
    function updateFulfilmentView(){
      const isPickup = checkoutForm.querySelector('input[name="fulfilment"]:checked').value === 'pickup';
      addressBlock.hidden = isPickup;
      pickupNote.hidden = !isPickup;
    }
    fulfilRadios.forEach(r => r.addEventListener('change', updateFulfilmentView));
    updateFulfilmentView();

    // ----- light input formatting: card number spacing + expiry slash -----
    const cardNumberInput = document.getElementById('ckCardNumber');
    cardNumberInput.addEventListener('input', () => {
      cardNumberInput.value = cardNumberInput.value.replace(/[^\d]/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    const cardExpiryInput = document.getElementById('ckCardExpiry');
    cardExpiryInput.addEventListener('input', () => {
      let digits = cardExpiryInput.value.replace(/[^\d]/g, '').slice(0, 4);
      if(digits.length > 2) digits = digits.slice(0, 2) + '/' + digits.slice(2);
      cardExpiryInput.value = digits;
    });
    const cardCvvInput = document.getElementById('ckCardCvv');
    cardCvvInput.addEventListener('input', () => {
      cardCvvInput.value = cardCvvInput.value.replace(/[^\d]/g, '').slice(0, 4);
    });

    function markField(input, valid){
      input.classList.toggle('is-invalid', !valid);
      return valid;
    }

    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      if(getCart().length === 0) return;

      const isPickup = checkoutForm.querySelector('input[name="fulfilment"]:checked').value === 'pickup';
      const name = document.getElementById('ckName');
      const phone = document.getElementById('ckPhone');
      const cardName = document.getElementById('ckCardName');
      const cardNumber = document.getElementById('ckCardNumber');
      const cardExpiry = document.getElementById('ckCardExpiry');
      const cardCvv = document.getElementById('ckCardCvv');
      const address1 = document.getElementById('ckAddress1');
      const city = document.getElementById('ckCity');
      const state = document.getElementById('ckState');
      const zip = document.getElementById('ckZip');
      const country = document.getElementById('ckCountry');

      let ok = true;
      ok = markField(name, name.value.trim().length > 0) && ok;
      ok = markField(phone, phone.value.trim().length > 0) && ok;
      if(!isPickup){
        ok = markField(address1, address1.value.trim().length > 0) && ok;
        ok = markField(city, city.value.trim().length > 0) && ok;
        ok = markField(state, state.value.trim().length > 0) && ok;
        ok = markField(zip, zip.value.trim().length > 0) && ok;
        ok = markField(country, country.value.trim().length > 0) && ok;
      } else {
        [address1, city, state, zip, country].forEach(f => f.classList.remove('is-invalid'));
      }
      ok = markField(cardName, cardName.value.trim().length > 0) && ok;
      ok = markField(cardNumber, cardNumber.value.replace(/\s/g, '').length >= 13) && ok;
      ok = markField(cardExpiry, /^\d{2}\/\d{2}$/.test(cardExpiry.value.trim())) && ok;
      ok = markField(cardCvv, cardCvv.value.trim().length >= 3) && ok;

      if(!ok){
        checkoutFeedback.textContent = 'Please fill in every field so we can complete your order.';
        return;
      }

      checkoutFeedback.textContent = '';
      const last4 = cardNumber.value.replace(/\s/g, '').slice(-4);
      checkoutSuccessMsg.textContent = isPickup
        ? 'Thanks, ' + name.value.trim() + ' - we will text ' + phone.value.trim() + ' when your order is ready to collect in-store. Paid with card ending ' + last4 + '.'
        : 'Thanks, ' + name.value.trim() + ' - your order will be delivered to the address you provided. Paid with card ending ' + last4 + '.';

      // Save a receipt to order history before the cart is cleared, so
      // cart.html's "My Orders" tab has something to show afterwards.
      const cartAtCheckout = getCart();
      addOrder({
        id: 'BB-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        fulfilment: isPickup ? 'pickup' : 'delivery',
        name: name.value.trim(),
        phone: phone.value.trim(),
        address: isPickup ? null : {
          line1: address1.value.trim(),
          line2: document.getElementById('ckAddress2').value.trim(),
          city: city.value.trim(),
          state: state.value.trim(),
          zip: zip.value.trim(),
          country: country.value.trim(),
        },
        last4,
        items: cartAtCheckout.map(item => ({
          product: item.product, colour: item.colour, scent: item.scent,
          price: cartItemPrice(item), qty: item.qty,
        })),
        count: cartCount(cartAtCheckout),
        total: cartSubtotal(cartAtCheckout),
      });

      // Card details never leave this form and are never saved anywhere -
      // clear them immediately once the "payment" is done.
      checkoutForm.reset();

      saveCart([]);
      refreshCartViews();

      checkoutWrap.hidden = true;
      checkoutSuccess.hidden = false;
    });
  }

  // ----- products.html: single-product detail overlay. Clicking a product
  // card shows just that one colour full-screen, with its price and cart
  // actions - reuses the same .colour-page visuals/transition as index.html's
  // overlay, but lives in its own #productOverlay container with #product-
  // hash routing so the two never collide. -----
  const productOverlay = document.getElementById('productOverlay');
  if(productOverlay){
    const productPages = productOverlay.querySelectorAll('.product-page');
    function showProductPage(id){
      productOverlay.style.display = 'block';
      document.body.classList.add('scroll-locked');
      productPages.forEach(p => {
        const isMatch = p.id === id;
        p.style.display = isMatch ? 'flex' : 'none';
        p.classList.remove('active');
        if(isMatch) p.scrollTop = 0;
      });
      const activePage = document.getElementById(id);
      if(activePage){
        requestAnimationFrame(() => requestAnimationFrame(() => { activePage.classList.add('active'); }));
      }
    }
    function hideProductOverlay(){
      productOverlay.style.display = 'none';
      document.body.classList.remove('scroll-locked');
    }
    function handleProductHash(){
      const hash = window.location.hash;
      if(hash.startsWith('#product-')) showProductPage(hash.replace('#', ''));
      else hideProductOverlay();
    }
    window.addEventListener('hashchange', handleProductHash);
    handleProductHash();

    document.querySelectorAll('a.product-card-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = link.getAttribute('href').replace('#', '');
      });
    });
    productOverlay.querySelectorAll('[data-close-product]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        window.location.hash = '';
      });
    });

    // ----- Cartoon/Elegant fan-style toggle: one control at the top of the
    // products listing switches every product's pair of overlaid <svg>
    // images (data-style-img="cartoon"/"elegant") at once -----
    const globalStyleToggle = document.querySelector('.fan-style-toggle-row .fan-style-toggle');
    if(globalStyleToggle){
      const buttons = globalStyleToggle.querySelectorAll('.fan-style-btn');
      const images = document.querySelectorAll('[data-style-img]');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const style = btn.dataset.style;
          buttons.forEach(b => b.classList.toggle('is-active', b === btn));
          // SVG elements don't reliably reflect the `.hidden` IDL property to
          // the actual attribute (unlike plain HTML elements), so toggle the
          // content attribute directly instead.
          images.forEach(img => {
            if(img.dataset.styleImg === style) img.removeAttribute('hidden');
            else img.setAttribute('hidden', '');
          });
        });
      });
    }

    // ----- FANS / BOOKMARKS / BRACELETS category tabs: swap which panel
    // shows under the colour-dot row. Only Fans has real stock today; the
    // others switch to a short "coming soon" panel instead of the grid. -----
    const categoryTabs = document.querySelectorAll('.category-tab-row .category-tab');
    if(categoryTabs.length){
      const panels = document.querySelectorAll('[data-category-panel]');
      categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const category = tab.dataset.category;
          categoryTabs.forEach(t => t.classList.toggle('is-active', t === tab));
          panels.forEach(panel => {
            panel.hidden = panel.dataset.categoryPanel !== category;
          });
        });
      });
    }
  }
