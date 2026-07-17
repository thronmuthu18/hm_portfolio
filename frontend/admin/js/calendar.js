/**
 * CRM Calendar Event Grid Manager
 * Visualizes follow-up reminders and task deadlines
 */

'use strict';

const calendar = {
  currentDate: new Date(),

  load: async () => {
    const container = document.getElementById('calendarCells');
    if (!container) return;

    container.innerHTML = '<div class="skeleton" style="height:350px;width:100%"></div>';

    try {
      // Fetch CRM items containing tasks and follow-up dates
      const res = await api.fetch('/messages?limit=100');
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      calendar.renderCalendar(json.data);
    } catch (_) {
      container.innerHTML = '<div class="error-state"><p>Failed to load calendar events.</p></div>';
    }
  },

  renderCalendar: (items) => {
    const cellsContainer = document.getElementById('calendarCells');
    const monthYearLabel = document.getElementById('calendarMonthYear');
    if (!cellsContainer) return;

    const year = calendar.currentDate.getFullYear();
    const month = calendar.currentDate.getMonth();

    // Set header month year label
    if (monthYearLabel) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      monthYearLabel.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Empty cells for preceding month overlap
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day-cell empty"></div>';
    }

    // Days cell items builder
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toDateString();
      const isToday = new Date().toDateString() === dateStr;

      // Extract follow-ups matching this date
      const dayEvents = [];
      items.forEach(item => {
        const crm = item.crm || {};
        if (crm.followUpDate) {
          const followUpDay = new Date(crm.followUpDate).toDateString();
          if (followUpDay === dateStr) {
            dayEvents.push({
              type: 'followup',
              title: `📞 Follow-up: ${item.fullName}`,
              contactId: item.contactId || item._id
            });
          }
        }

        // Extract tasks deadlines matching this date
        const tasksList = crm.tasks || [];
        tasksList.forEach(t => {
          if (t.deadline) {
            const taskDay = new Date(t.deadline).toDateString();
            if (taskDay === dateStr) {
              dayEvents.push({
                type: 'task',
                title: `✔️ Task: ${t.title}`,
                contactId: item.contactId || item._id
              });
            }
          }
        });
      });

      const eventsHtml = dayEvents.map(e => `
        <div class="calendar-event-item ${e.type}" onclick="event.stopPropagation(); messages.openDrawer('${e.contactId}')" title="${utils.escHtml(e.title)}">
          ${utils.escHtml(e.title)}
        </div>
      `).join('');

      html += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}">
          <div class="calendar-day-number">${day}</div>
          <div class="calendar-events-container">
            ${eventsHtml}
          </div>
        </div>
      `;
    }

    cellsContainer.innerHTML = html;
  },

  prevMonth: () => {
    calendar.currentDate.setMonth(calendar.currentDate.getMonth() - 1);
    calendar.load();
  },

  nextMonth: () => {
    calendar.currentDate.setMonth(calendar.currentDate.getMonth() + 1);
    calendar.load();
  }
};
