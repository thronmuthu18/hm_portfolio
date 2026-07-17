/**
 * CRM Dashboard Master Bootstrap
 * Manages: Page routing, state initialization, navigation, sidebar controls,
 *          browsers alerts, sound notifications, toast alerts, themes, and shortcuts.
 */

'use strict';

// Shared Global State
const state = {
  admin: null,
  currentPage: 'dashboard',
  messages: [],
  search: '',
  filter: 'all',
  sort: 'newest',
  budgetRange: 'all',
  projectTypeFilter: 'all',
  page: 1,
  limit: 10,
  totalPages: 1,
  total: 0
};

const dashboard = {
  notificationAudio: null,
  lastUnreadCount: 0,
  _analyticsLoadedAt: 0, // Timestamp of last successful analytics.load() call
  _ANALYTICS_DEBOUNCE_MS: 30 * 1000, // Don't re-fetch analytics more frequently than every 30s

  /**
   * Run auth check and bootstrap UI
   */
  init: async () => {
    // 1. Initialize audio notify
    dashboard.notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');

    // 2. Load UI features
    dashboard.initTheme();
    dashboard.initSidebarCollapse();
    dashboard.initKeyboardShortcuts();

    try {
      const res = await api.fetch('/profile');
      if (!res || !res.ok) {
        api.clearAuth();
        window.location.href = './index.html';
        return;
      }
      
      const json = await res.json();
      state.admin = json.data;

      // Sync Profile UI
      const nameBox = document.getElementById('adminName');
      const avatarBox = document.getElementById('adminAvatarLetter');
      if (nameBox) nameBox.textContent = state.admin.username;
      if (avatarBox) avatarBox.textContent = state.admin.username[0].toUpperCase();

      // Setup actions
      dashboard.initNavigation();
      search.init();
      filters.init();
      pagination.initLimitSelector();
      settings.init();

      // Go to default dashboard screen
      dashboard.navigateTo('dashboard');

      // Periodic check for new unread messages to trigger notifications
      dashboard.startLiveUpdates();

    } catch (_) {
      api.clearAuth();
      window.location.href = './index.html';
    }
  },

  /**
   * Theme configuration controls
   */
  initTheme: () => {
    const savedTheme = localStorage.getItem('crm_theme') || 'auto';
    dashboard.setTheme(savedTheme);

    // Bind click events on switcher buttons
    const container = document.getElementById('themeSwitcher');
    if (container) {
      container.querySelectorAll('.theme-switch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.dataset.theme;
          dashboard.setTheme(t);
          localStorage.setItem('crm_theme', t);
        });
      });
    }
  },

  setTheme: (theme) => {
    const root = document.documentElement;
    
    // De-activate all switcher buttons
    const container = document.getElementById('themeSwitcher');
    if (container) {
      container.querySelectorAll('.theme-switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
      });
    }

    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    } else {
      // Auto: match media query
      const darkPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('theme-light', !darkPref);
      root.classList.toggle('theme-dark', darkPref);
    }
  },

  /**
   * Collapsible Sidebar restore
   */
  initSidebarCollapse: () => {
    const isCollapsed = localStorage.getItem('crm_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', isCollapsed);
      const toggleBtn = document.getElementById('sidebarCollapseBtn');
      if (toggleBtn) {
        toggleBtn.textContent = isCollapsed ? '›' : '‹';
      }
    }
  },

  toggleSidebarCollapse: () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const collapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('crm_sidebar_collapsed', collapsed ? 'true' : 'false');
    
    const toggleBtn = document.getElementById('sidebarCollapseBtn');
    if (toggleBtn) {
      toggleBtn.textContent = collapsed ? '›' : '‹';
    }
  },

  /**
   * Focus keyboard shortcut shortcuts
   */
  initKeyboardShortcuts: () => {
    document.addEventListener('keydown', (e) => {
      // Focus search input on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Close drawer modal on Escape
      if (e.key === 'Escape') {
        if (typeof messages !== 'undefined' && typeof messages.closeDrawer === 'function') {
          messages.closeDrawer();
        }
      }
    });
  },

  /**
   * Navigation links setup
   */
  initNavigation: () => {
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', () => {
        dashboard.navigateTo(link.dataset.page);
        dashboard.closeMobileSidebar();
      });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await api.fetch('/logout', { method: 'POST' });
        api.clearAuth();
        window.location.href = './index.html';
      });
    }

    // Mobile Sidebar Toggles
    const toggleBtn = document.getElementById('menuToggle');
    const overlay = document.getElementById('sidebarOverlay');
    if (toggleBtn) toggleBtn.addEventListener('click', dashboard.toggleMobileSidebar);
    if (overlay) overlay.addEventListener('click', dashboard.closeMobileSidebar);
  },

  /**
   * SPA Screen switching
   */
  navigateTo: (page) => {
    state.currentPage = page;

    // Toggle active link CSS
    document.querySelectorAll('[data-page]').forEach(l => l.classList.remove('active'));
    const active = document.querySelector(`[data-page="${page}"]`);
    if (active) active.classList.add('active');

    // Toggle sections visibility
    document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`page-${page}`);
    if (target) target.style.display = 'block';

    // Update Topbar Title text
    const titles = {
      dashboard: { title: 'CRM Overview', sub: 'Audits, timeline log updates, and statistics' },
      messages: { title: 'Contact Inbox', sub: 'Search, filter, status tags, and workflow updates' },
      kanban: { title: 'Kanban Lead Board', sub: 'Drag and drop cards to update client lead categories' },
      calendar: { title: 'CRM Schedule Calendar', sub: 'Interactive grid of follow-up dates and task deadlines' },
      analytics: { title: 'CRM Metrics', sub: 'Interactive budget distributions and visitor data charts' },
      settings: { title: 'System Settings', sub: 'Password updating, diagnostics, status logs' }
    };

    const header = titles[page] || { title: 'CRM Dashboard', sub: '' };
    const titleEl = document.getElementById('pageTitle');
    const subEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = header.title;
    if (subEl) subEl.textContent = header.sub;

    // Load data specific to tab page
    if (page === 'dashboard') {
      // Deduplicate: analytics already loaded within the last 30s — skip re-fetch
      const now = Date.now();
      if (now - dashboard._analyticsLoadedAt > dashboard._ANALYTICS_DEBOUNCE_MS) {
        analytics.load().then(() => { dashboard._analyticsLoadedAt = Date.now(); });
      }
    } else if (page === 'messages') {
      messages.load();
    } else if (page === 'kanban') {
      kanban.load();
    } else if (page === 'calendar') {
      calendar.load();
    } else if (page === 'analytics') {
      // Deduplicate: reuse cached render if loaded recently
      const now = Date.now();
      if (now - dashboard._analyticsLoadedAt > dashboard._ANALYTICS_DEBOUNCE_MS) {
        analytics.load().then(() => { dashboard._analyticsLoadedAt = Date.now(); });
      }
    } else if (page === 'settings') {
      settings.load();
    }

    // Always close drawer on tab navigate
    if (typeof messages !== 'undefined' && typeof messages.closeDrawer === 'function') {
      messages.closeDrawer();
    }
  },

  toggleMobileSidebar: () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
  },

  closeMobileSidebar: () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  },

  // ── SOUND & BROWSER ALERTS ──────────────────────────────────────────────────
  startLiveUpdates: () => {
    // Poll every 30 seconds to detect new unread messages
    setInterval(async () => {
      try {
        const res = await api.fetch('/analytics');
        if (!res) return;
        const json = await res.json();
        if (json.success) {
          const newUnread = json.data.stats.unread;
          
          if (newUnread > dashboard.lastUnreadCount) {
            dashboard.playNotificationSound();
            dashboard.triggerBrowserNotification();
            // Update the unread badge without triggering a full page re-render
            analytics.updateDashboardStats(json.data.stats);
            // Invalidate analytics cache so next manual tab switch re-loads fresh data
            dashboard._analyticsLoadedAt = 0;
          }
          dashboard.lastUnreadCount = newUnread;
        }
      } catch (_) {}
    }, 30000);
  },

  playNotificationSound: () => {
    if (dashboard.notificationAudio) {
      dashboard.notificationAudio.play().catch(() => {});
    }
  },

  triggerBrowserNotification: () => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification('CRM Update', {
        body: 'New client enquiry received!',
        icon: '../favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('CRM Update', {
            body: 'New client enquiry received!',
            icon: '../favicon.ico'
          });
        }
      });
    }
  },

  // ── TOAST MESSAGES ──────────────────────────────────────────────────────────
  showToast: (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    toast.innerHTML = `<span>${icon}</span> ${utils.escHtml(message)}<div class="toast-progress"></div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Start Dashboard
document.addEventListener('DOMContentLoaded', () => {
  dashboard.init();
});
