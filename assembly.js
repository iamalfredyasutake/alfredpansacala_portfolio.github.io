(() => {
  'use strict';
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), compact=matchMedia('(max-width:700px)');
  const visible=new Set(), played=new WeakSet(), active=new Map(), roots=[];
  const easeOut='cubic-bezier(.23,1,.32,1)', easeMove='cubic-bezier(.77,0,.175,1)';
  let drainFrame=0,scrollFrame=0,lastScroll=scrollY,direction=0,candidateDirection=0,directionDistance=0;
  const blocked=()=>reduced.matches||document.hidden||document.body.classList.contains('motion-off')||document.body.classList.contains('keyboard-input');
  const catalog=[
    ['.hero-copy > h1,.hero-position,.hero-description','write'],['.section-index','write'],['.reading-progress-track','frame'],['.portrait-composition','image'],['.hero-focus','write'],['.metric-context','write'],['.career-panel','write'],['.quality-lab','image'],['.qa-exercise','write'],['#workflow-content','write'],['.story-panel','write'],['.booking-sample','write'],['.guided-brief fieldset','write'],
    ['.career-stats > div','write'],['.career > p','write'],['.chapter-heading > h2,.section-heading > h2,.section-heading > p','write'],['.project','write'],
    ['.featured-work li,.service-outcomes li','frame'],['.service-archive > .catalog-header,.service-menu','write'],
    ['details > summary','write'],
    ['details:not(.record-archive,.skill-panel,.brand-category) > :is(div,p,dl,ul,ol)','write'],
    ['.skill-group','write'],
    ['.about-body > p','write'],['.profile-details > p,.profile-details > .tags','write'],
    ['.about-facts dl > div','write'],['.specializations','write'],['.language-list > div','write'],
    ['.language-section > p,.language-section > .tags','write'],['.credential-grid > div > h3','write'],
    ['.education-list > article','write'],['.certification-list > li','write'],['.brand-list,.brand-names','write'],['.brand-category > summary','write'],['.platform-section','write'],
    ['.principle > blockquote,.principle > p:not(.section-index)','write'],['.contact-grid > div > .contact-email,.phone-link,.social-links','write'],
    ['.availability > summary,.availability > dl','write'],['.contact-more,.contact-documents','write'],['.inquiry-form','write'],['.footer-brand > p,.footer-main h3,.footer-bottom > p','write'],
    ['.qal-role > header,.qal-flow > li,.editorial-services,.highlight-links,.localization-workshop > header,.localization-panel,.lqa-triage','write'],
    ['.qa-evidence > header,.test-case-sheet,.bug-report-sheet,.lqa-findings > header,.lqa-finding,.ai-review-panel,.professional-profile','write']
  ];
  function sync(){
    document.body.dataset.assemblyActive=String(active.size);
  }
  function schedule(){if(!drainFrame)drainFrame=requestAnimationFrame(drain);}
  function drain(){
    drainFrame=0;if(blocked())return;
    const candidates = [...visible]
      .filter(root => !played.has(root) && !active.has(root) && !root.closest('[hidden]'))
      .map(root => ({root, rect: root.getBoundingClientRect(), heading: root.matches('.section-index,h1,h2')}))
      .filter(({rect}) => rect.height > 0)
      .sort((a, b) => Number(b.heading) - Number(a.heading) ||
        (direction < 0 ? b.rect.top - a.rect.top : a.rect.top - b.rect.top));
    for(const {root} of candidates){
      if(active.size>=(compact.matches?2:4))break;
      if(root.contains(document.activeElement)){played.add(root);root.dataset.assemblyState='skipped';continue;}
      run(root);
    }
  }
  function cancelAll(){for(const state of active.values())state.controller.abort();}
  function textTokens(root,cleanup){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), nodes=[], layouts=new WeakMap();
    while(walker.nextNode()){
      const node=walker.currentNode, parent=node.parentElement;
      if(!node.textContent.trim()||!parent||parent.closest('[data-assemble]')!==root)continue;
      if(!parent.closest('h1,h2,h3,h4,p,dt,dd,li,figcaption,summary,.section-index,.portrait-signature'))continue;
      if(parent.closest('svg,script,style,input,textarea,select,button,a,label,[data-ui],[role="status"],.assembly-overlay,.sr-only,[aria-hidden="true"],[hidden]'))continue;
      const rect = parent.getBoundingClientRect();
      if(!rect.height || rect.bottom < 0 || rect.top > innerHeight)continue;
      const closed=parent.closest('details:not([open])');
      if(closed&&parent.closest('summary')?.parentElement!==closed)continue;
      if(!layouts.has(parent))layouts.set(parent,getComputedStyle(parent).display);
      nodes.push(node);
    }
    const tokens=[], headingLabels=new Map(), limit=compact.matches?60:110;
    for(const node of nodes){
      if(tokens.length>=limit)break;
      const parent=node.parentElement, heading=parent.closest('h1,h2,h3,h4');
      const title = heading || parent.closest('.section-index,.portrait-signature');
      if(heading&&!headingLabels.has(heading)){
        headingLabels.set(heading,heading.getAttribute('aria-label'));
        if(!heading.hasAttribute('aria-label'))heading.setAttribute('aria-label',heading.textContent);
      }
      const characters=heading&&heading.textContent.length<90;
      const parts=characters?(typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(node.textContent)].map(x=>x.segment):Array.from(node.textContent)):node.textContent.split(/(\s+)/);
      const marker=document.createComment('writing'), fragment=document.createDocumentFragment(), generated=[];
      fragment.append(marker);
      const flow=/^(inline-)?(flex|grid)$/.test(layouts.get(parent))?document.createElement('span'):null;
      if(flow){flow.className='writing-flow';fragment.append(flow);}
      for(const part of parts){
        const el=/^\s*$/.test(part)||tokens.length>=limit?document.createTextNode(part):document.createElement('span');
        if(el.nodeType===1){el.className=title?'writing-token':'writing-token readable-token';el.textContent=part;if(characters)el.setAttribute('aria-hidden','true');tokens.push(el);}
        generated.push(el);(flow||fragment).append(el);
      }
      node.replaceWith(fragment);
      cleanup.push(()=>{marker.replaceWith(node);if(flow)flow.remove();else generated.forEach(el=>el.remove());});
    }
    cleanup.push(()=>headingLabels.forEach((label,el)=>{if(label===null)el.removeAttribute('aria-label');else el.setAttribute('aria-label',label);}));
    return tokens;
  }
  async function run(root){
    const state={controller:new AbortController(),animations:new Set()}, signal=state.controller.signal;
    active.set(root,state);played.add(root);
    const runNumber=Number(root.dataset.assemblyRuns||0)+1;
    root.dataset.assemblyRuns=String(runNumber);root.dataset.assemblyState='playing';root.dataset.assemblyDirection=direction<0?'up':'down';sync();
    const cleanup=[], overlay=document.createElement(root.matches('ul,ol')?'li':'span');
    overlay.className='assembly-overlay';overlay.setAttribute('aria-hidden','true');
    const frame=document.createElement('span');frame.className='assembly-selection';
    frame.innerHTML='<i class="corner-nw"></i><i class="corner-ne"></i><i class="corner-se"></i><i class="corner-sw"></i>';
    overlay.append(frame);root.append(overlay);
    const stop=()=>{for(const a of state.animations)a.cancel();};signal.addEventListener('abort',stop,{once:true});
    function motion(el,frames,duration,delay=0,easing=easeOut){
      if(signal.aborted)return Promise.resolve();
      const a=el.animate(frames,{duration,delay,easing,fill:'backwards'});state.animations.add(a);
      return a.finished.catch(()=>{}).finally(()=>state.animations.delete(a));
    }
    try{
      const tokens=root.dataset.assemble!=='frame'?textTokens(root,cleanup):[];
      const duration=Math.min(runNumber>1?1050:1400,Math.max(420,tokens.length*(runNumber>1?12:18)));
      tokens.forEach((token,i)=>token.style.animationDelay=(140+i*duration/Math.max(1,tokens.length))+'ms');
      const r=root.getBoundingClientRect();
      const points=tokens.map(token=>{const t=token.getBoundingClientRect();return{x:Math.max(2,Math.min(r.width-6,t.right-r.left+2)),y:Math.max(0,Math.min(r.height-22,t.top-r.top+Math.max(2,(t.height-22)/2)))}});
      const paths=[];
      if(points.length){
        const caret=document.createElement('span');caret.className='type-caret';overlay.append(caret);
        const end=points[points.length-1];caret.style.transform=`translate(${end.x}px,${end.y}px)`;
        paths.push(motion(caret,points.map(p=>({transform:`translate(${p.x}px,${p.y}px)`})),duration,140,'linear'));
        paths.push(motion(caret,[{opacity:1},{opacity:0}],160,duration+180));
      }
      if(root.dataset.assemble==='image'||r.height>100||(root.matches('h2,h3')&&r.width>220)){
        const pointer=document.createElement('span');pointer.className='placement-cursor';
        pointer.innerHTML='<svg class="icon" aria-hidden="true"><use href="#icon-cursor"/></svg><span data-label="Placing"></span>';overlay.append(pointer);
        const x=Math.max(4,r.width-98),y=Math.min(Math.max(8,r.height-48),28);
        pointer.style.transform=`translate(${x}px,${y}px)`;
        paths.push(motion(pointer,[{transform:`translate(${Math.max(0,x-65)}px,${Math.max(0,y-18)}px)`},{transform:`translate(${x}px,${y}px)`}],600,80,easeMove));
        paths.push(motion(pointer,[{opacity:1},{opacity:0}],160,duration+140));
      }
      const image=root.querySelector('img');
      if(image&&root.dataset.assemble==='image')motion(image,[{opacity:.55,transform:`translateY(${direction<0?-10:10}px) scale(.98)`},{opacity:1,transform:'translateY(0) scale(1)'}],600);
      const frameDuration=duration+420;
      paths.push(motion(frame,[{opacity:0,transform:'scale(.985)'},{opacity:.9,transform:'scale(1)',offset:.15},{opacity:.7,transform:'scale(1)',offset:.8},{opacity:0,transform:'scale(1)'}],frameDuration));
      await Promise.all(paths);
    }catch{
      // Decoration has a complete, static semantic fallback.
    }finally{
      signal.removeEventListener('abort',stop);stop();cleanup.forEach(fn=>fn());overlay.remove();
      active.delete(root);root.dataset.assemblyState=signal.aborted?'skipped':'complete';sync();schedule();
    }
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.isIntersecting)visible.add(entry.target);
      else{visible.delete(entry.target);played.delete(entry.target);active.get(entry.target)?.controller.abort();}
    }
    schedule();
  },{rootMargin:'-24px 0px -32px 0px',threshold:0});
  function register(){
    for(let i=roots.length-1;i>=0;i--){const root=roots[i];if(!root.isConnected){observer.unobserve(root);visible.delete(root);active.get(root)?.controller.abort();roots.splice(i,1);}}
    for(const [selector,mode] of catalog)for(const root of document.querySelectorAll(selector)){
      if(roots.includes(root))continue;
      root.dataset.assemble=mode;root.classList.add('assembly-unit');roots.push(root);if(root.matches('.reading-progress-track'))visible.add(root);else observer.observe(root);
    }
  }
  register();schedule();
  document.addEventListener('portfolio:refresh',register);
  document.addEventListener('portfolio:reveal',e=>{const root=e.detail?.root;if(root){active.get(root)?.controller.abort();played.delete(root);schedule();}});
  function onScroll(){
    scrollFrame=0;
    const delta=scrollY-lastScroll;lastScroll=scrollY;
    if(Math.abs(delta)<1)return;
    const next=delta>0?1:-1;
    if(next!==candidateDirection){candidateDirection=next;directionDistance=0;}
    directionDistance+=Math.abs(delta);
    if(directionDistance>=48&&next!==direction){
      const reversing=direction!==0;direction=next;
      if(reversing)for(const root of visible){
        if(root.contains(document.activeElement))continue;
        active.get(root)?.controller.abort();
        played.delete(root);
      }
      schedule();
    }
  }
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(onScroll);},{passive:true});
  document.addEventListener('wheel',()=>{document.body.classList.remove('keyboard-input');schedule();},{passive:true});
  document.addEventListener('portfolio:motion',()=>{if(blocked())cancelAll();else schedule();sync();});
  document.addEventListener('portfolio:replay',()=>{
    document.body.classList.remove('keyboard-input');
    for(const root of roots.filter(el=>el.closest('#home'))){active.get(root)?.controller.abort();played.delete(root);}schedule();
  });
  document.addEventListener('portfolio:skip',()=>{for(const root of roots.filter(el=>el.closest('#home'))){played.add(root);active.get(root)?.controller.abort();}sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAll();else schedule();});
  document.addEventListener('keydown',cancelAll);
  document.addEventListener('pointerdown',e=>{active.get(e.target.closest('[data-assemble]'))?.controller.abort();schedule();},{passive:true});
  document.addEventListener('focusin',e=>active.get(e.target.closest('[data-assemble]'))?.controller.abort());
  document.addEventListener('input',e=>active.get(e.target.closest('[data-assemble]'))?.controller.abort());
  document.addEventListener('toggle',e=>{
    if(!e.target.matches('details'))return;
    for(const root of e.target.querySelectorAll('.assembly-unit')){
      if(root===e.target.firstElementChild)continue;
      active.get(root)?.controller.abort();
      played.delete(root);
    }
    if(e.target.open)schedule();
  },{capture:true});
})();
