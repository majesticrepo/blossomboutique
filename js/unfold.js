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

  // Raw scroll position updates in discrete jumps (and video seeking itself
  // takes a beat to land on a keyframe), so snapping currentTime straight to
  // scroll reads as jittery. Instead we track where scroll WANTS the video to
  // be (targetProgress) and let a value we actually render (shownProgress)
  // ease toward it every frame - a standard scroll-scrubbing smoothing trick
  // that trades a few ms of lag for a fluid, non-jumpy feel.
  let lastProgress = 0;
  let targetProgress = 0;
  let shownProgress = 0;
  const EASE = 0.12;

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

  function readScroll(){
    const sceneHeight = scene.offsetHeight;
    const scrollable = sceneHeight - window.innerHeight;
    const rect = scene.getBoundingClientRect();
    const progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    targetProgress = Math.min(1, Math.max(0, progress));
  }

  function frame(){
    shownProgress += (targetProgress - shownProgress) * EASE;
    if(Math.abs(targetProgress - shownProgress) < 0.0006){
      shownProgress = targetProgress;
    }

    const duration = video.duration;
    if(duration > 0 && !isNaN(duration)){
      const target = shownProgress * duration;
      if(Math.abs(video.currentTime - target) > 0.004){
        try{ video.currentTime = target; }catch(e){}
      }
    }

    progressFill.style.width = (shownProgress * 100) + '%';

    const direction = shownProgress === lastProgress ? null : (shownProgress > lastProgress ? 'down' : 'up');
    setCaption(shownProgress, direction || (shownProgress < 0.5 ? 'down' : 'up'));
    lastProgress = shownProgress;

    requestAnimationFrame(frame);
  }

  video.addEventListener('loadedmetadata', () => {
    readScroll();
    shownProgress = targetProgress;
  });

  // iOS Safari only paints seeked frames reliably once the video has actually
  // started decoding once, so prime it with a play-then-immediate-pause.
  const primed = video.play();
  if(primed && primed.then){
    primed.then(() => video.pause()).catch(() => {});
  } else {
    video.pause();
  }

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll);
  readScroll();
  shownProgress = targetProgress;
  requestAnimationFrame(frame);
})();
