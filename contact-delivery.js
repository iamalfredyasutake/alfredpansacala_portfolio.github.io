/* Delivery rules are independent of the UI so failures can be verified without sending mail. */
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

  /**
   * FormSubmit only allows JSON/fetch requests on the /ajax/ path.
   * Accepts a plain email, a random alias, or a full formsubmit.co URL
   * and always returns a valid AJAX endpoint.
   *   ajaxEndpoint()                                   -> https://formsubmit.co/ajax/<default email>
   *   ajaxEndpoint('https://formsubmit.co/you@x.com')  -> https://formsubmit.co/ajax/you@x.com
   */
  function ajaxEndpoint(target = DEFAULT_RECIPIENT) {
    const value = String(target).trim();
    if (/^https?:\/\//i.test(value)) {
      return value.replace(/^(https?:\/\/formsubmit\.co)\/(?!ajax\/)/i, '$1/ajax/');
    }
    return `https://formsubmit.co/ajax/${value}`;
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

  function createSender({
    endpoint = ajaxEndpoint(),
    fetchImpl = (...args) => globalThis.fetch(...args),
    timeoutMs = 20000,
    log = (...args) => console.warn('[PortfolioDelivery]', ...args),
  } = {}) {
    const url = ajaxEndpoint(endpoint);
    let pending = false;

    return {
      endpoint: url,

      async send(payload) {
        if (pending) return { kind: 'busy' };
        if (String(payload._honey || '').trim()) {
          return { kind: 'error', reason: 'validation' };
        }

        // FormSubmit AJAX does not work from file:// pages (no real origin).
        if (typeof location !== 'undefined' && location.protocol === 'file:') {
          log('Page is opened via file://. Serve it over http(s) or use the deployed site.');
        }

        pending = true;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetchImpl(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              _captcha: 'false',
              _template: 'table',
              ...payload,
            }),
            signal: controller.signal,
            credentials: 'omit',
          });

          // Handle these HTTP errors even if the response body is HTML.
          if (response.status >= 500 || response.status === 429) {
            const result = classify(response);
            log('Request failed:', result);
            return result;
          }

          let data;
          try {
            data = await response.json();
          } catch {
            log('Response was not JSON. Check the endpoint URL:', url);
            return { kind: 'error', reason: 'invalid-response', detail: `HTTP ${response.status}` };
          }

          const result = classify(response, data);
          if (result.kind !== 'success') log('FormSubmit replied:', data);
          return result;
        } catch (error) {
          const timedOut = controller.signal.aborted;
          log(
            timedOut ? 'Request timed out.' : 'Network/CORS error. Check the endpoint, file:// usage, or ad blockers.',
            error
          );
          return {
            kind: 'error',
            reason: timedOut ? 'timeout' : 'network',
            detail: String(error?.message || error),
          };
        } finally {
          clearTimeout(timer);
          pending = false;
        }
      },
    };
  }

  return { brief, classify, createSender, ajaxEndpoint, DEFAULT_RECIPIENT };
});
