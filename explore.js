(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), changeAnimations=new WeakMap();
  document.body.classList.add('explore-ready');
  function reveal(root){
    if(!root)return;
    document.dispatchEvent(new CustomEvent('portfolio:refresh'));
    document.dispatchEvent(new CustomEvent('portfolio:reveal',{detail:{root}}));
    const quiet=reduced.matches||document.body.classList.contains('motion-off')||document.body.classList.contains('keyboard-input');
    changeAnimations.get(root)?.cancel();
    if(!quiet&&root.animate){const a=root.animate([{opacity:.55,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});changeAnimations.set(root,a);a.finished.catch(()=>{});}
  }
  function linkTo(id){const target=document.getElementById(id);if(!target)return;history.replaceState(null,'','#'+id);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});}
  const cases=$$('[data-project]'),caseButtons=$$('[data-case]');let currentCase=cases[0]?.id.replace('project-','')||null,caseFilter='all';
  function selectCase(id,scroll=false){
    const target=document.getElementById('project-'+id);if(!target)return;
    currentCase=id;
    if(caseFilter!=='all'&&target.dataset.group!==caseFilter)setCaseFilter('all',false);
    cases.forEach(el=>el.hidden=el!==target);
    caseButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===id)));
    reveal(target);if(scroll)linkTo(target.id);
  }
  function setCaseFilter(group,select=true){
    caseFilter=group;
    $$('[data-case-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.caseFilter===group)));
    const matching=caseButtons.filter(b=>group==='all'||b.dataset.caseGroup===group);
    caseButtons.forEach(b=>b.hidden=!matching.includes(b));
    $('#project-count').textContent=`${matching.length} ${matching.length===1?'project record':'project records'}`;
    $('#projects-empty').hidden=matching.length!==0;
    if(select){const first=matching.find(b=>b.dataset.case===currentCase)||matching[0];if(first)selectCase(first.dataset.case);else cases.forEach(el=>el.hidden=true);}
  }
  caseButtons.forEach(b=>b.addEventListener('click',()=>selectCase(b.dataset.case)));
  $$('[data-case-filter]').forEach(b=>b.addEventListener('click',()=>setCaseFilter(b.dataset.caseFilter)));
  if(currentCase)selectCase(currentCase);
  function openProject(id){setCaseFilter('all',false);selectCase(id,true);}
  $$('[data-copy-case]').forEach(button => button.addEventListener('click', async () => {
    const article = button.closest('[data-project]');
    const url = new URL(location.pathname, location.origin);
    url.hash = article.id;
    const status = $('.case-copy-status', article);
    const field = $('.case-copy-url', article);
    try {
      await navigator.clipboard.writeText(url.href);
      field.hidden = true;
      status.textContent = 'Case link copied.';
    } catch {
      field.value = url.href;
      field.hidden = false;
      status.textContent = 'Select and copy this case link.';
      field.focus();
      field.select();
    }
  }));
  const lensData={qa:['software-payment-qa-utest','Software & Payment QA — uTest','Structured test execution, payment flows and reproducible defects.'],language:['igaming-platform-1win','iGaming localization — 1win','Translation, linguistic review and terminology for the Philippine market.'],ai:['llm-training-programs','Multilingual AI quality','Prompt evaluation, red teaming and structured data review.']};
  $$('[data-lens]').forEach(button=>button.addEventListener('click',()=>{
    const [id,title,copy]=lensData[button.dataset.lens];$$('[data-lens]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const panel=$('#hero-focus');$('.lens-title',panel).textContent=title;$('.lens-description',panel).textContent=copy;$('a',panel).dataset.openProject=id;reveal(panel);
  }));
  const metricData=[
    ['Career-wide testing','800+ QA cycles is the career total. The uTest subset records 557+ cycles, 827+ cases and 154+ products. These are different scopes and are not added together.','software-payment-qa-utest','Explore the uTest contribution'],
    ['Products, across the career','300+ products is the career-wide figure across testing work. The documented uTest subset covers 154+ products. Project and platform counts can overlap.','casino-igaming-qa-testa','Explore product quality work'],
    ['Defects, documented','1,000+ defects is the career total. The uTest subset records 500+ validated defects at 92%+ reporting accuracy. These figures describe their respective scopes.','software-payment-qa-utest','Explore defect reporting work'],
    ['Language work, across domains','500K+ words localized or reviewed spans software, gaming, marketing, medical, legal and general content. Translation and review scopes may overlap; linguistic entries and AI datasets are separate units.','software-mobile-ui','Explore localization work']
  ];
  $$('[data-metric]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-metric]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const [title,copy,id,label]=metricData[+button.dataset.metric],panel=$('#metric-context');$('h2',panel).textContent=title;$('p',panel).textContent=copy;$('a',panel).dataset.openProject=id;$('a',panel).textContent=label;reveal(panel);
  }));
  const careerConfig=JSON.parse($('#career-config').textContent),careerButtons=$$('[data-career]');
  const roleCache = new Map($$('[data-role]').map(el => {
    const detail = $('.role-detail', el);
    return [el.id.replace('role-', ''), {
      title: $('.role-title h3', el).textContent,
      company: $('.role-title > span', el).textContent,
      date: $('.role-date', el).textContent,
      summary: ($('.role-summary', detail)?.outerHTML || '') + ($('.tags', detail)?.outerHTML || ''),
      responsibilities: $('.responsibilities', detail)?.innerHTML || '',
    }];
  }));
  let currentRole=careerButtons[0]?.dataset.career,trace='all';
  function selectRole(id){
    const role=roleCache.get(id);if(!role)return;currentRole=id;
    careerButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.career===id)));$('#career-select').value=id;
    $('#career-date').textContent=role.date;$('#career-title').textContent=role.title;$('#career-company').textContent=role.company;
    $('#career-content').innerHTML = role.summary;
    $('#career-role-details').open = false;
    $('#career-responsibilities').innerHTML = role.responsibilities;
    const related=$('#career-related');related.replaceChildren();
    if(careerConfig[id].projects.length){const h=document.createElement('h4');h.textContent='Connected project records';related.append(h);const list=document.createElement('div');list.className='related-projects';for(const project of careerConfig[id].projects){const target=document.getElementById('project-'+project);if(!target)continue;const a=document.createElement('a');a.href='#projects';a.dataset.openProject=project;a.textContent=$('h3',target).textContent;list.append(a);}related.append(list);}
    const n=careerButtons.filter(b=>!b.hidden).length;$('#career-status').textContent=`${n} connected ${n===1?'role':'roles'} · Selected ${careerConfig[id].company}`;reveal($('#career-panel'));
  }
  function setTrace(facet){
    trace=facet;$$('[data-trace]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trace===facet)));
    const matches=careerButtons.filter(b=>facet==='all'||careerConfig[b.dataset.career].facets.includes(facet));
    careerButtons.forEach(b=>b.hidden=!matches.includes(b));
    [...$('#career-select').options].forEach(o=>{const excluded=facet!=='all'&&!careerConfig[o.value].facets.includes(facet);o.hidden=excluded;o.disabled=excluded;});
    $$('.career-year').forEach(year=>{let next=year.nextElementSibling,hasRole=false;while(next&&!next.classList.contains('career-year')){if(next.matches('[data-career]')&&!next.hidden)hasRole=true;next=next.nextElementSibling;}year.hidden=!hasRole;});
    if(!matches.some(b=>b.dataset.career===currentRole))selectRole(matches[0].dataset.career);else selectRole(currentRole);
  }
  careerButtons.forEach(b=>b.addEventListener('click',()=>selectRole(b.dataset.career)));$('#career-select').addEventListener('change',e=>selectRole(e.target.value));
  $$('[data-trace]').forEach(b=>b.addEventListener('click',()=>setTrace(b.dataset.trace)));
  $('#career-archive').open=false;$('#toolkit-archive').open=false;if(currentRole)selectRole(currentRole);
  const workflows={
    qa:{names:['Reproduce','Investigate','Report','Verify'],steps:[['Establish a repeatable result','Repeat the same path and record the displayed amounts. The sample shows PHP 800.00 plus PHP 50.00, while the total reads PHP 950.00.',['TestRail','Browser testing']],['Check the calculation','800 + 50 = 850. Compare the UI, request and response before deciding which layer is responsible. This exercise demonstrates an approach, not an actual client defect.',['Chrome DevTools','Postman']],['Make the defect actionable','Sample report: Total includes an extra PHP 100. Expected: PHP 850.00. Actual: PHP 950.00. Include the path, environment, evidence and reproducibility.',['Jira','QA documentation']],['Verify the correction','Switch to the corrected version, repeat the original path and confirm PHP 850.00. A real assignment would also check nearby payment and regression scenarios.',['TestRail','Regression testing']]]},
    language:{names:['Context','Terminology','Text fit','Review'],steps:[['Understand the moment','The reader has just completed a booking. The status confirms success; the action opens the booking. The sample uses a conversational Philippine-market tone.',['Figma','Localization brief']],['Keep the message consistent','The sample retains booking consistently in the status and action. Terminology choices should follow the product glossary and audience, then be checked across related strings.',['Crowdin','Terminology glossary']],['Inspect the interface','Change languages and compare button lengths. The before state uses a narrow fixed width; the layout fix lets the full label fit without cutting the message.',['Linguistic QA','UI review']],['Review language and presentation','Check accuracy, tone, consistency, text fit and cultural context together. These short examples are illustrative copy created for this portfolio.',['Style guide','LQA reporting']]]},
    ai:null
  };
  let lab='qa',stage=0,qaCase='checkout';
  const qaWorkflows={checkout:workflows.qa,...JSON.parse($('#qa-workflows').textContent)};
  document.addEventListener('portfolio:qa-case',e=>{qaCase=e.detail.key;workflows.qa=qaWorkflows[qaCase];if(lab==='qa')selectStage(0);reveal(e.detail.root);});
  document.addEventListener('portfolio:qa-stage',e=>{if(lab==='qa')selectStage(e.detail.index);});
  function selectStage(index){
    stage=index;const config=workflows[lab],[title,copy,tools]=config.steps[index];
    $$('[data-stage]').forEach((b,i)=>{b.textContent=config.names[i];b.setAttribute('aria-pressed',String(i===index));});
    const content=$('#workflow-content');$('h4',content).textContent=title;$('p',content).textContent=copy;$('#workflow-tools').replaceChildren(...tools.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    $('#workflow-title').textContent=lab==='qa'?'A QA investigation':lab==='language'?'A localization review':'An AI quality decision';reveal(content);
    $('.checkout-sample')?.classList.toggle('inspecting',lab==='qa'&&qaCase==='checkout'&&index>0);
  }
  function selectLab(key){
    lab=key;$$('[data-lab]').forEach(b=>{const selected=b.dataset.lab===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
    $$('.lab-scenario').forEach(p=>p.hidden=p.id!=='lab-'+key);selectStage(0);reveal($('#lab-'+key));
  }
  $$('[data-lab]').forEach(b=>b.addEventListener('click',()=>selectLab(b.dataset.lab)));$$('[data-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(+b.dataset.stage)));selectLab('qa');
  $('#inspect-total').addEventListener('click',()=>selectStage(1));
  $('#fix-total').addEventListener('click',e=>{const fixed=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(fixed));e.currentTarget.textContent=fixed?'Restore sample issue':'Show corrected version';$('#checkout-total').textContent=fixed?'PHP 850.00':'PHP 950.00';$('.checkout-sample').classList.toggle('fixed',fixed);selectStage(fixed?3:0);});
  const aiReviews = JSON.parse($('#ai-review-config').textContent);
  const aiPicker = $('#ai-scenario-select');
  const aiPanels = $$('[data-ai-example]');
  function selectAiReview() {
    const key = aiPicker.value;
    workflows.ai = aiReviews[key];
    aiPanels.forEach(panel => { panel.hidden = panel.dataset.aiExample !== key; });
    if (lab === 'ai') {
      selectStage(0);
      reveal(aiPanels.find(panel => !panel.hidden));
    }
  }
  aiPicker.addEventListener('change', selectAiReview);
  selectAiReview();
  aiPanels.forEach(panel => {
    const buttons = $$('[data-answer]', panel);
    buttons.forEach(button => button.addEventListener('click', () => {
      const review = aiReviews[panel.dataset.aiExample];
      const matches = review.choice === button.dataset.answer;
      buttons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
      $('.ai-verdict', panel).textContent = (matches ? 'That matches the rubric. ' : 'Review the deciding criterion. ') + review.reason;
      selectStage(matches ? 2 : 1);
    }));
  });
  $('#show-toolkit').addEventListener('click',()=>{$('#toolkit-archive').open=true;});
  const locales={en:{status:'Your booking is confirmed.',action:'View booking',note:'English: direct confirmation followed by a short action.'},tl:{status:'Kumpirmado na ang booking mo.',action:'Tingnan ang booking',note:'Tagalog: conversational confirmation and a clear action; booking is used consistently.'},ceb:{status:'Kumpirmado na ang imong booking.',action:'Tan-awa ang booking',note:'Cebuano: native phrasing and an imperative action, with consistent booking terminology.'}};
  $$('[data-language-demo]').forEach(demo=>{
    function locale(key){demo.dataset.locale=key;$$('[data-locale]',demo).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.locale===key)));$('[data-booking-status]',demo).textContent=locales[key].status;$('[data-booking-action]',demo).textContent=locales[key].action;$('[data-locale-note]',demo).textContent=locales[key].note;$('.booking-feedback',demo).textContent='';reveal($('.booking-sample',demo));}
    $$('button[data-locale]',demo).forEach(b=>b.addEventListener('click',()=>locale(b.dataset.locale)));
    $('[data-booking-action]',demo).addEventListener('click',()=>{$('.booking-feedback',demo).textContent=demo.dataset.locale==='tl'?'Sample booking lang ito.':demo.dataset.locale==='ceb'?'Sample booking lang kini.':'This is an illustrative booking.';});
    $('[data-fix-fit]',demo)?.addEventListener('click',e=>{const fixed=demo.dataset.fit==='before';demo.dataset.fit=fixed?'after':'before';e.currentTarget.setAttribute('aria-pressed',String(fixed));e.currentTarget.textContent=fixed?'Show narrow layout':'Show layout fix';selectStage(2);reveal($('.booking-sample',demo));});
    locale(demo.dataset.locale);
  });
  function story(key){$$('[data-story]').forEach(b=>{const on=b.dataset.story===key;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});$$('.story-panel').forEach(p=>p.hidden=p.id!=='story-'+key);reveal($('#story-'+key));}
  $$('.lab-scenario,.story-panel').forEach(panel=>panel.tabIndex=0);
  $$('[data-story]').forEach(b=>b.addEventListener('click',()=>story(b.dataset.story)));story('biology');
  function keyboardTabs(container,selector){container.addEventListener('keydown',e=>{const buttons=$$(selector,container),i=buttons.indexOf(e.target);if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();document.body.classList.add('keyboard-input');const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[n].focus();buttons[n].click();});}
  keyboardTabs($('.lab-tabs'),'[data-lab]');keyboardTabs($('.story-tabs'),'[data-story]');
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-open-project],[data-related-career],[data-go-lab],[data-follow-defect],[data-qa-inquiry],[data-hero-metric]');
    if(!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    e.preventDefault();
    if(link.dataset.openProject)openProject(link.dataset.openProject);
    if(link.dataset.relatedCareer){const found=Object.keys(careerConfig).find(id=>careerConfig[id].projects.includes(link.dataset.relatedCareer));if(found){setTrace('all');selectRole(found);}else{$('#career-archive').open=true;}linkTo('experience');}
    if (link.dataset.goLab) {
      selectLab(link.dataset.goLab);
      const exercise = link.dataset.goQaCase;
      if (exercise) {
        document.dispatchEvent(new CustomEvent('portfolio:choose-qa-case', {detail: {key: exercise}}));
        linkTo('qa-' + exercise);
      } else {
        linkTo('skills');
      }
    }
    if (link.hasAttribute('data-hero-metric')) {
      $(`[data-metric="${link.dataset.heroMetric}"]`)?.click();
      linkTo('career-figures');
    }
    if (link.hasAttribute('data-follow-defect')) {
      selectLab('qa');
      document.dispatchEvent(new CustomEvent('portfolio:choose-qa-case', {detail: {key: 'retry'}}));
      linkTo('qa-retry');
    }
    if (link.hasAttribute('data-qa-inquiry')) {
      const service = $('#inquiry-service');
      if (!service.disabled) {
        service.value = 'QA / Software Testing';
        service.dispatchEvent(new Event('change', {bubbles: true}));
      }
      linkTo('contact');
    }
  });
  function hashCase(scroll=false){const id=decodeURIComponent(location.hash.slice(1));if(id.startsWith('project-')&&document.getElementById(id))selectCase(id.slice(8),scroll);}
  addEventListener('hashchange',()=>hashCase(true));hashCase();
  // Initial archives and unselected records collapse before resolving a deep link.
  const initialHash=location.hash;
  if(initialHash){
    let untouched=true;
    const cancel=()=>{untouched=false;};
    ['pointerdown','wheel','keydown'].forEach(type=>addEventListener(type,cancel,{once:true,passive:true}));
    const align=()=>requestAnimationFrame(()=>{
      if(untouched&&location.hash===initialHash){const target=document.getElementById(decodeURIComponent(initialHash.slice(1)));target?.scrollIntoView({behavior:'instant',block:'start'});}
      ['pointerdown','wheel','keydown'].forEach(type=>removeEventListener(type,cancel));
    });
    if(document.readyState==='complete')align();else addEventListener('load',align,{once:true});
  }
})();
