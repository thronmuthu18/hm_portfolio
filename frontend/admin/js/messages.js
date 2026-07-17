/**
 * Messages & CRM Operations Manager
 * Handles: Server-side pagination loading, side drawer rendering,
 *          notes updates, tags, follow-ups, bulk actions, and exports
 */

'use strict';

const messages = {
  selectedIds: new Set(),
  activeDrawerId: null,

  /**
   * Fetch paginated list of messages matching search and filters
   */
  load: async () => {
    messages.showTableSkeleton();

    const queryParams = new URLSearchParams({
      search: state.search,
      filter: state.filter,
      sort: state.sort,
      page: state.page,
      limit: state.limit
    });

    try {
      const res = await api.fetch(`/messages?${queryParams}`);
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      state.messages = json.data;
      state.totalPages = json.pagination.totalPages;
      state.total = json.pagination.total;

      messages.renderTable(json.data);
      pagination.render(json.pagination);
      messages.updateBulkActionBar();
      
      // Auto-restore column selection hidden settings
      messages.applyColumnsState();
    } catch (err) {
      console.error('Failed to load CRM messages:', err);
      document.getElementById('tableBody').innerHTML = `
        <tr><td colspan="9">
          <div class="error-state">
            <p>Failed to connect to the CRM database.</p>
            <button class="btn-retry" onclick="messages.load()">Retry Connection</button>
          </div>
        </td></tr>`;
    }
  },

  showTableSkeleton: () => {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = Array(state.limit || 10).fill(0).map(() => `
      <tr>
        <td><div class="skeleton" style="height:16px;width:16px;border-radius:4px"></div></td>
        <td class="col-name"><div class="skeleton" style="height:18px;width:80px"></div></td>
        <td class="col-email"><div class="skeleton" style="height:18px;width:140px"></div></td>
        <td class="col-phone"><div class="skeleton" style="height:18px;width:100px"></div></td>
        <td class="col-type"><div class="skeleton" style="height:18px;width:90px"></div></td>
        <td class="col-budget"><div class="skeleton" style="height:18px;width:60px"></div></td>
        <td class="col-desc"><div class="skeleton" style="height:18px;width:180px"></div></td>
        <td class="col-date"><div class="skeleton" style="height:18px;width:70px"></div></td>
        <td class="col-status"><div class="skeleton" style="height:28px;width:120px"></div></td>
      </tr>`).join('');
  },

  renderTable: (msgs) => {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    if (!msgs || msgs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <h3>No messages found</h3>
          <p>Try modifying your search or choosing another filter preset</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = msgs.map(m => {
      const meta = m.crm || {};
      const isUnread = meta.status === 'unread';
      const isStarred = meta.starred === true;
      const isChecked = messages.selectedIds.has(m._id) ? 'checked' : '';

      let statusClass = 'badge-read';
      if (meta.status === 'unread') statusClass = 'badge-unread';
      else if (meta.status === 'in-progress') statusClass = 'badge-progress';
      else if (meta.status === 'completed') statusClass = 'badge-completed';
      else if (meta.status === 'cancelled') statusClass = 'badge-cancelled';

      return `
        <tr class="${isUnread ? 'unread-row' : ''} ${isStarred ? 'starred-row' : ''}" id="row-${m._id}">
          <td onclick="event.stopPropagation()">
            <input type="checkbox" class="row-checkbox" data-id="${m._id}" ${isChecked} onchange="messages.toggleSelect('${m._id}')" />
          </td>
          <td class="col-name" onclick="messages.openDrawer('${m._id}')">${utils.escHtml(m.fullName)}</td>
          <td class="col-email" onclick="messages.openDrawer('${m._id}')" title="${utils.escHtml(m.email)}">${utils.escHtml(m.email)}</td>
          <td class="col-phone" onclick="messages.openDrawer('${m._id}')">${utils.escHtml(m.phone || '—')}</td>
          <td class="col-type" onclick="messages.openDrawer('${m._id}')">${utils.escHtml(m.projectType)}</td>
          <td class="col-budget" onclick="messages.openDrawer('${m._id}')"><span class="badge badge-budget">${utils.escHtml(m.budget)}</span></td>
          <td class="col-desc" onclick="messages.openDrawer('${m._id}')" title="${utils.escHtml(m.projectDescription)}">
            ${utils.escHtml(m.projectDescription)}
          </td>
          <td class="col-date" onclick="messages.openDrawer('${m._id}')" class="cell-date">${utils.formatDateRelative(m.createdAt)}</td>
          <td class="col-status" onclick="messages.openDrawer('${m._id}')">
            <span class="badge ${statusClass}">${meta.status ? meta.status.toUpperCase() : 'UNREAD'}</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ── SELECT & CHECKBOXES ─────────────────────────────────────────────────────
  toggleSelect: (id) => {
    if (messages.selectedIds.has(id)) {
      messages.selectedIds.delete(id);
    } else {
      messages.selectedIds.add(id);
    }
    messages.updateBulkActionBar();
  },

  toggleSelectAll: (checked) => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
      const id = cb.dataset.id;
      if (checked) messages.selectedIds.add(id);
      else messages.selectedIds.delete(id);
    });
    messages.updateBulkActionBar();
  },

  updateBulkActionBar: () => {
    const bar = document.getElementById('bulkActionBar');
    const selectAllCb = document.getElementById('selectAllCheckbox');
    if (!bar) return;

    const count = messages.selectedIds.size;
    if (count > 0) {
      bar.classList.add('show');
      document.getElementById('bulkCount').textContent = `${count} selected`;
      if (selectAllCb) selectAllCb.checked = (count === state.messages.length);
    } else {
      bar.classList.remove('show');
      if (selectAllCb) selectAllCb.checked = false;
    }
  },

  // ── SIDE DRAWER RENDER ──────────────────────────────────────────────────────
  activeClient: null,
  activeTab: 'overview',

  openDrawer: async (id) => {
    messages.activeDrawerId = id;
    messages.activeTab = 'overview';
    const drawer = document.getElementById('drawer');
    const content = document.getElementById('drawerContent');
    if (!drawer || !content) return;

    drawer.classList.add('open');
    content.innerHTML = '<div class="skeleton" style="height:350px;margin:20px"></div>';

    // Highlight active header tab
    document.querySelectorAll('.drawer-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === 'overview');
    });

    try {
      const res = await api.fetch(`/messages/${id}`);
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      messages.activeClient = json.data;
      messages.renderActiveTab();
      
      // Mark message as read implicitly when drawer opens
      const m = json.data;
      const crm = m.crm || {};
      if (crm.status === 'unread') {
        await api.fetch(`/messages/${m._id}/crm`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'read' })
        });
        messages.load();
      }

    } catch (err) {
      console.error('Failed to load CRM details:', err);
      content.innerHTML = '<div style="padding:20px;color:var(--text-secondary)">Failed to load client profile.</div>';
    }
  },

  switchDrawerTab: (tabName) => {
    messages.activeTab = tabName;
    document.querySelectorAll('.drawer-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    messages.renderActiveTab();
  },

  renderActiveTab: () => {
    const content = document.getElementById('drawerContent');
    const m = messages.activeClient;
    if (!content || !m) return;

    const crm = m.crm || {};
    const isStarred = crm.starred === true;
    const tagsList = crm.tags || [];

    if (messages.activeTab === 'overview') {
      content.innerHTML = `
        <div class="drawer-header-actions" style="margin-bottom:16px">
          <button class="btn-action ${isStarred ? 'star-active' : ''}" onclick="messages.toggleStar('${m._id}', ${isStarred})" title="Star Client">
            ${utils.icons.star()} Star
          </button>
          <button class="btn-action" onclick="messages.toggleArchive('${m._id}', ${crm.isArchived})" title="Archive Enquiry">
            ${utils.icons.archive()} ${crm.isArchived ? 'Restore' : 'Archive'}
          </button>
          <button class="btn-action danger" onclick="messages.confirmDelete('${m._id}', '${utils.escHtml(m.fullName)}')" title="Delete Enquiry">
            ${utils.icons.trash()} Delete
          </button>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">Client Information</div>
          <div class="drawer-field"><span class="drawer-label">Full Name</span><span>${utils.escHtml(m.fullName)}</span></div>
          <div class="drawer-field"><span class="drawer-label">Email</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span>${utils.escHtml(m.email)}</span>
              <button class="btn-copy-sm" onclick="messages.copyText('${utils.escHtml(m.email)}', 'Email')">${utils.icons.copy()}</button>
            </div>
          </div>
          <div class="drawer-field"><span class="drawer-label">Phone</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span>${utils.escHtml(m.phone || 'Not provided')}</span>
              ${m.phone ? `<button class="btn-copy-sm" onclick="messages.copyText('${utils.escHtml(m.phone)}', 'Phone')">${utils.icons.copy()}</button>` : ''}
            </div>
          </div>
          <div class="drawer-field"><span class="drawer-label">Project Type</span><span>${utils.escHtml(m.projectType)}</span></div>
          <div class="drawer-field"><span class="drawer-label">Budget</span><span class="badge badge-budget">${utils.escHtml(m.budget)}</span></div>
          <div class="drawer-field"><span class="drawer-label">Received</span><span>${utils.formatDateFull(m.createdAt)}</span></div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">Project Description</div>
          <div class="drawer-description-box">${utils.escHtml(m.projectDescription)}</div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">CRM Workflow & Status</div>
          <div class="form-group">
            <label class="form-label">Workflow Status</label>
            <select class="form-input" id="drawerStatusSelect" onchange="messages.updateStatus('${m._id}', this.value)">
              <option value="new-lead" ${crm.status === 'new-lead' ? 'selected' : ''}>New Lead</option>
              <option value="contacted" ${crm.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="discussion" ${crm.status === 'discussion' ? 'selected' : ''}>Discussion</option>
              <option value="quotation-sent" ${crm.status === 'quotation-sent' ? 'selected' : ''}>Quotation Sent</option>
              <option value="in-progress" ${crm.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${crm.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${crm.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              <option value="lost" ${crm.status === 'lost' ? 'selected' : ''}>Lost</option>
              <option value="won" ${crm.status === 'won' ? 'selected' : ''}>Won</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tags (Comma-separated)</label>
            <input type="text" class="form-input" id="drawerTagsInput" value="${tagsList.join(', ')}" placeholder="e.g. Website, Ecommerce, Startup" />
            <button class="btn-primary-sm" style="margin-top:6px;width:100%;justify-content:center" onclick="messages.saveTags('${m._id}')">Save Tags</button>
          </div>

          <div class="form-group">
            <label class="form-label">Follow-up Reminder</label>
            <div style="display:flex;gap:6px;margin-bottom:6px">
              <input type="date" class="form-input" id="drawerFollowUpDate" value="${crm.followUpDate ? crm.followUpDate.split('T')[0] : ''}" />
              <select class="form-input" id="drawerFollowUpPriority" style="width:110px">
                <option value="low" ${crm.followUpPriority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${crm.followUpPriority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${crm.followUpPriority === 'high' ? 'selected' : ''}>High</option>
              </select>
            </div>
            <button class="btn-primary-sm" style="width:100%;justify-content:center" onclick="messages.saveFollowUp('${m._id}')">Update Follow-up</button>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-title">Visitor Analytics</div>
          <div class="drawer-field"><span class="drawer-label">Country</span><span>📍 ${utils.escHtml(crm.visitor?.country || 'Unknown')}</span></div>
          <div class="drawer-field"><span class="drawer-label">Browser</span><span>🌐 ${utils.escHtml(crm.visitor?.browser || 'Unknown')}</span></div>
          <div class="drawer-field"><span class="drawer-label">OS</span><span>💻 ${utils.escHtml(crm.visitor?.os || 'Unknown')}</span></div>
          <div class="drawer-field"><span class="drawer-label">Referrer</span><span>🔗 ${utils.escHtml(crm.visitor?.referrer || 'Direct')}</span></div>
        </div>
      `;
    } else if (messages.activeTab === 'notes') {
      const notesList = crm.internalNotes || [];
      const notesHtml = notesList.map(n => `
        <div class="note-item">
          <div class="note-header">
            <span class="note-author">${utils.escHtml(n.author)}</span>
            <span>${new Date(n.createdAt).toLocaleString()}</span>
          </div>
          <div class="note-content">${utils.escHtml(n.content)}</div>
        </div>
      `).join('');

      content.innerHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Internal Notes (Admin Only)</div>
          <div style="margin-bottom:16px">
            <textarea id="newNoteInput" class="form-input" rows="3" placeholder="Type an internal note..."></textarea>
            <button class="btn-primary-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="messages.addNote()">Post Note</button>
          </div>
          <div id="notesContainer">
            ${notesHtml || '<p style="font-size:12px;color:var(--text-muted);text-align:center">No internal notes posted.</p>'}
          </div>
        </div>
      `;
    } else if (messages.activeTab === 'tasks') {
      const tasksList = crm.tasks || [];
      const tasksHtml = tasksList.map(t => `
        <div class="task-item">
          <div class="task-left">
            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="messages.toggleTask('${t._id}')" />
            <div>
              <div class="task-title ${t.completed ? 'completed' : ''}">${utils.escHtml(t.title)}</div>
              ${t.deadline ? `<div class="task-meta">📅 Deadline: ${new Date(t.deadline).toLocaleDateString()} | Priority: ${t.priority.toUpperCase()}</div>` : ''}
            </div>
          </div>
        </div>
      `).join('');

      content.innerHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Project Tasks Checklist</div>
          <div style="margin-bottom:16px;background:rgba(255,255,255,0.01);padding:12px;border:1px solid var(--glass-border);border-radius:8px">
            <div class="form-group" style="margin-bottom:8px">
              <input type="text" id="newTaskTitle" class="form-input" placeholder="Task name/description..." />
            </div>
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <input type="date" id="newTaskDeadline" class="form-input" />
              <select id="newTaskPriority" class="form-input" style="width:100px">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button class="btn-primary-sm" style="width:100%;justify-content:center" onclick="messages.addTask()">Add Task</button>
          </div>
          <div id="tasksContainer">
            ${tasksHtml || '<p style="font-size:12px;color:var(--text-muted);text-align:center">No tasks assigned yet.</p>'}
          </div>
        </div>
      `;
    } else if (messages.activeTab === 'attachments') {
      const filesList = crm.attachments || [];
      const filesHtml = filesList.map(f => `
        <div class="attachment-item">
          <div class="attachment-info">
            <span>📎</span>
            <div>
              <div class="attachment-name">${utils.escHtml(f.name)}</div>
              <div class="attachment-size">${(f.size / 1024).toFixed(1)} KB | Uploaded: ${new Date(f.uploadedAt).toLocaleDateString()}</div>
            </div>
          </div>
          <button class="btn-primary-sm" style="padding:4px 8px;font-size:10px" onclick="messages.downloadAttachment('${f._id}')">Download</button>
        </div>
      `).join('');

      content.innerHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Attachments & ZIP files</div>
          <div style="margin-bottom:16px;padding:12px;border:1px dashed var(--glass-border);border-radius:8px;text-align:center">
            <input type="file" id="fileUploadInput" style="display:none" onchange="messages.handleFileUpload(this.files)" />
            <button class="btn-primary-sm" style="margin:0 auto" onclick="document.getElementById('fileUploadInput').click()">Select Document</button>
            <div style="font-size:10px;color:var(--text-muted);margin-top:6px">Supports PDF, DOCX, ZIP, Images (Max 2MB)</div>
          </div>
          <div id="attachmentsContainer">
            ${filesHtml || '<p style="font-size:12px;color:var(--text-muted);text-align:center">No documents uploaded.</p>'}
          </div>
        </div>
      `;
    } else if (messages.activeTab === 'emails') {
      const emailsList = crm.emailHistory || [];
      const emailsHtml = emailsList.map(e => `
        <div class="note-item">
          <div class="note-header">
            <span style="font-weight:600;color:var(--success)">Sent Reply</span>
            <span>${new Date(e.sentAt).toLocaleString()}</span>
          </div>
          <div style="font-weight:600;margin-bottom:4px;color:var(--text-primary)">Subject: ${utils.escHtml(e.subject)}</div>
          <div class="note-content" style="white-space:pre-wrap">${utils.escHtml(e.body)}</div>
        </div>
      `).join('');

      content.innerHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Quick Reply Templates</div>
          <div class="reply-templates-grid">
            <button class="btn-template" onclick="messages.applyEmailTemplate('thankyou')">Thank You</button>
            <button class="btn-template" onclick="messages.applyEmailTemplate('quotation')">Project Quotation</button>
            <button class="btn-template" onclick="messages.applyEmailTemplate('discussion')">Discussion Call</button>
            <button class="btn-template" onclick="messages.applyEmailTemplate('completed')">Project Completion</button>
          </div>
          
          <div style="margin-bottom:16px;background:rgba(255,255,255,0.01);padding:12px;border:1px solid var(--glass-border);border-radius:8px">
            <div class="form-group" style="margin-bottom:8px">
              <input type="text" id="emailSubject" class="form-input" placeholder="Subject..." />
            </div>
            <div class="form-group" style="margin-bottom:8px">
              <textarea id="emailBody" class="form-input" rows="5" placeholder="Compose email response..."></textarea>
            </div>
            <button class="btn-primary-sm" style="width:100%;justify-content:center" onclick="messages.sendClientEmail()">Send Email</button>
          </div>

          <div class="drawer-section-title">Outbound Email Logs</div>
          <div id="emailsContainer">
            ${emailsHtml || '<p style="font-size:12px;color:var(--text-muted);text-align:center">No emails dispatched.</p>'}
          </div>
        </div>
      `;
    } else if (messages.activeTab === 'timeline') {
      content.innerHTML = `
        <div class="drawer-section">
          <div class="drawer-section-title">Enquiry Audit Timeline</div>
          <div id="timelineContainer">
            <div class="skeleton" style="height:120px"></div>
          </div>
        </div>
      `;
      // Load timeline events asynchronously
      messages.loadClientTimeline(m._id);
    }
  },

  // ── CRM DRAWERS OPERATIONS HANDLERS ──────────────────────────────────────
  addNote: async () => {
    const input = document.getElementById('newNoteInput');
    if (!input || !input.value.trim()) return;

    try {
      const res = await api.fetch(`/messages/${messages.activeDrawerId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: input.value.trim() })
      });
      if (res && res.ok) {
        dashboard.showToast('Note added successfully.', 'success');
        // Refetch client profile to reload notes view
        const detailRes = await api.fetch(`/messages/${messages.activeDrawerId}`);
        const json = await detailRes.json();
        messages.activeClient = json.data;
        messages.renderActiveTab();
      }
    } catch (_) {
      dashboard.showToast('Failed to post internal note.', 'error');
    }
  },

  addTask: async () => {
    const title = document.getElementById('newTaskTitle').value.trim();
    const deadline = document.getElementById('newTaskDeadline').value;
    const priority = document.getElementById('newTaskPriority').value;
    if (!title) return;

    try {
      const res = await api.fetch(`/messages/${messages.activeDrawerId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title, deadline, priority })
      });
      if (res && res.ok) {
        dashboard.showToast('Task checklist item added.', 'success');
        const detailRes = await api.fetch(`/messages/${messages.activeDrawerId}`);
        const json = await detailRes.json();
        messages.activeClient = json.data;
        messages.renderActiveTab();
      }
    } catch (_) {
      dashboard.showToast('Failed to add task checklist item.', 'error');
    }
  },

  toggleTask: async (taskId) => {
    try {
      const res = await api.fetch(`/messages/${messages.activeDrawerId}/tasks/${taskId}`, {
        method: 'PATCH'
      });
      if (res && res.ok) {
        const detailRes = await api.fetch(`/messages/${messages.activeDrawerId}`);
        const json = await detailRes.json();
        messages.activeClient = json.data;
        messages.renderActiveTab();
      }
    } catch (_) {
      dashboard.showToast('Failed to toggle task checklist item.', 'error');
    }
  },

  handleFileUpload: (files) => {
    if (files.length === 0) return;
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      dashboard.showToast('File size exceeds the 2MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      // Extract Base64 string
      const base64Data = reader.result.split(',')[1];
      try {
        const res = await api.fetch(`/messages/${messages.activeDrawerId}/attachments`, {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64Data
          })
        });
        if (res && res.ok) {
          dashboard.showToast('File uploaded successfully.', 'success');
          const detailRes = await api.fetch(`/messages/${messages.activeDrawerId}`);
          const json = await detailRes.json();
          messages.activeClient = json.data;
          messages.renderActiveTab();
        }
      } catch (_) {
        dashboard.showToast('Failed to upload file attachment.', 'error');
      }
    };
    reader.readAsDataURL(file);
  },

  downloadAttachment: (attachId) => {
    const file = messages.activeClient.crm.attachments.find(a => a._id === attachId);
    if (!file) return;

    // Convert Base64 string back to downloadable file link
    const link = document.createElement('a');
    link.href = `data:${file.mimeType};base64,${file.data}`;
    link.download = file.name;
    link.click();
  },

  applyEmailTemplate: (templateName) => {
    const subjectEl = document.getElementById('emailSubject');
    const bodyEl = document.getElementById('emailBody');
    const c = messages.activeClient;
    if (!subjectEl || !bodyEl || !c) return;

    if (templateName === 'thankyou') {
      subjectEl.value = 'Thank you for your enquiry!';
      bodyEl.value = `Dear ${c.fullName},\n\nThank you for reaching out regarding freelance work. I have received your request for a ${c.projectType} and will review the details shortly.\n\nBest regards,\nDeveloper Workspace`;
    } else if (templateName === 'quotation') {
      subjectEl.value = `Quotation for project: ${c.projectType}`;
      bodyEl.value = `Dear ${c.fullName},\n\nRegarding your request for a ${c.projectType} (Budget: ${c.budget}), here is my preliminary quotation estimate. Let me know if you would like to proceed with a discussion call.\n\nBest regards,\nDeveloper Workspace`;
    } else if (templateName === 'discussion') {
      subjectEl.value = 'Project Discussion Call scheduled';
      bodyEl.value = `Dear ${c.fullName},\n\nLet's schedule a call to review your requirements for the ${c.projectType}.\n\nPlease let me know your availability this week.\n\nBest regards,\nDeveloper Workspace`;
    } else if (templateName === 'completed') {
      subjectEl.value = 'Project Completed successfully!';
      bodyEl.value = `Dear ${c.fullName},\n\nI am pleased to inform you that development tasks for your ${c.projectType} have completed.\n\nBest regards,\nDeveloper Workspace`;
    }
  },

  sendClientEmail: async () => {
    const subject = document.getElementById('emailSubject').value.trim();
    const body = document.getElementById('emailBody').value.trim();
    if (!subject || !body) return;

    dashboard.showToast('Sending client email response...', 'info');

    try {
      const res = await api.fetch(`/messages/${messages.activeDrawerId}/email`, {
        method: 'POST',
        body: JSON.stringify({ subject, body })
      });
      if (res && res.ok) {
        dashboard.showToast('Email sent and logged successfully.', 'success');
        const detailRes = await api.fetch(`/messages/${messages.activeDrawerId}`);
        const json = await detailRes.json();
        messages.activeClient = json.data;
        messages.renderActiveTab();
      }
    } catch (_) {
      dashboard.showToast('Failed to dispatch client email.', 'error');
    }
  },

  loadClientTimeline: async (id) => {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    try {
      const res = await api.fetch(`/messages/${id}/timeline`);
      if (!res) return;
      const json = await res.json();
      if (!json.success) return;

      const list = json.data || [];
      container.innerHTML = list.map(l => `
        <div class="timeline-item">
          <div><strong>${utils.escHtml(l.action)}</strong>: ${utils.escHtml(l.details)}</div>
          <div class="timeline-date">${new Date(l.createdAt).toLocaleString()} | IP: ${l.ip}</div>
        </div>
      `).join('') || '<p style="font-size:12px;color:var(--text-muted);text-align:center">No timeline activity logged.</p>';
    } catch (_) {
      container.innerHTML = '<p style="font-size:12px;color:var(--text-secondary)">Failed to load timeline.</p>';
    }
  },

  closeDrawer: () => {
    const drawer = document.getElementById('drawer');
    if (drawer) drawer.classList.remove('open');
    messages.activeDrawerId = null;
  },

  // ── CRM ACTIONS ─────────────────────────────────────────────────────────────
  toggleStar: async (id, currentlyStarred) => {
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ starred: !currentlyStarred })
    });
    if (res && res.ok) {
      dashboard.showToast(currentlyStarred ? 'Client unstarred' : 'Client marked as Starred ★', 'success');
      messages.openDrawer(id); // Reload drawer
      messages.load();
    }
  },

  toggleArchive: async (id, currentlyArchived) => {
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ isArchived: !currentlyArchived })
    });
    if (res && res.ok) {
      dashboard.showToast(currentlyArchived ? 'Enquiry restored to Inbox' : 'Enquiry sent to Archive', 'success');
      messages.closeDrawer();
      messages.load();
    }
  },

  confirmDelete: (id, name) => {
    const confirmBox = confirm(`Soft-delete enquiry from "${name}"?\n\nThis item will be placed in the trash and can be fully restored later.`);
    if (confirmBox) {
      messages.softDelete(id);
    }
  },

  softDelete: async (id) => {
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ isDeleted: true })
    });
    if (res && res.ok) {
      dashboard.showToast('Enquiry moved to Trash.', 'success');
      messages.closeDrawer();
      messages.load();
    }
  },

  updateStatus: async (id, status) => {
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res && res.ok) {
      dashboard.showToast(`Status changed to: ${status.toUpperCase()}`, 'success');
      messages.load();
    }
  },

  saveNotes: async (id) => {
    const notes = document.getElementById('drawerNotesText').value;
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
    if (res && res.ok) {
      dashboard.showToast('Internal CRM notes saved.', 'success');
    }
  },

  saveTags: async (id) => {
    const tagsVal = document.getElementById('drawerTagsInput').value;
    const tagsList = tagsVal.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({ tags: tagsList })
    });
    if (res && res.ok) {
      dashboard.showToast('Enquiry tags saved.', 'success');
    }
  },

  saveFollowUp: async (id) => {
    const dateVal = document.getElementById('drawerFollowUpDate').value;
    const priorityVal = document.getElementById('drawerFollowUpPriority').value;
    
    const res = await api.fetch(`/messages/${id}/crm`, {
      method: 'PATCH',
      body: JSON.stringify({
        followUpDate: dateVal ? new Date(dateVal) : null,
        followUpPriority: priorityVal,
        followUpStatus: dateVal ? 'pending' : 'none'
      })
    });
    if (res && res.ok) {
      dashboard.showToast('Follow-up parameters updated.', 'success');
    }
  },

  copyText: (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      dashboard.showToast(`${label} copied to clipboard!`, 'success');
    });
  },

  // ── BULK ACTIONS ────────────────────────────────────────────────────────────
  applyBulkAction: async (action, value) => {
    const idsArray = Array.from(messages.selectedIds);
    if (idsArray.length === 0) return;

    if (action === 'delete') {
      const confirmBox = confirm(`Soft-delete all ${idsArray.length} selected enquiries?`);
      if (!confirmBox) return;
    }

    try {
      const res = await api.fetch('/messages/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ids: idsArray,
          action,
          value
        })
      });

      if (res && res.ok) {
        dashboard.showToast(`Bulk operation '${action}' complete.`, 'success');
        messages.selectedIds.clear();
        messages.load();
      }
    } catch (_) {
      dashboard.showToast('Failed to apply bulk operation.', 'error');
    }
  },

  // ── BULK EXPORTS ────────────────────────────────────────────────────────────
  exportSelected: async (format) => {
    const idsArray = Array.from(messages.selectedIds);
    if (idsArray.length === 0) {
      dashboard.showToast('Please select at least one row to export.', 'info');
      return;
    }

    try {
      // Fetch full details of selected messages
      const msgsData = [];
      for (const id of idsArray) {
        const res = await api.fetch(`/messages/${id}`);
        if (res && res.ok) {
          const json = await res.json();
          msgsData.push(json.data);
        }
      }

      if (format === 'csv') messages.downloadCSV(msgsData);
      else if (format === 'excel') messages.downloadExcel(msgsData);
      else if (format === 'json') messages.downloadJSON(msgsData);
    } catch (_) {
      dashboard.showToast('Export failed.', 'error');
    }
  },

  downloadCSV: (data) => {
    const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Budget', 'Description', 'Notes', 'Date', 'Status'];
    const rows = data.map(m => [
      m.fullName, m.email, m.phone || '', m.projectType,
      m.budget, m.projectDescription.replace(/\n/g, ' '),
      (m.crm?.notes || '').replace(/\n/g, ' '),
      utils.formatDateFull(m.createdAt), m.crm?.status || 'unread'
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    messages.triggerDownload(csvContent, 'crm-export.csv', 'text/csv');
  },

  downloadJSON: (data) => {
    messages.triggerDownload(JSON.stringify(data, null, 2), 'crm-export.json', 'application/json');
  },

  downloadExcel: (data) => {
    const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Budget', 'Description', 'Notes', 'Date', 'Status'];
    const rows = data.map(m => [
      m.fullName, m.email, m.phone || '', m.projectType,
      m.budget, m.projectDescription.replace(/\n/g, ' '),
      (m.crm?.notes || '').replace(/\n/g, ' '),
      utils.formatDateFull(m.createdAt), m.crm?.status || 'unread'
    ]);
    const tsvContent = [headers, ...rows].map(r => r.map(c => String(c).replace(/\t/g, ' ')).join('\t')).join('\n');
    messages.triggerDownload('\ufeff' + tsvContent, 'crm-export.xls', 'application/vnd.ms-excel');
  },

  triggerDownload: (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    dashboard.showToast('File downloaded successfully.', 'success');
  },

  // ── CLEAR INSTANT SEARCH ──────────────────────────────────────────────────
  clearSearch: () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
      const clearBtn = document.getElementById('searchClearBtn');
      if (clearBtn) clearBtn.style.display = 'none';
    }
    state.search = '';
    state.page = 1;
    messages.load();
  },

  // ── COLUMN VISIBILITY CONTROLS ────────────────────────────────────────────
  columns: ['name', 'email', 'phone', 'type', 'budget', 'desc', 'date', 'status'],

  toggleColumnSelector: () => {
    const menu = document.getElementById('columnSelectorMenu');
    if (!menu) return;

    const isShowing = menu.classList.contains('show');
    if (!isShowing) {
      messages.initColumnSelector();
      menu.classList.add('show');
      
      // Close dropdown on outside click
      const closeMenu = (e) => {
        const btn = document.getElementById('columnSelectorBtn');
        if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('show');
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    } else {
      menu.classList.remove('show');
    }
  },

  initColumnSelector: () => {
    const menu = document.getElementById('columnSelectorMenu');
    if (!menu) return;

    const savedState = JSON.parse(localStorage.getItem('crm_columns') || '{}');

    menu.innerHTML = messages.columns.map(col => {
      const isVisible = savedState[col] !== false;
      const checked = isVisible ? 'checked' : '';
      return `
        <label class="column-visibility-item">
          <input type="checkbox" data-col="${col}" ${checked} onchange="messages.setColumnVisible('${col}', this.checked)" />
          <span>${col.charAt(0).toUpperCase() + col.slice(1)}</span>
        </label>
      `;
    }).join('');
  },

  setColumnVisible: (col, visible) => {
    const savedState = JSON.parse(localStorage.getItem('crm_columns') || '{}');
    savedState[col] = visible;
    localStorage.setItem('crm_columns', JSON.stringify(savedState));
    messages.applyColumnsState();
  },

  applyColumnsState: () => {
    const savedState = JSON.parse(localStorage.getItem('crm_columns') || '{}');
    messages.columns.forEach(col => {
      const isVisible = savedState[col] !== false;
      document.querySelectorAll(`.col-${col}`).forEach(el => {
        el.style.display = isVisible ? '' : 'none';
      });
    });
  }
};
