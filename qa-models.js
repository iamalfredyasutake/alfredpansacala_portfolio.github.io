/* Deliberately broken and corrected rules for illustrative QA exercises only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PortfolioQA=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const products=Object.freeze(['Atlas','Beacon','Canvas']);
  function quantityValid(value,corrected){const text=String(value).trim(),n=Number(text);return text!==''&&Number.isInteger(n)&&n>=(corrected?1:0)&&n<=5;}
  function paymentAttempt(state,corrected){return{attempts:state.attempts+1,charges:corrected?Math.max(1,state.charges):state.charges+1};}
  function search(query,corrected,previous=products){const q=String(query).trim(),matches=products.filter(name=>corrected?name.toLowerCase().includes(q.toLowerCase()):name.includes(q));return !corrected&&!matches.length?[...previous]:matches;}
  function bonusOutcome({deposit, odds, stake, hours, eligibility, settlement}) {
    const [amount, betOdds, betStake, elapsed] = [deposit, odds, stake, hours].map(Number);
    if (![deposit, odds, stake, hours].every(value => String(value ?? '').trim()) ||
        ![amount, betOdds, betStake, elapsed].every(Number.isFinite) ||
        amount <= 0 || betOdds < 1 || betStake < 0 || elapsed < 0) return null;

    // Keep currency in hundredths of an INR. This example rounds half up.
    const depositMinor = Math.round(amount * 100);
    const credit = eligibility === 'eligible' ? Math.min(100_000, Math.round(depositMinor / 2)) : 0;
    const target = credit ? (depositMinor + credit) * 5 : 0;
    const expired = credit > 0 && elapsed >= 168;
    const active = credit > 0 && !expired;
    const progress = active && betOdds > 1.30 && settlement === 'settled' ? Math.round(betStake * 100) : 0;
    return {credit, target, progress, remaining: active ? Math.max(0, target - progress) : null, expired};
  }
  return{products,quantityValid,paymentAttempt,search,bonusOutcome};
});
