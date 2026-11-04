(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],model=window.PortfolioQA;
  const corrected={quantity:false,retry:false,search:false};let payment={attempts:0,charges:0},paymentRun=1,searchResults=[...model.products];
  const stage=index=>document.dispatchEvent(new CustomEvent('portfolio:qa-stage',{detail:{index}}));
  function select(key){
    $$('[data-qa-case]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.qaCase===key)));$('#qa-exercise-select').value=key;
    $$('[data-qa-panel]').forEach(panel=>panel.hidden=panel.dataset.qaPanel!==key);
    document.dispatchEvent(new CustomEvent('portfolio:qa-case',{detail:{key,root:$('#qa-'+key)}}));
  }
  $$('[data-qa-case]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.qaCase)));$('#qa-exercise-select').addEventListener('change',e=>select(e.target.value));
  document.addEventListener('portfolio:choose-qa-case', event => select(event.detail.key));
  function checkQuantity(){
    const value=$('#sample-quantity').value,valid=model.quantityValid(value,corrected.quantity),n=Number(value),expected=value.trim()!==''&&Number.isInteger(n)&&n>=1&&n<=5;
    const result=$('#quantity-result');result.textContent=`Actual: ${valid?'accepted':'rejected'}. Expected: ${expected?'accepted':'rejected'} for ${value===''?'an empty value':'quantity '+value}.`;
    result.dataset.result=valid===expected?'pass':'issue';stage(corrected.quantity?3:1);
  }
  $$('[data-quantity]').forEach(button=>button.addEventListener('click',()=>{$('#sample-quantity').value=button.dataset.quantity;checkQuantity();}));$('#check-quantity').addEventListener('click',checkQuantity);
  $('#sample-quantity').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.body.classList.add('keyboard-input');checkQuantity();}});
  function resetPayment() {
    paymentRun += 1;
    payment = {attempts: 0, charges: 0};
    $('#retry-attempts').textContent = '0';
    $('#retry-charges').textContent = '0';
    $('.retry-counts').classList.remove('has-duplicate');
    $('#retry-log').replaceChildren();
    $('#retry-result').textContent = 'No requests yet. This simulation cannot move money.';
    $('#retry-result').removeAttribute('data-result');
    $('#send-sample-payment').textContent = 'Send sample request';
  }
  $('#send-sample-payment').addEventListener('click',()=>{
    const before=payment.charges;payment=model.paymentAttempt(payment,corrected.retry);$('#retry-attempts').textContent=payment.attempts;$('#retry-charges').textContent=payment.charges;
    const li=document.createElement('li');li.textContent=`Attempt ${payment.attempts} · ${payment.charges===before?'Original confirmation reused':payment.charges>1?'Duplicate sample charge recorded':'One sample charge recorded'}`;$('#retry-log').append(li);
    $('#retry-result').textContent=payment.charges>1?'Issue reproduced: the same request created multiple sample charges.':corrected.retry&&payment.attempts>1?'Correction verified: repeated attempts still produce one sample charge.':'Send the same request again to test retry behavior.';
    $('#retry-result').dataset.result=payment.charges>1?'issue':'pass';$('#send-sample-payment').textContent='Retry same sample request';stage(corrected.retry?3:payment.charges>1?2:1);
    $('.retry-counts').classList.toggle('has-duplicate', payment.charges > 1);
    document.dispatchEvent(new CustomEvent('portfolio:payment-evidence', {detail: {
      ...payment, run: paymentRun, corrected: corrected.retry,
      log: $$('#retry-log li').slice(-8).map(entry => entry.textContent),
    }}));
  });
  $('#reset-retry').addEventListener('click',()=>{resetPayment();stage(0);});
  function search(){
    const query=$('#sample-search').value;searchResults=model.search(query,corrected.search,searchResults);
    $('#sample-search-results').replaceChildren(...searchResults.map(name=>{const li=document.createElement('li');li.textContent=name;return li;}));
    $('#search-result-count').textContent=`${searchResults.length} ${searchResults.length===1?'item':'items'} shown`;
    $('#sample-search-empty').hidden=searchResults.length!==0;stage(corrected.search?3:1);
  }
  $('#run-sample-search').addEventListener('click',search);$('#sample-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.body.classList.add('keyboard-input');search();}});
  $('#clear-sample-search').addEventListener('click',()=>{$('#sample-search').value='';search();});
  for(const key of ['quantity','retry','search'])$('#fix-'+key).addEventListener('click',e=>{
    corrected[key]=!corrected[key];e.currentTarget.setAttribute('aria-pressed',String(corrected[key]));e.currentTarget.textContent=corrected[key]?'Restore sample issue':{quantity:'Enable corrected rule',retry:'Prevent duplicate charges',search:'Enable search fix'}[key];
    if(key==='quantity')checkQuantity();if(key==='retry'){resetPayment();stage(corrected.retry?3:0);}if(key==='search')search();
  });
  select('retry');
})();
