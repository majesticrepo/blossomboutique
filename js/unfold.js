// The Unfold: pins the fan video full-screen while its scroll section passes
// by, and maps scroll progress straight onto the video's currentTime. Scrolling
// down plays the disassembly forward (comes apart); scrolling back up runs the
// exact same footage backward (comes back together) - one clip, driven purely
// by scroll position, so the two directions are guaranteed to match frame for
// frame.
(function(){
  const scene = document.getElementById('unfoldScene');
  const video = document.getElementById('unfoldVideo');
  const progressFill = document.getElementById('unfoldProgressFill');
  const captionEyebrow = document.getElementById('unfoldCaptionEyebrow');
  const captionTitle = document.getElementById('unfoldCaptionTitle');
  if(!scene || !video) return;

  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    scene.style.height = 'auto';
    return; // native controls (already in the markup) let them play it manually
  }

  video.removeAttribute('controls');

  let lastProgress = 0;
  let ticking = false;

  function setCaption(progress, direction){
    if(progress <= 0.02){
      captionEyebrow.textContent = 'Scroll down';
      captionTitle.innerHTML = 'Watch it <em>come apart</em>';
    } else if(progress >= 0.98){
      captionEyebrow.textContent = 'Scroll back up';
      captionTitle.innerHTML = 'See it <em>come together</em>';
    } else if(direction === 'up'){
      captionEyebrow.textContent = 'Coming together';
      captionTitle.innerHTML = 'Fold by <em>fold</em>, it returns';
    } else {
      captionEyebrow.textContent = 'Coming apart';
      captionTitle.innerHTML = 'Fold by <em>fold</em>, it unwinds';
    }
  }

  function update(){
    ticking = false;
    const sceneHeight = scene.offsetHeight;
    const scrollable = sceneHeight - window.innerHeight;
    const rect = scene.getBoundingClientRect();
    let progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.min(1, Math.max(0, progress));

    const duration = video.duration;
    if(duration > 0 && !isNaN(duration)){
      const target = progress * duration;
      if(Math.abs(video.currentTime - target) > 0.008){
        try{ video.currentTime = target; }catch(e){}
      }
    }

    progressFill.style.width = (progress * 100) + '%';

    const direction = progress === lastProgress ? null : (progress > lastProgress ? 'down' : 'up');
    setCaption(progress, direction || (progress < 0.5 ? 'down' : 'up'));
    lastProgress = progress;
  }

  function onScroll(){
    if(!ticking){
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  video.addEventListener('loadedmetadata', update);

  // iOS Safari only paints seeked frames reliably once the video has actually
  // started decoding once, so prime it with a play-then-immediate-pause.
  const primed = video.play();
  if(primed && primed.then){
    primed.then(() => video.pause()).catch(() => {});
  } else {
    video.pause();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
