/**
 * Admin Panel Settings & Health Monitor
 */

'use strict';

const settings = {
  /**
   * Bind change password form listener and fetch server health
   */
  init: () => {
    const pwdForm = document.getElementById('passwordForm');
    if (pwdForm) {
      pwdForm.addEventListener('submit', settings.changePassword);
    }
  },

  /**
   * Load server details and connectivity diagnostics
   */
  load: async () => {
    try {
      const res = await api.fetch('/status');
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      const data = json.data;

      // Update diagnostic rows
      const srvEl = document.getElementById('statusServer');
      const dbEl = document.getElementById('statusDB');
      const smtpEl = document.getElementById('statusSMTP');
      const uptEl = document.getElementById('statusUptime');
      const memEl = document.getElementById('statusMemory');
      
      if (srvEl) {
        srvEl.textContent = data.server.toUpperCase();
        srvEl.className = 'status-val online';
      }
      if (dbEl) {
        dbEl.textContent = data.database.toUpperCase();
        dbEl.className = `status-val ${data.database === 'connected' ? 'online' : 'offline'}`;
      }
      if (smtpEl) {
        smtpEl.textContent = data.smtp.toUpperCase();
        smtpEl.className = `status-val ${data.smtp === 'configured' ? 'configured' : 'offline'}`;
      }
      if (uptEl) {
        uptEl.textContent = settings.formatUptime(data.uptime);
      }
      if (memEl && data.memoryUsage) {
        memEl.textContent = `${data.memoryUsage.heapUsed} (Heap)`;
      }

      // Sync Admin Info Block
      const nameEl = document.getElementById('adminNameSettings');
      if (nameEl && state.admin) {
        nameEl.textContent = state.admin.username;
      }

      // Load database files list
      await settings.loadBackups();
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    }
  },

  /**
   * Handle admin password change requests
   */
  changePassword: async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      if (typeof dashboard !== 'undefined' && dashboard.showToast) {
        dashboard.showToast('Passwords do not match.', 'error');
      }
      return;
    }

    if (newPassword.length < 8) {
      if (typeof dashboard !== 'undefined' && dashboard.showToast) {
        dashboard.showToast('Password must be at least 8 characters.', 'error');
      }
      return;
    }

    try {
      const res = await api.fetch('/settings/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!res) return;
      const json = await res.json();

      if (json.success) {
        if (typeof dashboard !== 'undefined' && dashboard.showToast) {
          dashboard.showToast('Password changed successfully.', 'success');
        }
        document.getElementById('passwordForm').reset();
      } else {
        if (typeof dashboard !== 'undefined' && dashboard.showToast) {
          dashboard.showToast(json.message || 'Failed to change password.', 'error');
        }
      }
    } catch (_) {
      if (typeof dashboard !== 'undefined' && dashboard.showToast) {
        dashboard.showToast('Network error updating password.', 'error');
      }
    }
  },

  /**
   * Convert seconds to readable format
   */
  formatUptime: (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  },

  // ── PASSWORD STRENGTH VALIDATOR ─────────────────────────────────────────────
  validatePasswordStrength: (pwd) => {
    const fill = document.getElementById('pwdStrengthFill');
    const text = document.getElementById('pwdStrengthText');
    const count = document.getElementById('newPwdCharCount');
    
    if (count) count.textContent = `${pwd.length} chars`;
    if (!fill || !text) return;

    fill.className = 'pwd-strength-fill';
    
    if (pwd.length === 0) {
      fill.style.width = '0%';
      text.textContent = 'Password Strength';
      return;
    }

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (pwd.length < 8) {
      fill.classList.add('weak');
      text.textContent = 'Weak (Too short)';
    } else if (score <= 3) {
      fill.classList.add('weak');
      text.textContent = 'Weak';
    } else if (score <= 5) {
      fill.classList.add('medium');
      text.textContent = 'Medium';
    } else {
      fill.classList.add('strong');
      text.textContent = 'Strong';
    }
  },

  // ── DATABASE BACKUPS ────────────────────────────────────────────────────────
  loadBackups: async () => {
    try {
      const res = await api.fetch('/database/backups');
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      const container = document.getElementById('backupFilesList');
      if (!container) return;

      if (!json.data || json.data.length === 0) {
        container.innerHTML = '<p class="text-muted">No backups found.</p>';
        return;
      }

      container.innerHTML = json.data.map(b => `
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);padding:6px 10px;border:1px solid var(--glass-border);border-radius:4px">
          <div>
            <div style="font-weight:600;font-size:11px">${b.filename}</div>
            <div style="font-size:10px;color:var(--text-muted)">${b.size} | ${new Date(b.createdAt).toLocaleString()}</div>
          </div>
          <button class="btn-primary-sm" style="padding:4px 8px;font-size:10px" onclick="settings.triggerRestore('${b.filename}')">Restore</button>
        </div>
      `).join('');
    } catch (_) {}
  },

  triggerBackup: async () => {
    try {
      const res = await api.fetch('/database/backup', { method: 'POST' });
      if (!res) return;
      const json = await res.json();

      if (json.success) {
        dashboard.showToast('Database backup created successfully!', 'success');
        settings.loadBackups();
      } else {
        dashboard.showToast(json.message || 'Failed to create backup.', 'error');
      }
    } catch (_) {
      dashboard.showToast('Network error creating database backup.', 'error');
    }
  },

  triggerRestore: async (filename) => {
    const confirmBox = confirm(`Restore database state from file "${filename}"?\n\nWARNING: This will replace the current Contacts and CRM metadata records with this backup.`);
    if (!confirmBox) return;

    try {
      const res = await api.fetch('/database/restore', {
        method: 'POST',
        body: JSON.stringify({ filename })
      });
      if (!res) return;
      const json = await res.json();

      if (json.success) {
        dashboard.showToast('Database state restored successfully.', 'success');
      } else {
        dashboard.showToast(json.message || 'Restore failed.', 'error');
      }
    } catch (_) {
      dashboard.showToast('Network error restoring database.', 'error');
    }
  }
};
