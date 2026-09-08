(() => {
  'use strict';
  const stage = document.querySelector('.recognition-stage');
  const gs = window.gsap;
  if (!stage || !gs) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = [...stage.querySelectorAll('.contents-list li')];
  const pages = [...stage.querySelectorAll('.extracted-page')];
  const stack = [...stage.querySelectorAll('.gig-page')];
  const lens = stage.querySelector('.song-lens');
  const status = stage.querySelector('.recognition-status');
  const replay = document.querySelector('[data-replay="recognition"]');
  let sequence, started = false, inView = false, generation = 0;
  const isPaused = () => reduced.matches || document.body.classList.contains('motion-paused');
  const center = rect => ({x: rect.left + rect.width / 2, y: rect.top + rect.height / 2});

  function finish() {
    sequence?.kill();
    gs.set(pages, {clearProps: 'all', opacity: 0});
    gs.set(stack, {clearProps: 'all', opacity: 1});
    gs.set(rows, {'--highlight': 1});
    gs.set(lens, {opacity: 0});
    status.textContent = 'Songs found: Für Elise, Prelude in C major, Eine kleine Nachtmusik.';
  }

  async function play() {
    const request = ++generation;
    sequence?.kill();
    // Decode the genuine pages before animating them out of their titles.
    await Promise.allSettled(pages.map(page => page.querySelector('img').decode()));
    if (request !== generation) return;
    started = true;
    if (isPaused()) { finish(); return; }
    gs.set([...pages, ...stack], {clearProps: 'all'});
    const stageRect = stage.getBoundingClientRect();
    const origins = rows.map(row => center(row.getBoundingClientRect()));
    const pageRects = pages.map(page => page.getBoundingClientRect());
    const pagePoses = pages.map(page => ({x: +gs.getProperty(page, 'x'), y: +gs.getProperty(page, 'y'), rotation: +gs.getProperty(page, 'rotation')}));
    const stackRects = stack.map(page => page.getBoundingClientRect());
    const stackPoses = stack.map(page => ({x: +gs.getProperty(page, 'x'), y: +gs.getProperty(page, 'y'), rotation: +gs.getProperty(page, 'rotation')}));
    gs.set(rows, {'--highlight': 0});
    gs.set([...pages, ...stack], {opacity: 0});
    gs.set(lens, {opacity: 0, scale: .85});
    status.textContent = 'Finding the songs in your contents page.';
    sequence = gs.timeline({paused: !inView, onComplete: () => {
      status.textContent = 'Three songs found. You get the final say.';
    }});

    pages.forEach((page, i) => {
      const time = i * 2.25;
      const origin = origins[i];
      const target = center(pageRects[i]);
      const lensX = origin.x - stageRect.left - lens.offsetWidth / 2;
      const lensY = origin.y - stageRect.top - lens.offsetHeight / 2;
      sequence.call(() => {
        lens.querySelector('.lens-title').textContent = rows[i].querySelector('strong').textContent;
        lens.querySelector('.lens-composer').textContent = rows[i].querySelector('small').textContent;
      }, [], time);
      if (i === 0) sequence.set(lens, {x: lensX, y: lensY}, time);
      sequence.to(lens, {x: lensX, y: lensY, opacity: 1, scale: 1, duration: .65, ease: 'power3.inOut'}, time);
      sequence.to(rows[i], {'--highlight': 1, duration: .35}, time + .4);
      sequence.fromTo(page,
        {x: pagePoses[i].x + origin.x - target.x, y: pagePoses[i].y + origin.y - target.y, scale: .3, rotation: -10, opacity: 0},
        {...pagePoses[i], scale: 1, opacity: 1, duration: 1.25, ease: 'power3.inOut', immediateRender: false}, time + .85);
    });
    sequence.to(lens, {opacity: 0, scale: .9, duration: .4}, 6.75);
    // Transfer each revealed page into the same compact reading area.
    [...stack.keys()].reverse().forEach((i, step) => {
      const source = center(pageRects[i]);
      const destination = center(stackRects[i]);
      const pose = stackPoses[i];
      sequence.set(pages[i], {opacity: 0}, 8 + step * .65);
      sequence.fromTo(stack[i], {
        x: pose.x + source.x - destination.x,
        y: pose.y + source.y - destination.y,
        scale: pageRects[i].width / stackRects[i].width,
        rotation: pagePoses[i].rotation, opacity: 1
      }, {...pose, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.inOut', immediateRender: false}, 8 + step * .65);
    });
  }

  replay.addEventListener('click', play);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!started && inView) play();
    else if (sequence) sequence.paused(!inView);
  }, {threshold: .15}).observe(stage);
  reduced.addEventListener('change', event => {if (event.matches) {generation++; finish();}});
  // Layout changes invalidate measured flight paths; show the complete, ordered result.
  let previousWidth = stage.clientWidth;
  new ResizeObserver(() => {
    if (Math.abs(stage.clientWidth - previousWidth) > 2) {
      previousWidth = stage.clientWidth;
      generation++;
      finish();
    }
  }).observe(stage);
})();
