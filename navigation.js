// Keep dialog actions clear of the floating pending-review entry.
(() => {
  if(document.getElementById('business-modal-footer-style'))return;
  const link=document.createElement('link');link.id='business-modal-footer-style';link.rel='stylesheet';
  link.href=new URL('弹窗操作栏.css',document.currentScript.src).href;
  document.head.appendChild(link);
})();
(() => {
  const menuGroups = [
  {
    "title": "智能监护中心",
    "icon": "fa-shield",
    "center": "monitor",
    "href": "方案图册.html",
    "children": [
      {
        "title": "监测一张图",
        "icon": "fa-picture-o",
        "href": "方案图册.html"
      },
      {
        "title": "AI报警中心",
        "icon": "fa-bell",
        "href": "AI隐患核查.html"
      },
      {
        "title": "查处管理",
        "icon": "fa-exclamation-triangle",
        "href": "隐患违章管理-违章查处.html"
      },
      {
        "title": "数据统计",
        "icon": "fa-bar-chart",
        "children": [
          { "title": "统计报表", "href": "统计报表.html" },
          { "title": "数据分析", "href": "数据分析.html" },
          { "title": "安全管理报告", "href": "安全管理报告.html" }
        ]
      },
      {
        "title": "区域管理",
        "icon": "fa-map-o",
        "children": [
          { "title": "区域配置", "href": "区域配置.html" }
        ]
      },
      {
        "title": "样本库",
        "icon": "fa-picture-o",
        "href": "样本库.html"
      },
      {
        "title": "参数配置",
        "icon": "fa-sliders",
        "children": [
          {
            "title": "基础配置",
            "href": "基础配置.html"
          },
          {
            "title": "报警等级配置",
            "href": "报警等级配置.html"
          },
          {
            "title": "误报类型配置",
            "href": "误报类型配置.html"
          }
        ]
      },
      {
        "title": "规格说明书",
        "icon": "fa-file-text-o",
        "href": "规格说明书.html"
      }
    ]
  }
];

  const actionRoutes = [
    { labels: ['复核'], href: 'AI识别的违章复核.html', exact: true },
  ];

  const normalize = text => (text || '').replace(/\s+/g, '').trim();
  const currentFile = decodeURIComponent(location.pathname.split('/').pop() || '');
  const isSamePage = href => {
    if (!href) return false;
    const target = new URL(href, location.href);
    const targetFile = decodeURIComponent(target.pathname.split('/').pop() || '');
    if (currentFile === '边缘盒子部署.html' && targetFile === '防灾智盒部署.html') return true;
    if(new URLSearchParams(location.search).has('statsDrill')&&!target.search)return currentFile===targetFile;
    return currentFile === targetFile && location.search === target.search;
  };
  const go = href => {
    const target = new URL(href, location.href);
    if (location.pathname !== target.pathname || location.search !== target.search) location.href = href;
  };

  const flattenMenu = groups => groups.flatMap(group => group.children ? group.children : [group]);
  const activeGroup = group => isSamePage(group.href) || group.children?.some(child => isSamePage(child.href) || activeGroup(child));
  const firstGroupHref = group => {
    if (group.href) return group.href;
    for (const child of group.children || []) {
      const href = firstGroupHref(child);
      if (href) return href;
    }
    return '';
  };

  const injectStyle = () => {
    if (document.getElementById('unified-navigation-style')) return;
    const style = document.createElement('style');
    style.id = 'unified-navigation-style';
    style.textContent = `
      :root { --unified-topnav-height: 68px; }
      .page-head-with-account { display:flex !important; align-items:center; justify-content:space-between; }
      .prototype-account { display:flex; align-items:center; gap:9px; color:#24344d; font:400 14px 'Microsoft YaHei',sans-serif; white-space:nowrap; }
      .prototype-account-icon { width:28px; height:28px; border-radius:50%; display:grid; place-items:center; color:#8190a5; background:#f1f4f8; }
      .prototype-account small { display:block; font-size:12px; color:#8190a5; line-height:1.2; }

      body.unified-topnav-page {
        padding-top: var(--unified-topnav-height) !important;
        min-width: 1080px;
      }
      body.unified-topnav-page > aside:not([data-keep-sidebar]) { display: none !important; }
      .unified-topnav {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        right: 0 !important;
        height: var(--unified-topnav-height) !important;
        z-index: 1000 !important;
        background: #07162f !important;
        color: #dceeff !important;
        display: flex !important;
        align-items: stretch !important;
        justify-content: flex-start !important;
        border-bottom: 1px solid #194a7c;
        box-shadow: 0 3px 10px rgba(3, 15, 35, .22) !important;
      }
      .unified-topnav, .unified-topnav * { box-sizing: border-box; }
      .unified-nav-side {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 0;
      }
      .unified-nav-side--left { order: 1; justify-content: flex-start; }
      .unified-nav-side--right { order: 2; justify-content: flex-start; margin-left: 10px; }
      .unified-brand {
        order: 0;
        position: relative;
        isolation: isolate;
        width: clamp(410px, 34vw, 560px);
        min-width: 410px;
        height: 68px;
        margin: 0 18px 0 0;
        padding: 0 52px 0 30px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 14px;
        color: #eaf7ff;
        text-decoration: none;
        text-shadow: 0 0 12px rgba(63, 184, 255, .45);
      }
      .unified-brand::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: linear-gradient(180deg, #0c315c 0%, #082341 100%);
        border: 1px solid #2aa8f0;
        clip-path: polygon(0 0, 100% 0, 88% 100%, 0 100%);
        box-shadow: inset 0 0 18px rgba(39, 165, 239, .28);
      }
      .unified-brand-mark {
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        display: block;
        object-fit: contain;
        filter: drop-shadow(0 0 7px rgba(55, 137, 255, .32));
      }
      .unified-brand-name {
        font-size: clamp(17px, 1.4vw, 23px);
        font-weight: 700;
        font-family: "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        letter-spacing: .08em;
        white-space: nowrap;
      }
      .unified-nav-group { position: relative; height: 100%; display: flex; align-items: center; }
      .unified-nav-trigger {
        height: 38px;
        width: 146px;
        min-width: 146px;
        padding: 0 22px;
        border: 1px solid rgba(73, 128, 190, .2);
        border-radius: 0;
        background: linear-gradient(180deg, rgba(20, 43, 72, .82), rgba(8, 25, 48, .92));
        color: #c3cfdd;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        font-family: "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        font-size: 14px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: .04em;
        cursor: pointer;
        box-shadow: inset 0 -1px 0 rgba(55, 128, 201, .2);
        clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
        transition: color .18s ease, background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
      }
      .unified-nav-trigger > .fa { display: none; }
      .unified-nav-trigger:hover,
      .unified-nav-trigger:focus-visible {
        color: #f3f7fb;
        background: linear-gradient(135deg, rgba(24, 72, 126, .88), rgba(47, 43, 103, .84));
        border-color: rgba(101, 148, 199, .42);
        outline: none;
      }
      .unified-nav-trigger:focus-visible { box-shadow: inset 0 0 0 2px rgba(130, 184, 255, .5); }
      .unified-nav-group.active > .unified-nav-trigger {
        color: #f7f9fc;
        font-weight: 700;
        background: linear-gradient(135deg, #174b80 0%, #39306f 100%);
        border-color: rgba(102, 151, 204, .5);
        box-shadow: inset 0 -3px 0 #4aa6d8, 0 3px 8px rgba(2, 16, 38, .3);
      }
      .unified-dropdown {
        display: none;
        position: absolute;
        top: 56px;
        left: 50%;
        width: 260px;
        padding: 8px;
        border: 1px solid #245b88;
        border-radius: 6px;
        background: #0b2341;
        box-shadow: 0 8px 16px rgba(2, 12, 28, .28);
        opacity: 0;
        visibility: hidden;
        transform: translate(-50%, -5px);
        transition: opacity .18s ease, transform .18s ease, visibility .18s;
      }
      .unified-dropdown-section + .unified-dropdown-section { border-top: 1px solid rgba(113, 181, 230, .16); margin-top: 6px; padding-top: 6px; }
      .unified-dropdown-title { padding: 7px 10px 5px; color: #6fa9d4; font-size: 12px; font-weight: 600; }
      .unified-dropdown-link {
        min-height: 36px;
        padding: 8px 10px;
        border-radius: 4px;
        color: #c6def0;
        display: flex;
        align-items: center;
        gap: 9px;
        text-decoration: none;
        font-size: 13px;
        transition: background-color .16s ease, color .16s ease;
      }
      .unified-dropdown-link:hover, .unified-dropdown-link.active { background: #123c68; color: #fff; }
      .unified-dropdown-link .fa { width: 14px; text-align: center; color: #4bb8f6; }
      body.unified-subnav-open { padding-left: 224px !important; }
      body.unified-subnav-open .page-shell,
      body.unified-subnav-open .platform-shell,
      body.unified-subnav-open .workbench-content,
      body.unified-subnav-open > [style*="margin-left:240px"],
      body.unified-subnav-open > [style*="margin-left: 240px"],
      body.unified-subnav-open > div.flex.h-full > aside:first-child + div,
      body.unified-subnav-open > div.flex.h-screen > aside:first-child + div,
      body.unified-subnav-open > div.flex > aside:first-child + div,
      body.unified-subnav-open [class*="ml-[240px]"][class*="w-[calc(100%-240px)]"] {
        width: 100% !important;
        max-width: none !important;
        margin-left: 0 !important;
      }
      body.unified-subnav-open .platform-shell,
      body.unified-subnav-open .workbench-content { flex: 1 1 auto !important; min-width: 0 !important; }
      .unified-subnav {
        position: fixed;
        left: 0;
        top: var(--unified-topnav-height);
        bottom: 0;
        z-index: 900;
        width: 224px;
        overflow-y: auto;
        padding: 14px 10px 22px;
        background: #0d2346;
        border-right: 1px solid #183b69;
        color: #c7d8ef;
        box-shadow: 3px 0 10px rgba(3, 16, 38, .12);
      }
      .unified-subnav::-webkit-scrollbar { width: 5px; }
      .unified-subnav::-webkit-scrollbar-thumb { background: #31577f; border-radius: 999px; }
      .unified-subnav-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 42px;
        padding: 0 12px 10px;
        margin-bottom: 6px;
        border-bottom: 1px solid rgba(142, 188, 225, .16);
        color: #fff;
        font-size: 14px;
        font-weight: 700;
      }
      .unified-subnav-item,
      .unified-subnav-group-trigger {
        width: 100%;
        min-height: 42px;
        padding: 9px 12px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #bfd1e9;
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        text-decoration: none;
        font: 500 14px/1.35 "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
        cursor: pointer;
        transition: background-color .16s ease, color .16s ease;
      }
      .unified-subnav-item:hover,
      .unified-subnav-group-trigger:hover { background: rgba(59, 139, 211, .16); color: #fff; }
      .unified-subnav-item.active { background: #15518d; color: #fff; font-weight: 600; }
      .unified-subnav-item .fa,
      .unified-subnav-group-trigger .fa:first-child { width: 17px; color: #67bff4; text-align: center; }
      .unified-subnav-group-trigger .fa-angle-down { margin-left: auto; width: auto; color: #7899ba; transition: transform .16s ease; }
      .unified-subnav-group.expanded .unified-subnav-group-trigger { color: #fff; background: rgba(59, 139, 211, .11); }
      .unified-subnav-group.expanded .fa-angle-down { transform: rotate(180deg); }
      .unified-subnav-children { display: none; padding: 4px 0 6px 28px; }
      .unified-subnav-group.expanded .unified-subnav-children { display: block; }
      .unified-subnav-children .unified-subnav-item { min-height: 34px; padding: 7px 10px; font-size: 13px; }
      @media (max-width: 1280px) {
        .unified-nav-side { padding-inline: 0; gap: 8px; }
        .unified-nav-side--right { margin-left: 8px; }
        .unified-nav-trigger { width: 132px; min-width: 132px; padding-inline: 16px; font-size: 14px; }
        .unified-brand { min-width: 360px; width: 360px; margin-right: 8px; padding: 0 36px 0 20px; }
        .unified-brand-name { font-size: 17px; letter-spacing: .03em; }
      }
      @media (prefers-reduced-motion: reduce) {
        .unified-topnav * { transition-duration: .01ms !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const renderSubnav = group => {
    let subnav = document.querySelector('.unified-subnav');
    if (!subnav) {
      subnav = document.createElement('aside');
      subnav.className = 'unified-subnav';
      subnav.dataset.keepSidebar = 'true';
      subnav.setAttribute('aria-label', '页面左侧导航');
      document.body.appendChild(subnav);
    }
    document.body.classList.add('unified-subnav-open');
    subnav.innerHTML = `<div class="unified-subnav-heading"><i class="fa ${group.icon}" aria-hidden="true"></i><span>${group.title}</span></div>`;
    group.children.forEach(item => {
      if (!item.children) {
        const link = document.createElement(item.href ? 'a' : 'div');
        if (item.href) link.href = item.href;
        link.className = `unified-subnav-item${item.href && isSamePage(item.href) ? ' active' : ''}`;
        link.innerHTML = `<i class="fa ${item.icon || 'fa-angle-right'}" aria-hidden="true"></i><span>${item.title}</span>`;
        subnav.appendChild(link);
        return;
      }
      const itemIsActive = activeGroup(item);
      const section = document.createElement('div');
      section.className = `unified-subnav-group${itemIsActive ? ' expanded' : ''}`;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'unified-subnav-group-trigger';
      trigger.setAttribute('aria-expanded', String(itemIsActive));
      trigger.innerHTML = `<i class="fa ${item.icon || 'fa-folder-o'}" aria-hidden="true"></i><span>${item.title}</span><i class="fa fa-angle-down" aria-hidden="true"></i>`;
      const children = document.createElement('div');
      children.className = 'unified-subnav-children';
      item.children.forEach(child => {
        const link = document.createElement(child.href ? 'a' : 'div');
        if (child.href) link.href = child.href;
        link.className = `unified-subnav-item${child.href && isSamePage(child.href) ? ' active' : ''}`;
        link.innerHTML = `<i class="fa fa-angle-right" aria-hidden="true"></i><span>${child.title}</span>`;
        children.appendChild(link);
      });
      trigger.addEventListener('click', () => {
        const expanded = section.classList.toggle('expanded');
        trigger.setAttribute('aria-expanded', String(expanded));
      });
      section.append(trigger, children);
      subnav.appendChild(section);
    });
    try { sessionStorage.setItem('unified-active-center', group.title); } catch (_) {}
  };

  const createGroup = group => {
    const wrapper = document.createElement('div');
    wrapper.className = `unified-nav-group${activeGroup(group) ? ' active' : ''}`;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'unified-nav-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `<i class="fa ${group.icon}" aria-hidden="true"></i><span>${group.title}</span>`;
    const dropdown = document.createElement('div');
    dropdown.className = 'unified-dropdown';
    group.children.forEach(section => {
      const sectionEl = document.createElement('div');
      sectionEl.className = 'unified-dropdown-section';
      const items = section.children || [section];
      if (section.children) sectionEl.innerHTML = `<div class="unified-dropdown-title">${section.title}</div>`;
      items.forEach(item => {
        const link = document.createElement(item.href ? 'a' : 'div');
        if (item.href) link.href = item.href;
        link.className = `unified-dropdown-link${item.href && isSamePage(item.href) ? ' active' : ''}`;
        link.innerHTML = `<i class="fa ${item.icon || 'fa-angle-right'}" aria-hidden="true"></i><span>${item.title}</span>`;
        sectionEl.appendChild(link);
      });
      dropdown.appendChild(sectionEl);
    });
    trigger.addEventListener('click', () => {
      document.querySelectorAll('.unified-nav-group.open').forEach(item => item.classList.remove('open'));
      trigger.setAttribute('aria-expanded', 'false');
      renderSubnav(group);
      const landingPage = firstGroupHref(group);
      if (landingPage) go(landingPage);
    });
    wrapper.append(trigger, dropdown);
    return wrapper;
  };

  const renderMenu = () => {
    injectStyle();
    if (document.querySelector('.unified-topnav')) return;
    document.body.classList.add('unified-topnav-page');
    const pageHead = document.querySelector('.page-head');
    if (pageHead && !pageHead.querySelector('.prototype-account')) {
      pageHead.classList.add('page-head-with-account');
      const account = document.createElement('div');
      account.className = 'prototype-account';
      account.setAttribute('aria-label', '当前登录账户：张安全，安全环保部·安全科');
      account.innerHTML = '<span class="prototype-account-icon" aria-hidden="true"><i class="fa fa-user"></i></span><span>张安全<small>安全环保部·安全科</small></span>';
      pageHead.appendChild(account);
    }

    const header = document.createElement('header');
    header.className = 'unified-topnav';
    header.setAttribute('aria-label', '平台总导航');
    const left = document.createElement('nav');
    left.className = 'unified-nav-side unified-nav-side--left';
    left.setAttribute('aria-label', '左侧中心导航');
    const right = document.createElement('nav');
    right.className = 'unified-nav-side unified-nav-side--right';
    right.setAttribute('aria-label', '右侧中心导航');
    const brand = document.createElement('a');
    brand.className = 'unified-brand';
    brand.href = 'AI隐患核查.html';
    brand.setAttribute('aria-label', '进入监测一张图');
    brand.innerHTML = '<img class="unified-brand-mark" src="assets/branding/platform-logo.png" alt=""><span class="unified-brand-name">AI智能报警处置平台</span>';
    header.append(left, brand, right);
    document.body.insertBefore(header, document.body.firstChild);
    const requestedCenter = new URLSearchParams(location.search).get('center');
    let initialGroup = menuGroups.find(group => group.center === requestedCenter) || menuGroups.find(group => activeGroup(group));
    if (!initialGroup) {
      try {
        const savedTitle = sessionStorage.getItem('unified-active-center');
        initialGroup = menuGroups.find(group => group.title === savedTitle);
      } catch (_) {}
    }
    if (initialGroup) renderSubnav(initialGroup);
    document.addEventListener('click', event => {
      document.querySelectorAll('.unified-nav-group.open').forEach(group => {
        if (!group.contains(event.target)) {
          group.classList.remove('open');
          group.querySelector('.unified-nav-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  const bindElement = (element, href) => {
    if (!element || element.dataset.linkBound === href) return;
    element.dataset.linkBound = href;
    element.style.cursor = 'pointer';
    element.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      go(href);
    });
  };

  const bindByText = ({ labels, href, exact = true }, scope = document) => {
    const normalizedLabels = labels.map(normalize);
    const candidates = scope.querySelectorAll('a, button, span, div, i, li, td');
    candidates.forEach(element => {
      const text = normalize(element.getAttribute('title') || element.textContent);
      if (!text) return;
      const matched = exact
        ? normalizedLabels.some(label => text === label)
        : normalizedLabels.some(label => text === label || text.includes(label));
      if (matched) bindElement(element.closest('a, button') || element, href);
    });
  };

  const bindActions = () => {
    actionRoutes.forEach(route => {
      if (route.pages && !route.pages.includes(currentFile)) return;
      bindByText(route);
    });
  };

  const setup = () => {
    renderMenu();
    bindActions();

  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

// Shared alarm notification across all business pages using this navigation.
(() => {
 const source = document.currentScript.src;
 const script = document.createElement('script');
 script.src = new URL('全局报警提醒.js?v=20261102-layer', source).href;
 document.head.appendChild(script);
})();

