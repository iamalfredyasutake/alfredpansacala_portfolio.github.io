(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const report = byId('payment-report-body');
  const copyButton = byId('copy-payment-report');
  const copyField = byId('payment-report-copy');
  const reportStatus = byId('payment-report-status');
  let issue;
  let correction;
  let issueRuns = 0;
  let reproductions = 0;
  let lastIssueRun;

  function reportFields() {
    const observed = `${issue.attempts} attempts on DEMO-041 produced ${issue.charges} sample charges.`;
    const verification = correction
      ? `Corrected mode recorded ${correction.charges} sample charge(s) across ${correction.attempts} attempts. ${correction.charges === 1 ? 'The correction passed this sample check.' : 'The correction still needs investigation.'}`
      : 'Corrected mode has no completed run in this session. Enable the correction and retry twice to add verification.';
    return [
      ['Bug Title', 'Retrying one payment request creates a second charge'],
      ['Environment', [
        'Platform / Environment: Portfolio Studio browser simulation',
        'Device: Not captured by the demo',
        'Operating System: Not captured by the demo',
        'Browser / App Version: Portfolio Studio sample; browser version not captured',
        'Network Connection: No payment network is used',
        'User Account: Demo account, no sign-in required. Request DEMO-041.',
      ]],
      ['Bug Type', 'Functional · Payments'],
      ['Frequency / Reproducibility', `${reproductions}/${issueRuns} completed issue-mode runs in this visit. Each completed run includes at least two attempts.`],
      ['Priority', 'Urgent triage if reproduced in a live payment flow.'],
      ['Severity', 'Critical if confirmed on real transactions, due to duplicate charges.'],
      ['Preconditions', 'Open Payment retry, use the sample issue mode, and reset the requests.'],
      ['Steps to Reproduce', [
        'Select Send sample request for DEMO-041.',
        'Select Retry same sample request without creating another request.',
        'Compare Attempts and Sample charges and read the event log.',
      ]],
      ['Expected Result', 'One charge is recorded. Retrying the same request returns the original confirmation.'],
      ['Actual Result', observed],
      ['Error Message (if applicable)', 'No error was shown. The sample charge count increased and the log recorded a duplicate.'],
      ['Attachments', ['Simulation event log (up to 8 recent entries):', ...issue.log]],
      ['Additional Notes', `${verification} The data is illustrative. For a live ticket, attach a red-box screenshot or recording and relevant device or console logs.`],
    ];
  }

  function renderReport() {
    const list = document.createElement('dl');
    for (const [name, value] of reportFields()) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = name;
      if (Array.isArray(value)) {
        const lines = document.createElement(name === 'Steps to Reproduce' ? 'ol' : 'ul');
        for (const text of value) {
          const line = document.createElement('li');
          line.textContent = text;
          lines.append(line);
        }
        description.append(lines);
      } else {
        description.textContent = value;
      }
      row.append(term, description);
      list.append(row);
    }
    report.replaceChildren(list);
    copyButton.disabled = false;
    copyField.hidden = true;
    reportStatus.textContent = '';
  }

  document.addEventListener('portfolio:payment-evidence', ({detail: run}) => {
    if (run.attempts < 2) return;
    if (run.corrected) {
      correction = run;
    } else {
      if (lastIssueRun !== run.run) {
        issueRuns += 1;
        if (run.charges > 1) reproductions += 1;
        lastIssueRun = run.run;
      }
      if (run.charges > 1) issue = run;
    }
    if (issue) renderReport();
  });

  async function copyReport(text, field, status) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Bug report copied.';
    } catch {
      field.value = text;
      field.hidden = false;
      field.focus();
      field.select();
      status.textContent = 'Select and copy the report below.';
    }
  }

  copyButton.addEventListener('click', () => {
    if (!issue) return;
    const text = reportFields().map(([name, value]) => {
      if (!Array.isArray(value)) return `${name}\n${value}`;
      const lines = value.map((item, index) =>
        name === 'Steps to Reproduce' ? `${index + 1}. ${item}` : `- ${item}`);
      return `${name}\n${lines.join('\n')}`;
    }).join('\n\n');
    copyReport(text, copyField, reportStatus);
  });

  const completedReport = byId('sample-report-copy');
  byId('copy-sample-report').addEventListener('click', () => {
    copyReport(completedReport.value, completedReport, byId('sample-report-status'));
  });

  const bonusForm = byId('bonus-scenario');
  const money = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', currencyDisplay: 'code'});
  const presetValues = {below: [1.29, 0], equal: [1.30, 0], above: [1.31, 0], expiry: [1.31, 168]};

  function runBonus() {
    const inputs = Object.fromEntries(new FormData(bonusForm));
    const result = window.PortfolioQA.bonusOutcome(inputs);
    if (!result) return;
    const messages = {
      ineligible: 'The account is ineligible. No new bonus is credited.',
      failed: 'The deposit did not complete. No bonus is credited.',
      active: 'This sample blocks a second active bonus.',
    };
    let message = 'This settled bet qualifies toward the wagering target.';
    if (inputs.eligibility !== 'eligible') message = messages[inputs.eligibility];
    else if (result.expired) message = 'The bonus has expired. This bet adds no wagering progress.';
    else if (Number(inputs.odds) <= 1.30) message = 'Only odds above 1.30 qualify. This bet adds no progress.';
    else if (inputs.settlement !== 'settled') message = 'This sample counts settled bets only.';
    else if (result.progress === 0) message = 'A zero stake adds no wagering progress.';
    byId('bonus-result').hidden = false;
    byId('bonus-status').textContent = message;
    for (const [id, value] of Object.entries({
      'bonus-credit': result.credit, 'bonus-target': result.target,
      'bonus-progress': result.progress, 'bonus-remaining': result.remaining,
    })) {
      byId(id).textContent = value === null ? 'Not active' : money.format(value / 100);
    }
    document.dispatchEvent(new CustomEvent('portfolio:qa-stage', {detail: {index: 1}}));
  }

  bonusForm.addEventListener('submit', event => {
    event.preventDefault();
    runBonus();
  });
  bonusForm.querySelectorAll('[data-bonus-preset]').forEach(button => {
    button.addEventListener('click', () => {
      const [odds, hours] = presetValues[button.dataset.bonusPreset];
      bonusForm.elements.odds.value = odds.toFixed(2);
      bonusForm.elements.hours.value = hours;
      bonusForm.requestSubmit();
    });
  });

  const tabs = [...document.querySelectorAll('[data-review-language]')];
  function selectLanguage(selected) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      byId(tab.getAttribute('aria-controls')).hidden = !active;
    }
    document.dispatchEvent(new CustomEvent('portfolio:reveal', {detail: {
      root: byId(selected.getAttribute('aria-controls')),
    }}));
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectLanguage(tab));
    tab.addEventListener('keydown', event => {
      const offsets = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1};
      if (!(event.key in offsets)) return;
      event.preventDefault();
      const next = tabs[(offsets[event.key] + tabs.length) % tabs.length];
      selectLanguage(next);
      next.focus();
    });
  });
  selectLanguage(tabs[0]);

  const casePicker = byId('lqa-case-select');
  const categoryPicker = byId('lqa-category-select');
  const feedback = byId('lqa-classification-result');
  const findings = [...document.querySelectorAll('[data-lqa-example]')];
  const previews = [...document.querySelectorAll('[data-lqa-preview]')];
  const previewHint = byId('lqa-preview-hint');
  let finding;
  let preview;

  function syncExpected() {
    const revealed = finding.querySelector('details').open;
    preview.querySelector('[data-lqa-expected]').hidden = !revealed;
    previewHint.hidden = revealed;
  }

  function selectFinding() {
    finding = findings.find(panel => panel.dataset.lqaExample === casePicker.value);
    preview = previews.find(panel => panel.dataset.lqaPreview === casePicker.value);
    findings.forEach(panel => { panel.hidden = panel !== finding; });
    previews.forEach(panel => { panel.hidden = panel !== preview; });
    syncExpected();
    categoryPicker.value = '';
    feedback.textContent = '';
    document.dispatchEvent(new CustomEvent('portfolio:reveal', {detail: {root: finding}}));
  }

  findings.forEach(panel => panel.querySelector('details').addEventListener('toggle', () => {
    if (panel === finding) syncExpected();
  }));
  casePicker.addEventListener('change', selectFinding);
  selectFinding();
  byId('lqa-classify').addEventListener('submit', event => {
    event.preventDefault();
    if (categoryPicker.value === finding.dataset.category) {
      feedback.textContent = 'Correct. ' + finding.dataset.category + '. The expected screen is now visible.';
      finding.querySelector('details').open = true;
    } else {
      feedback.textContent = 'Compare the expected and observed behavior, then try again or read the example finding.';
    }
  });

  function openFocusedView() {
    const view = byId(location.hash.slice(1));
    if (view?.classList.contains('focused-view')) {
      const disclosure = view.closest('details');
      if (!disclosure.open) {
        disclosure.open = true;
        view.scrollIntoView({block: 'start', behavior: 'instant'});
      }
    }
  }
  addEventListener('hashchange', openFocusedView);
  openFocusedView();
})();
