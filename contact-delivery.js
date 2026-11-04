/* Delivery rules are independent of the UI so failures can be verified without sending mail.
   Providers are tried in order: FormSubmit first, then Web3Forms if FormSubmit cannot deliver. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.PortfolioDelivery = api;
  }
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';

  const DEFAULT_RECIPIENT = 'pansacala.alfred04@gmail.com';
  const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
  // Public access key (safe in front-end code). Override with createSender({ web3formsKey }).
  const DEFAULT_WEB3FORMS_KEY = '929765d7-0e9a-4c82-9667-115896ad769e';

  /* FormSubmit only allows fetch requests on the /ajax/ path. */
  function ajaxEndpoint(target = DEFAULT_RECIPIENT) {
    const value = String(target).trim();
    if (/^https?:\/\//i.test(value)) {
      return value.replace(/^(https?:\/\/formsubmit\.co)\/(?!ajax\/)/i, '$1/ajax/');
    }
    return `https://formsubmit.co/ajax/${value}`;
  }

  /* FormData with no Content-Type header = "simple" CORS request, so no OPTIONS preflight. */
  function toFormData(fields) {
    const fd = new FormData();
    Object.entries(fields).forEach(([key, value]) => fd.append(key, String(value ?? '')));
    return fd;
  }

  function brief(values, recipient = DEFAULT_RECIPIENT) {
    const v = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        String(value ?? '').trim(),
      ])
    );

    const subject = v.service
      ? `Project inquiry: ${v.service}`
      : 'Portfolio project inquiry';

    const body = `Hello Alfred,

${v.message}

Service: ${v.service || 'To discuss'}
Platform: ${v.platform || 'Not specified'}
Timing: ${v.timeline || 'Not specified'}
Language / market: ${v.market || 'To discuss'}

${v.name}
${v.email}`;

    return {
      subject,
      body,
      mailto: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    };
  }

  function classify(response, data) {
    const message = typeof data?.message === 'string' ? data.message : '';

    if (response.status >= 500) {
      return { kind: 'error', reason: 'server', detail: `HTTP ${response.status}` };
    }

    if (/\bactivate\b|\bactivation\b|\bconfirm your email\b|\bverify your email\b/i.test(message)) {
      return { kind: 'activation', detail: message };
    }

    if (!response.ok) {
      return {
        kind: 'error',
        reason: response.status === 429 ? 'rate-limit' : 'server',
        detail: message || `HTTP ${response.status}`,
      };
    }

    if (data?.success === true || data?.success === 'true') {
      return { kind: 'success' };
    }

    return { kind: 'error', reason: 'rejected', detail: message };
  }

  /* ---------- Providers ---------- */

  function formSubmitProvider({ endpoint = ajaxEndpoint(), timeoutMs = 10000 } = {}) {
    return {
      name: 'formsubmit',
      url: ajaxEndpoint(endpoint),
      timeoutMs,
      build(payload) {
        return toFormData({ _captcha: 'false', _template: 'table', ...payload });
      },
    };
  }

  function web3formsProvider({ accessKey, timeoutMs = 15000 }) {
    return {
      name: 'web3forms',
      url: WEB3FORMS_ENDPOINT,
      timeoutMs,
      build(payload) {
        // FormSubmit-only fields (_honey, _captcha, _template) are not forwarded.
        const { _honey, _subject, _captcha, _template, ...rest } = payload;
        return toFormData({
          ...rest,
          access_key: accessKey,
          subject: _subject || 'Portfolio project inquiry',
          from_name: rest.name || 'Portfolio contact form',
        });
      },
    };
  }

  /* One attempt against one provider. Never throws. */
  async function attempt(provider, payload, fetchImpl, log) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), provider.timeoutMs);

    try {
      const response = await fetchImpl(provider.url, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: provider.build(payload),
        signal: controller.signal,
        credentials: 'omit',
      });

      // Handle these HTTP errors even if the response body is HTML.
      if (response.status >= 500 || response.status === 429) {
        const result = classify(response);
        log(`${provider.name} failed:`, result);
        return result;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        log(`${provider.name} returned a non-JSON response (HTTP ${response.status}).`);
        return { kind: 'error', reason: 'invalid-response', detail: `HTTP ${response.status}` };
      }

      const result = classify(response, data);
      if (result.kind !== 'success') log(`${provider.name} replied:`, data);
      return result;
    } catch (error) {
      const timedOut = controller.signal.aborted;
      log(
        timedOut
          ? `${provider.name} timed out.`
          : `${provider.name} network/CORS error (service down, blocked, or opened via file://).`,
        error
      );
      return {
        kind: 'error',
        reason: timedOut ? 'timeout' : 'network',
        detail: String(error?.message || error),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  function createSender({
    endpoint,
    web3formsKey = DEFAULT_WEB3FORMS_KEY,
    providers,
    fetchImpl = (...args) => globalThis.fetch(...args),
    log = (...args) => console.warn('[PortfolioDelivery]', ...args),
  } = {}) {
    const chain =
      providers ||
      [
        formSubmitProvider({ endpoint }),
        ...(web3formsKey && !/^YOUR_/i.test(web3formsKey)
          ? [web3formsProvider({ accessKey: web3formsKey })]
          : []),
      ];

    if (chain.length === 1) {
      log('Only one provider configured. Add web3formsKey to enable the automatic fallback.');
    }

    let pending = false;

    return {
      providers: chain.map((p) => p.name),

      async send(payload) {
        if (pending) return { kind: 'busy' };
        if (String(payload._honey || '').trim()) {
          return { kind: 'error', reason: 'validation' };
        }

        if (typeof location !== 'undefined' && location.protocol === 'file:') {
          log('Page is opened via file://. Serve it over http(s) or use the deployed site.');
        }

        pending = true;
        try {
          let last = { kind: 'error', reason: 'network' };
          let activation = null;

          for (let i = 0; i < chain.length; i += 1) {
            const provider = chain[i];
            const result = await attempt(provider, payload, fetchImpl, log);

            if (result.kind === 'success') {
              return {
                ...result,
                provider: provider.name,
                fallback: i > 0,
                ...(activation ? { activationPending: true } : {}),
              };
            }

            last = result;
            if (result.kind === 'activation') activation = result;
            if (i < chain.length - 1) log(`${provider.name} could not deliver. Trying ${chain[i + 1].name}...`);
          }

          // Nothing delivered. Prefer showing the activation notice if FormSubmit asked for it.
          return activation || last;
        } finally {
          pending = false;
        }
      },
    };
  }

  return { brief, classify, createSender, ajaxEndpoint, DEFAULT_RECIPIENT };
});
