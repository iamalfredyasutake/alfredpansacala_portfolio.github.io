/* Delivery rules are independent of the UI so failures can be verified without sending mail. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.PortfolioDelivery=api;
})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  function brief(values,recipient){
    const v=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,String(value??'').trim()]));
    const subject=v.service?`Project inquiry: ${v.service}`:'Portfolio project inquiry';
    const body=`Hello Alfred,\n\n${v.message}\n\nService: ${v.service||'To discuss'}\nPlatform: ${v.platform||'Not specified'}\nTiming: ${v.timeline||'Not specified'}\nLanguage / market: ${v.market||'To discuss'}\n\n${v.name}\n${v.email}`;
    return{subject,body,mailto:`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`};
  }
  function classify(response,data){
    const message=typeof data?.message==='string'?data.message:'';
    if(response.status>=500)return{kind:'error',reason:'server'};
    if(/\bactivate\b|\bactivation\b|\bconfirm your email\b|\bverify your email\b/i.test(message))return{kind:'activation'};
    if(!response.ok)return{kind:'error',reason:response.status===429?'rate-limit':'server'};
    if(data?.success===true||data?.success==='true')return{kind:'success'};
    return{kind:'error',reason:'rejected'};
  }
  function createSender({endpoint,fetchImpl=globalThis.fetch,timeoutMs=20000}){
    let pending=false;
    return{async send(payload){
      if(pending)return{kind:'busy'};
      if(String(payload._honey||'').trim())return{kind:'error',reason:'validation'};
      pending=true;
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        const response=await fetchImpl(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal,credentials:'omit'});
        let data;
        try{data=await response.json();}catch{return{kind:'error',reason:'invalid-response'};}
        return classify(response,data);
      }catch{return{kind:'error',reason:controller.signal.aborted?'timeout':'network'};}
      finally{clearTimeout(timer);pending=false;}
    }};
  }
  return{brief,classify,createSender};
});
