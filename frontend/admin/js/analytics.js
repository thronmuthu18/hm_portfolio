/**
 * Chart.js Analytics Visualization Module
 */

'use strict';

const analytics = {
  chartInstances: {},

  /**
   * Fetch analytics data and initialize all chart graphs
   */
  load: async () => {
    try {
      const res = await api.fetch('/analytics');
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      const data = json.data;

      // Update Dashboard Header Cards (Total, Starred, Read, Weekly counts, etc.)
      analytics.updateDashboardStats(data.stats);

      // Render Charts
      analytics.renderDailyTrend(data.dailyTrend);
      analytics.renderBudgetDist(data.budgetDist);
      analytics.renderProjectTypeDist(data.projectTypeDist);
      analytics.renderVisitorAnalytics(data.visitorStats);
      
      // Load activity logs list
      analytics.renderActivityTimeline(data.recentActivity);

    } catch (err) {
      // Use console.warn so the browser devtools don't show a noisy red error
      // but we still get visibility during debugging
      if (typeof console !== 'undefined' && window.location.hostname === 'localhost') {
        console.warn('[Analytics] Failed to load analytics data:', err.message);
      }
    }
  },

  updateDashboardStats: (stats) => {
    const totalEl = document.getElementById('statTotal');
    const unreadEl = document.getElementById('statUnread');
    const starredEl = document.getElementById('statStarred');
    const archivedEl = document.getElementById('statArchived');
    const avgDailyEl = document.getElementById('statAvgDaily');

    if (totalEl) totalEl.textContent = stats.total;
    if (unreadEl) unreadEl.textContent = stats.unread;
    if (starredEl) starredEl.textContent = stats.starred;
    if (archivedEl) archivedEl.textContent = stats.archived;
    if (avgDailyEl) avgDailyEl.textContent = stats.avgDaily;

    // Sync notification badge count
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      if (stats.unread > 0) {
        badge.textContent = stats.unread;
        badge.style.display = 'inline-flex';
        // Trigger bounce animation on badge change
        badge.classList.add('badge-bounce');
        setTimeout(() => badge.classList.remove('badge-bounce'), 1000);
      } else {
        badge.style.display = 'none';
      }
    }
  },

  destroyChart: (id) => {
    if (analytics.chartInstances[id]) {
      analytics.chartInstances[id].destroy();
      delete analytics.chartInstances[id];
    }
  },

  renderDailyTrend: (data) => {
    analytics.destroyChart('dailyTrend');
    const ctx = document.getElementById('chartDaily');
    if (!ctx) return;

    analytics.chartInstances.dailyTrend = new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: data.map(d => d._id),
        datasets: [{
          label: 'Daily Enquiries',
          data: data.map(d => d.count),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  },

  renderBudgetDist: (data) => {
    analytics.destroyChart('budget');
    const ctx = document.getElementById('chartBudget');
    if (!ctx || !data || data.length === 0) return;

    analytics.chartInstances.budget = new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: data.map(d => d._id || 'Unspecified'),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
          borderColor: '#0b0f19',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
          }
        }
      }
    });
  },

  renderProjectTypeDist: (data) => {
    analytics.destroyChart('projectType');
    const ctx = document.getElementById('chartProjectType');
    if (!ctx || !data || data.length === 0) return;

    analytics.chartInstances.projectType = new Chart(ctx.getContext('2d'), {
      type: 'bar',
      data: {
        labels: data.map(d => d._id || 'Unknown'),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  },

  renderVisitorAnalytics: (visitorStats) => {
    analytics.destroyChart('visitors');
    const ctx = document.getElementById('chartVisitors');
    if (!ctx) return;

    // Show devices breakdown as primary chart
    const devices = visitorStats.devices;
    analytics.chartInstances.visitors = new Chart(ctx.getContext('2d'), {
      type: 'pie',
      data: {
        labels: devices.map(d => d._id || 'Unknown'),
        datasets: [{
          data: devices.map(d => d.count),
          backgroundColor: ['#06b6d4', '#6366f1', '#a855f7'],
          borderColor: '#0b0f19',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
          }
        }
      }
    });

    // Populate country lists
    const countryContainer = document.getElementById('visitorCountryList');
    if (countryContainer) {
      if (!visitorStats.countries || visitorStats.countries.length === 0) {
        countryContainer.innerHTML = '<p class="text-muted">No data available</p>';
      } else {
        countryContainer.innerHTML = visitorStats.countries.map(c => `
          <div style="display:flex;justify-content:between;margin-bottom:8px;font-size:13px">
            <span>📍 ${utils.escHtml(c._id || 'Unknown')}</span>
            <span style="font-weight:600">${c.count} visitors</span>
          </div>
        `).join('');
      }
    }
  },

  renderActivityTimeline: (logs) => {
    const timeline = document.getElementById('recentActivityTimeline');
    if (!timeline) return;

    if (!logs || logs.length === 0) {
      timeline.innerHTML = '<p class="text-muted text-center" style="padding:20px 0">No recent admin activity</p>';
      return;
    }

    timeline.innerHTML = logs.map(log => `
      <div style="display:flex;gap:12px;margin-bottom:16px;position:relative">
        <div style="font-size:11px;color:var(--text-muted);width:64px;flex-shrink:0;text-align:right;padding-top:2px">
          ${utils.formatTimeOnly(log.createdAt)}
        </div>
        <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:6px;position:relative;z-index:2"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${utils.escHtml(log.action.replace('_', ' ').toUpperCase())}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${utils.escHtml(log.details || '')}</div>
        </div>
      </div>
    `).join('');
  }
};
