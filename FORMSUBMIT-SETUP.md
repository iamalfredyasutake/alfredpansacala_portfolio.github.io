# FormSubmit delivery

Portfolio Studio sends inquiries to `https://formsubmit.co/ajax/pansacala.alfred04@gmail.com` with named JSON fields. The form also supports a native POST without JavaScript.

## One-time owner setup

1. Submit a short test brief through the published Contact section.
2. If this form/address is not active yet, open FormSubmit's activation email in **pansacala.alfred04@gmail.com** and confirm the form. Check Spam if necessary.
3. Verify that the test brief reaches the inbox and that Reply addresses the submitted visitor email.

FormSubmit requires this confirmation before forwarding submissions. See its [setup guide](https://formsubmit.co/) and [activation help](https://formsubmit.co/help). Activation and actual inbox receipt were not performed by the implementation agent. Browser delivery tests use an isolated transport and send no real email.

## Visitor behavior

- The form shows name, email and message together. **Add project details** contains optional service, platform, timing and language or market fields.
- **Start a QA inquiry** sets the service to QA / Software Testing. **Send inquiry** submits the form.
- While sending, fields and submission controls are disabled; a pending request cannot start a duplicate request.
- Success is shown only for an explicit affirmative FormSubmit response. It means provider acceptance, not an inbox-delivery guarantee.
- A missing activation, rejected request, rate limit, timeout or connection problem retains every field and offers **Open my email app** and **Copy my brief**. The mail link carries the same information and uses the visitor's default app, including Outlook.
- No automatic email-app redirect or retry runs. The visitor chooses their recovery route.
- Provider anti-spam defaults remain enabled; a hidden honeypot is also included. No autoresponder or unrelated recipient is configured.

## Verification

Run `python scripts/validate_content.py` and `node --test scripts/test_delivery_qa.cjs`.

`python scripts/build_qa.py` prepares the local layout runner and a separate contact fixture. Its delivery selector can simulate success, a service error, offline state, pending activation and slow success. The fixture displays a clear simulation banner and never calls FormSubmit. Remove `dist/qa.html`, `dist/qa-fixtures/` and `dist/qa-contact-transport.js` before packaging a deployment.
