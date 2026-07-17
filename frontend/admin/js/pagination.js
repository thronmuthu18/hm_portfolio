/**
 * Server-side Pagination Manager
 */

'use strict';

const pagination = {
  /**
   * Render pagination button HTML based on current metadata
   */
  render: (metadata) => {
    const { total, page, limit, totalPages } = metadata;
    const infoText = document.getElementById('paginationInfo');
    const btnContainer = document.getElementById('paginationBtns');
    
    if (!infoText || !btnContainer) return;

    if (total === 0) {
      infoText.textContent = 'No messages to display';
      btnContainer.innerHTML = '';
      return;
    }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    infoText.textContent = `Displaying ${start}–${end} of ${total} Messages`;

    // Generate page buttons list
    let html = `
      <button class="btn-page" onclick="pagination.changePage(1)" ${page <= 1 ? 'disabled' : ''} title="First Page">«</button>
      <button class="btn-page" onclick="pagination.changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} title="Previous">‹</button>
    `;

    const range = pagination.getRange(page, totalPages);
    range.forEach(p => {
      if (p === '…') {
        html += `<span class="btn-page ellipsis">…</span>`;
      } else {
        html += `
          <button class="btn-page ${p === page ? 'active' : ''}" onclick="pagination.changePage(${p})">
            ${p}
          </button>
        `;
      }
    });

    html += `
      <button class="btn-page" onclick="pagination.changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''} title="Next">›</button>
      <button class="btn-page" onclick="pagination.changePage(${totalPages})" ${page >= totalPages ? 'disabled' : ''} title="Last Page">»</button>
    `;

    btnContainer.innerHTML = html;
  },

  /**
   * Generate pagination range numbers with ellipses for long lists
   */
  getRange: (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '…', current - 1, current, current + 1, '…', total];
  },

  /**
   * Action trigger to switch active page
   */
  changePage: (p) => {
    if (p < 1 || p > state.totalPages) return;
    state.page = p;
    
    if (typeof messages !== 'undefined' && typeof messages.load === 'function') {
      messages.load();
    }
  },

  /**
   * Action trigger to change page limit size
   */
  initLimitSelector: () => {
    const limitSelect = document.getElementById('limitSelect');
    if (!limitSelect) return;

    limitSelect.addEventListener('change', (e) => {
      state.limit = parseInt(e.target.value);
      state.page = 1; // Reset to page 1

      if (typeof messages !== 'undefined' && typeof messages.load === 'function') {
        messages.load();
      }
    });
  }
};
