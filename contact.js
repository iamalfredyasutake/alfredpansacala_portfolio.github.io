(() => {
  'use strict';

  const find = selector => document.querySelector(selector);
  const form = find('#inquiry-form');
  const recipient = new URL(form.action).pathname.slice(1);
  const delivery = window.PortfolioDelivery;
  const sender = delivery.createSender({endpoint: 'https://formsubmit.co/ajax/' + recipient});
  const submit = find('#brief-submit');
  const status = find('#form-status');
  const feedback = find('#delivery-feedback');
  const fallback = find('#delivery-fallback');
  const service = find('#inquiry-service');
  const context = find('#inquiry-context');
  const fields = ['#inquiry-name', '#inquiry-email', '#inquiry-message'].map(find);
  const requiredMessages = ['Enter your name.', 'Enter your email address.', 'Tell me what you need help with.'];
  let pending = false;
  let complete = false;

  form.noValidate = true;

  function values() {
    return Object.fromEntries(new FormData(form));
  }

  function draft() {
    const copy = delivery.brief(values(), recipient);
    find('#brief-email-fallback').href = copy.mailto;
    return copy;
  }

  function show(kind, title, message) {
    feedback.hidden = false;
    feedback.dataset.state = kind;
    find('#delivery-title').textContent = title;
    find('#delivery-message').textContent = message;
    fallback.hidden = kind === 'success';
    status.textContent = '';
    find('#a11y-status').textContent = title;
  }

  function fieldError(field, message) {
    const error = document.getElementById(field.id + '-error');
    error.hidden = !message;
    error.textContent = message;
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function validate() {
    let firstInvalid;
    fields.forEach((field, index) => {
      const message = !field.value.trim() ? requiredMessages[index]
        : field.validity.typeMismatch ? 'Enter an email address such as name@example.com.'
        : field.validity.valid ? '' : field.validationMessage;
      fieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function showService() {
    context.hidden = !service.value;
    context.textContent = service.value ? service.value + ' selected' : '';
  }

  form.addEventListener('input', event => {
    if (fields.includes(event.target)) fieldError(event.target, '');
    if (!fallback.hidden) draft();
  });
  form.addEventListener('change', () => {
    showService();
    if (!fallback.hidden) draft();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || complete || !validate()) return;

    const payload = values();
    const copy = draft();
    payload._subject = copy.subject;
    payload._replyto = String(payload.email).trim();

    const controls = [...form.querySelectorAll('input, textarea, select, button')]
      .map(control => [control, control.disabled]);
    pending = true;
    form.setAttribute('aria-busy', 'true');
    controls.forEach(([control]) => { control.disabled = true; });
    submit.textContent = 'Sending…';
    status.textContent = 'Sending your inquiry…';
    feedback.hidden = true;

    const result = await sender.send(payload);
    controls.forEach(([control, disabled]) => { control.disabled = disabled; });
    pending = false;
    form.removeAttribute('aria-busy');

    if (result.kind === 'success') {
      complete = true;
      submit.textContent = 'Inquiry submitted';
      submit.disabled = true;
      show('success', 'Inquiry submitted.', 'FormSubmit accepted your message. I’ll reply to the email you provided.');
      find('#send-another-brief').hidden = false;
      return;
    }

    submit.textContent = 'Try sending again';
    if (result.kind === 'activation') {
      show('activation', 'Email setup is pending.',
        'FormSubmit needs confirmation from Alfred. Use your email app to send the same inquiry.');
      return;
    }

    let message = 'We couldn’t confirm delivery. Your details are still here. Try again or open your email app.';
    if (result.reason === 'rate-limit') {
      message = 'The delivery service is busy. Try again later or send the same inquiry through your email app.';
    }
    if (result.reason === 'timeout' || result.reason === 'network') {
      message = 'The connection ended before delivery could be confirmed. Your message may have arrived. You can also open your email app.';
    }
    show('error', 'Delivery could not be confirmed.', message);
  });

  find('#copy-brief').addEventListener('click', async () => {
    const copy = draft();
    const text = copy.subject + '\n\n' + copy.body;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Inquiry copied. Paste it into your email app.';
    } catch {
      const field = find('#brief-copy-text');
      field.hidden = false;
      field.value = text;
      field.focus();
      field.select();
      status.textContent = 'Select and copy the inquiry below.';
    }
  });

  find('#send-another-brief').addEventListener('click', () => {
    complete = false;
    form.reset();
    fields.forEach(field => fieldError(field, ''));
    showService();
    find('#inquiry-scope').open = false;
    feedback.hidden = true;
    fallback.hidden = true;
    find('#brief-copy-text').hidden = true;
    find('#send-another-brief').hidden = true;
    submit.disabled = false;
    submit.textContent = 'Send inquiry';
    status.textContent = '';
    fields[0].focus();
  });
})();
