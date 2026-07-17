/**
 * Advanced CRM Filter Controls
 */

'use strict';

const filters = {
  /**
   * Bind event listeners for select filters and date pickers
   */
  init: () => {
    const filterSelect = document.getElementById('filterSelect');
    const sortSelect = document.getElementById('sortSelect');
    const budgetSelect = document.getElementById('budgetSelect');
    const typeSelect = document.getElementById('typeSelect');
    
    // Status/Date presets filter
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        state.filter = e.target.value;
        state.page = 1;
        filters.triggerReload();
      });
    }

    // Sort order selection
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.page = 1;
        filters.triggerReload();
      });
    }

    // Budget range selection
    if (budgetSelect) {
      budgetSelect.addEventListener('change', (e) => {
        state.budgetRange = e.target.value;
        state.page = 1;
        filters.triggerReload();
      });
    }

    // Project Type selection
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        state.projectTypeFilter = e.target.value;
        state.page = 1;
        filters.triggerReload();
      });
    }
  },

  /**
   * Refresh message list
   */
  triggerReload: () => {
    if (typeof messages !== 'undefined' && typeof messages.load === 'function') {
      messages.load();
    }
  }
};
