/**
 * CRM Instant Search Handler
 */

'use strict';

const search = {
  debounceTimer: null,

  /**
   * Bind event listener for search queries
   */
  init: () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) {
        clearBtn.style.display = e.target.value ? 'block' : 'none';
      }

      clearTimeout(search.debounceTimer);
      search.debounceTimer = setTimeout(() => {
        state.search = e.target.value.trim();
        state.page = 1; // Reset to page 1 on new searches
        
        // Trigger messages reload
        if (typeof messages !== 'undefined' && typeof messages.load === 'function') {
          messages.load();
        }
      }, 350); // 350ms debounce time
    });
  }
};
