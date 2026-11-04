(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const stickyHeader=$('.shell-header');
  let headerHeight=0;
  function syncHeaderHeight(){
    headerHeight=Math.ceil(stickyHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--sticky-header-height',headerHeight+'px');
  }
  syncHeaderHeight();
  if('ResizeObserver' in window)new ResizeObserver(syncHeaderHeight).observe(stickyHeader);
  else addEventListener('resize',syncHeaderHeight,{passive:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let storedMotion=false;
  try{storedMotion=localStorage.getItem('alfred-motion-off')==='true';}catch{}
  let motionOff=reduced.matches||storedMotion;
  const motionButton=$('#motion-toggle');
  const replayButton=$('#replay'), skipButton=$('#skip-intro');
  $('#intro-toolbar').hidden=false;
  const hero=$('#home'), heroHaze=$('.hero-haze');
  let hazeInView=false, hazeMotion;
  function playHaze(){
    if(!hazeInView||motionOff||document.hidden||document.body.classList.contains('keyboard-input'))return;
    hazeMotion?.cancel();
    hazeMotion=heroHaze.animate(
      [{transform:'translate(3%, 2%)',opacity:.65},{transform:'none',opacity:1}],
      {duration:4200,easing:'cubic-bezier(.23,1,.32,1)'}
    );
  }
  if('IntersectionObserver' in window && heroHaze?.animate){
    new IntersectionObserver(([entry])=>{
      hazeInView=entry.isIntersecting&&entry.intersectionRatio>=.15;
      if(hazeInView)playHaze();
      else hazeMotion?.cancel();
    },{threshold:.15}).observe(hero);
    document.addEventListener('portfolio:replay',playHaze);
    document.addEventListener('portfolio:skip',()=>hazeMotion?.cancel());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)hazeMotion?.cancel();});
  }
  function announce(text){$('#a11y-status').textContent=text;}
  function paintMotionState(){
    document.body.classList.toggle('motion-off',motionOff);
    motionButton.setAttribute('aria-pressed',String(motionOff));
    $('span:last-child',motionButton).textContent=reduced.matches?'Reduced motion':motionOff?'Motion off':'Motion on';
    motionButton.disabled=reduced.matches;replayButton.disabled=motionOff;skipButton.disabled=motionOff;
    if(motionOff)hazeMotion?.cancel();
    document.dispatchEvent(new CustomEvent('portfolio:motion'));
  }
  replayButton.addEventListener('click',()=>{
    hero.tabIndex=-1;
    hero.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
    document.body.classList.remove('keyboard-input');
    document.dispatchEvent(new CustomEvent('portfolio:replay'));
  });
  skipButton.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('portfolio:skip'));announce('Animation skipped. All content is visible.');});
  motionButton.addEventListener('click',()=>{
    motionOff=!motionOff;storedMotion=motionOff;
    try{localStorage.setItem('alfred-motion-off',String(motionOff));}catch{}
    paintMotionState();announce(motionOff?'Motion disabled. All content is visible.':'Motion enabled. Effects replay when you scroll through the content.');
  });
  reduced.addEventListener('change',e=>{motionOff=e.matches||storedMotion;paintMotionState();});
  document.addEventListener('keydown',e=>{document.body.classList.add('keyboard-input');hazeMotion?.cancel();if(e.key==='Escape')closeNav(true);});
  document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-input'),{passive:true});
  const nav=$('.floating-nav'),navButton=$('#nav-toggle'),navLinks=$('#nav-links');
  const navSections=$$('a[href^="#"]',navLinks).map(link=>({link,section:$(link.hash)})).filter(item=>item.section);
  let navScrollFrame=0, activeNavLink;
  function syncNavScroll(){
    navScrollFrame=0;
    const max=document.documentElement.scrollHeight-innerHeight;
    const progress=max>0?Math.max(0,Math.min(1,scrollY/max)):0;
    const current=navSections.findLast(({section})=>section.getBoundingClientRect().top<=headerHeight+18)??navSections[0];
    nav.classList.toggle('is-scrolled',scrollY>90);
    $('#scroll-progress').style.transform=`scaleX(${progress})`;
    if(current.link!==activeNavLink){
      activeNavLink?.removeAttribute('aria-current');
      current.link.setAttribute('aria-current','location');
      activeNavLink=current.link;
    }
  }
  function scheduleNavScroll(){
    if(!navScrollFrame)navScrollFrame=requestAnimationFrame(syncNavScroll);
  }
  addEventListener('scroll',scheduleNavScroll,{passive:true});
  const desktopNav=matchMedia('(min-width:1101px)');
  function closeNav(focus=false){const wasOpen=nav.classList.contains('open');nav.classList.remove('open');navButton.setAttribute('aria-expanded','false');navButton.setAttribute('aria-label','Open navigation');navLinks.inert=!desktopNav.matches;if(focus&&wasOpen&&!desktopNav.matches)navButton.focus({preventScroll:true});}
  closeNav();
  syncNavScroll();
  addEventListener('resize',scheduleNavScroll,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(scheduleNavScroll).observe(document.body);
  desktopNav.addEventListener('change',()=>closeNav());
  navButton.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);navButton.setAttribute('aria-expanded',String(open));navButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');navLinks.inert=!desktopNav.matches&&!open;});
  $$('#nav-links a').forEach(a=>a.addEventListener('click',()=>{closeNav();const target=$(a.hash);if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}));
  document.addEventListener('pointerdown',e=>{if(!nav.contains(e.target))closeNav();});
  nav.addEventListener('focusout',()=>setTimeout(()=>{if(!nav.contains(document.activeElement))closeNav();},0));
  const portraitImage=$('.portrait-frame img');
  function imageFallback(){portraitImage.parentElement.classList.add('image-missing');$('.portrait-fallback').setAttribute('aria-hidden','false');}
  portraitImage.addEventListener('error',imageFallback,{once:true});
  if(portraitImage.complete&&!portraitImage.naturalWidth) imageFallback();
  const roles=$$('[data-role]'),search=$('#role-search'),expand=$('#expand-roles');
  function syncExpand(){const visible=roles.filter(r=>!r.hidden),allOpen=visible.length>0&&visible.every(r=>r.open);expand.textContent=allOpen?'Collapse all roles':'Expand all roles';expand.setAttribute('aria-expanded',String(allOpen));expand.disabled=visible.length===0;}
  search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase();roles.forEach(r=>r.hidden=!r.textContent.toLocaleLowerCase().includes(q));const n=roles.filter(r=>!r.hidden).length;$('#role-count').textContent=`${n} ${n===1?'role':'roles'}`;$('#roles-empty').hidden=n!==0;syncExpand();});
  expand.addEventListener('click',()=>{const visible=roles.filter(r=>!r.hidden),open=!visible.every(r=>r.open);visible.forEach(r=>r.open=open);syncExpand();});
  roles.forEach(role=>role.addEventListener('toggle',syncExpand));
  function selectContactText(element){
    const range=document.createRange();
    range.selectNodeContents(element);
    const selection=getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  $('#copy-email').addEventListener('click',async()=>{
    const link=$('.contact-email'),email=link.textContent.trim();
    try{await navigator.clipboard.writeText(email);$('#copy-email').textContent='Email copied';announce('Email address copied.');}
    catch{selectContactText(link);announce('Email selected. Copy it using your device’s copy command.');}
  });
  $$('.copy-wechat').forEach(button=>{
    button.hidden=false;
    const id=$('.wechat-id',button.closest('.wechat-channel'));
    const label=$('span:last-child',button);
    let confirmationTimer;
    button.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(id.textContent);
        button.dataset.copied='';
        label.textContent='Copied';
        clearTimeout(confirmationTimer);
        confirmationTimer=setTimeout(()=>{
          delete button.dataset.copied;
          label.textContent='WeChat';
        },1600);
        announce('WeChat ID copied.');
      }catch{
        selectContactText(id);
        announce('WeChat ID selected. Copy it using your device’s copy command.');
      }
    });
  });
  paintMotionState();
})();
