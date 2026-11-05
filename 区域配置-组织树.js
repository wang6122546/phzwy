(function () {
  'use strict';

  function directText(element) {
    return Array.from(element.childNodes)
      .filter(function (node) { return node.nodeType === Node.TEXT_NODE; })
      .map(function (node) { return node.textContent.trim(); })
      .join('');
  }

  function findPanel(title) {
    var current = title;
    var fallback = null;
    for (var depth = 0; current && depth < 7; depth += 1, current = current.parentElement) {
      var parent = current.parentElement;
      if (!parent) continue;
      var rect = current.getBoundingClientRect();
      var width = rect.width;
      var parentDisplay = window.getComputedStyle(parent).display;
      if (width >= 180 && width <= 340 && parentDisplay.indexOf('flex') !== -1) {
        fallback = fallback || current;
        // The real organization panel spans most of the content area's height.
        // A height check avoids attaching the toggle to its small title row.
        if (rect.height >= Math.min(360, window.innerHeight * 0.5)) return current;
      }
    }
    return fallback;
  }

  function initOrgPanelToggle() {
    if (document.getElementById('orgPanelToggle')) return;

    var title = Array.from(document.querySelectorAll('h1,h2,h3,h4,div,span'))
      .find(function (element) {
        if (element.closest('nav, .unified-menu, .unified-sidebar')) return false;
        return directText(element) === '组织架构';
      });
    if (!title) return;

    var panel = findPanel(title);
    if (!panel || panel.dataset.orgToggleReady === 'true') return;
    panel.dataset.orgToggleReady = 'true';
    panel.classList.add('global-org-panel');

    var original = {
      width: panel.style.width,
      minWidth: panel.style.minWidth,
      maxWidth: panel.style.maxWidth,
      flexBasis: panel.style.flexBasis,
      padding: panel.style.padding,
      overflow: panel.style.overflow,
      position: panel.style.position
    };

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'global-org-toggle';
    button.textContent = '展开';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '展开组织架构');
    button.title = '展开组织架构';
    panel.appendChild(button);

    function setOpen(open) {
      panel.classList.toggle('global-org-panel-collapsed', !open);
      button.textContent = open ? '收起' : '展开';
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? '收起组织架构' : '展开组织架构');
      button.title = open ? '收起组织架构' : '展开组织架构';
      if (open) {
        Object.keys(original).forEach(function (key) { panel.style[key] = original[key]; });
        // The toggle is absolutely positioned against the panel in both states.
        panel.style.setProperty('position', 'relative', 'important');
      } else {
        panel.style.setProperty('width', '40px', 'important');
        panel.style.setProperty('min-width', '40px', 'important');
        panel.style.setProperty('max-width', '40px', 'important');
        panel.style.setProperty('flex-basis', '40px', 'important');
        panel.style.setProperty('padding', '0', 'important');
        panel.style.setProperty('overflow', 'hidden', 'important');
        panel.style.setProperty('position', 'relative', 'important');
      }
    }

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });
    setOpen(false);
  }

  var style = document.createElement('style');
  style.textContent = [
    '.global-org-panel{position:relative!important;transition:width .2s ease,min-width .2s ease,flex-basis .2s ease;}',
    '.global-org-panel-collapsed>*:not(.global-org-toggle){display:none!important;}',
    '.global-org-toggle{position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);width:28px;padding:10px 5px;border:1px solid #2563eb;border-radius:5px;background:#fff;color:#2563eb;font-size:12px;line-height:1.15;writing-mode:vertical-rl;letter-spacing:2px;cursor:pointer;box-shadow:0 2px 8px rgba(37,99,235,.12);}',
    '.global-org-toggle:hover{background:#eff6ff;}',
    '.global-org-panel:not(.global-org-panel-collapsed)>.global-org-toggle{left:auto;right:-14px;top:50%;transform:translateY(-50%);}'
  ].join('');
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initOrgPanelToggle);
  else initOrgPanelToggle();
})();
