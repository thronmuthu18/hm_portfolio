/**
 * CRM Kanban Lead Board Manager
 * Enables drag-and-drop workflow tracking matching client statuses
 */

'use strict';

const kanban = {
  columns: [
    { id: 'new-lead', name: 'New Lead' },
    { id: 'contacted', name: 'Contacted' },
    { id: 'discussion', name: 'Discussion' },
    { id: 'quotation-sent', name: 'Quotation' },
    { id: 'in-progress', name: 'Development' },
    { id: 'completed', name: 'Completed' }
  ],

  load: async () => {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    board.innerHTML = '<div class="skeleton" style="height:400px;width:100%"></div>';

    try {
      // Fetch all messages (Kanban displays all active records)
      const res = await api.fetch('/messages?limit=100');
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      const items = json.data;
      kanban.renderBoard(items);
    } catch (err) {
      console.error('Failed to load Kanban board:', err);
      board.innerHTML = '<div class="error-state"><p>Failed to load Kanban board.</p></div>';
    }
  },

  renderBoard: (items) => {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    // Group items by status
    const groups = {};
    kanban.columns.forEach(col => {
      groups[col.id] = [];
    });

    items.forEach(item => {
      const status = item.crm?.status || 'new-lead';
      // Map legacy status tags to kanban columns
      let mapped = status;
      if (status === 'unread' || status === 'read') mapped = 'new-lead';
      
      if (groups[mapped]) {
        groups[mapped].push(item);
      }
    });

    board.innerHTML = kanban.columns.map(col => {
      const cards = groups[col.id];
      const cardsHtml = cards.map(c => `
        <div class="kanban-card" draggable="true" data-id="${c._id}" ondragstart="kanban.handleDragStart(event)">
          <div class="kanban-card-title">${utils.escHtml(c.fullName)}</div>
          <div class="kanban-card-desc">${utils.escHtml(c.projectDescription)}</div>
          <div class="kanban-card-footer">
            <span class="kanban-card-budget">${utils.escHtml(c.budget)}</span>
            <span>${utils.formatDateRelative(c.createdAt)}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="kanban-column" data-status="${col.id}" ondragover="kanban.handleDragOver(event)" ondragleave="kanban.handleDragLeave(event)" ondrop="kanban.handleDrop(event)">
          <div class="kanban-column-header">
            <span>${col.name}</span>
            <span class="kanban-column-count">${cards.length}</span>
          </div>
          <div class="kanban-cards-list">
            ${cardsHtml || '<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:20px;border:1px dashed var(--glass-border);border-radius:8px">No leads</div>'}
          </div>
        </div>
      `;
    }).join('');
  },

  // ── DRAG AND DROP HANDLERS ────────────────────────────────────────────────
  handleDragStart: (e) => {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.style.opacity = '0.5';
  },

  handleDragOver: (e) => {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.add('drag-over');
  },

  handleDragLeave: (e) => {
    const col = e.currentTarget;
    col.classList.remove('drag-over');
  },

  handleDrop: async (e) => {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.remove('drag-over');

    const id = e.dataTransfer.getData('text/plain');
    const newStatus = col.dataset.status;

    // Reset dragged target opacity
    const card = document.querySelector(`.kanban-card[data-id="${id}"]`);
    if (card) card.style.opacity = '1';

    try {
      const res = await api.fetch(`/messages/${id}/crm`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.ok) {
        dashboard.showToast('Lead status updated successfully.', 'success');
        kanban.load(); // Refresh board
      } else {
        dashboard.showToast('Failed to update lead status.', 'error');
      }
    } catch (_) {
      dashboard.showToast('Network error updating status.', 'error');
    }
  }
};
