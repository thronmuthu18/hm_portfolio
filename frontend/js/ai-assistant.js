/**
 * Conversational AI Assistant & Command Palette Console
 * Client-side Matching Engine & Speech Coordinator
 */
document.addEventListener('DOMContentLoaded', () => {
  initAiAssistant();
});

function initAiAssistant() {
  const modal = document.getElementById('ai-console-modal');
  const openBtn = document.getElementById('hero-ask-ai-btn') || document.getElementById('nav-ask-ai-btn');
  const closeBtn = document.getElementById('ai-console-close');
  const chatInput = document.getElementById('ai-chat-input');
  const chatLog = document.getElementById('ai-chat-log');
  const sendBtn = document.getElementById('ai-chat-send');
  const micBtn = document.getElementById('ai-speech-mic');
  const commandPalette = document.getElementById('command-palette-list');
  const welcomeToast = document.getElementById('welcome-toast');
  const closeToast = document.getElementById('close-welcome-toast');

  if (!modal) return;

  // Portfolio context data to avoid hallucinations
  const context = {
    name: "Sudalaimuthu A",
    title: "Full Stack Web Developer",
    location: "India",
    goals: "Building secure, high-performance, and visually rich digital experiences that help startups and personal brands scale.",
    skills: {
      frontend: ["HTML5", "CSS3", "Vanilla JavaScript (ES6+)", "Responsive UI Design"],
      backend: ["Node.js", "Express.js", "REST APIs", "CORS Configuration", "Helmet Security Middleware"],
      database: ["MongoDB Atlas", "Mongoose", "Database Indexing", "Aggregations"],
      tools: ["Git/GitHub", "Render", "Netlify", "PWA (Service Workers, Manifests)", "SRE Telemetry Logs"]
    },
    projects: [
      {
        name: "CB Builders",
        type: "Active Business Web",
        tags: ["HTML5", "CSS3", "Vanilla JS", "Netlify"],
        desc: "A professional construction and interior design business website displaying detailed projects, service portfolios, and custom consultation workflows."
      },
      {
        name: "Full Stack Storefront",
        type: "E-Commerce (Coming Soon)",
        tags: ["Node.js", "Express", "MongoDB"],
        desc: "A secure e-commerce application platform featuring shopping cart setups, inventory queries, and customer order logging models."
      }
    ],
    contact: {
      email: "sudalaimuthusudalai754@gmail.com",
      github: "https://github.com/thronmuthu18",
      linkedin: "https://www.linkedin.com/in/sudalaimuthu-a-73bb77218/"
    }
  };

  // Welcome sequence toast triggers
  if (welcomeToast) {
    setTimeout(() => {
      welcomeToast.classList.add('show');
    }, 2500);

    closeToast.addEventListener('click', (e) => {
      e.stopPropagation();
      welcomeToast.classList.remove('show');
    });

    welcomeToast.addEventListener('click', () => {
      welcomeToast.classList.remove('show');
      openConsole();
    });
  }

  // Open/Close Console Handlers
  function openConsole() {
    modal.classList.add('open');
    chatInput.focus();
    // Insert initial AI greeting
    if (chatLog.children.length === 0) {
      addAiMessage("System Online. I am your AI portfolio guide. How can I assist you with Sudalaimuthu's credentials today?");
    }
  }

  function closeConsole() {
    modal.classList.remove('open');
  }

  if (openBtn) openBtn.addEventListener('click', openConsole);
  if (closeBtn) closeBtn.addEventListener('click', closeConsole);

  // Close console on clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeConsole();
  });

  // Global Ctrl + K Hotkey Listener
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.classList.contains('open')) {
        closeConsole();
      } else {
        openConsole();
      }
    }
  });

  // 1. Keyboard navigation inside Command Palette list
  let selectedIndex = -1;
  const commandItems = commandPalette ? commandPalette.querySelectorAll('.command-item') : [];

  function updateSelectedCommand() {
    commandItems.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % commandItems.length;
      updateSelectedCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + commandItems.length) % commandItems.length;
      updateSelectedCommand();
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < commandItems.length) {
        e.preventDefault();
        commandItems[selectedIndex].click();
      } else if (chatInput.value.trim() !== '') {
        e.preventDefault();
        handleUserMessage();
      }
    } else if (e.key === 'Escape') {
      closeConsole();
    }
  });

  // Command items click links handler
  commandItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      closeConsole();
      if (action.startsWith('#')) {
        // Smooth scroll to element anchor
        const target = document.querySelector(action);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (action === 'theme') {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) toggle.click();
      } else if (action.startsWith('http')) {
        window.open(action, '_blank', 'noopener');
      }
    });
  });

  // 2. Conversational Message Handling
  if (sendBtn) sendBtn.addEventListener('click', handleUserMessage);

  function handleUserMessage() {
    const text = chatInput.value.trim();
    if (text === '') return;

    addUserMessage(text);
    chatInput.value = '';
    selectedIndex = -1;
    updateSelectedCommand();

    // Generate response using local matching engine
    setTimeout(() => {
      const response = generateLocalResponse(text.toLowerCase());
      addAiMessage(response);
      speakResponse(response);
    }, 450);
  }

  function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user-msg';
    msg.innerHTML = `<span class="msg-sender">You</span><p class="msg-text">${escapeHtml(text)}</p>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addAiMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ai-msg';
    msg.innerHTML = `<span class="msg-sender">Assistant</span><p class="msg-text"></p>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Typewriter effect
    const p = msg.querySelector('.msg-text');
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        p.textContent += text[idx];
        idx++;
        chatLog.scrollTop = chatLog.scrollHeight;
      } else {
        clearInterval(interval);
      }
    }, 12);
  }

  // 3. Conversational Matching Logic (No hallucinations)
  function generateLocalResponse(query) {
    if (query.includes('project') || query.includes('work') || query.includes('portfolio')) {
      if (query.includes('builders') || query.includes('cb')) {
        return `Sudalaimuthu developed CB Builders, an active business website styled with HTML5, CSS3, and Vanilla JavaScript, hosted on Netlify. It includes detailed project portfolios and service catalog listings.`;
      }
      if (query.includes('storefront') || query.includes('e-commerce') || query.includes('shop')) {
        return `He built a secure Full Stack Storefront using Node.js, Express, and MongoDB, incorporating shopping inventory models and order tracking checkouts.`;
      }
      return `Sudalaimuthu's primary projects are:
1. CB Builders (Active construction business web portfolio).
2. Full Stack Storefront (Express/MongoDB shopping query model).
Ask me about either project to learn more!`;
    }

    if (query.includes('tech') || query.includes('skill') || query.includes('stack') || query.includes('know')) {
      if (query.includes('frontend') || query.includes('css') || query.includes('html')) {
        return `His Frontend stack details: ${context.skills.frontend.join(', ')}.`;
      }
      if (query.includes('backend') || query.includes('node') || query.includes('express')) {
        return `His Backend stack details: ${context.skills.backend.join(', ')}.`;
      }
      if (query.includes('db') || query.includes('mongo') || query.includes('database')) {
        return `His Database stack details: ${context.skills.database.join(', ')}.`;
      }
      return `His full stack engineering arsenal includes:
- Frontend: HTML5, CSS3, Vanilla JS.
- Backend: Node.js, Express, REST APIs, Helmet.
- Database: MongoDB Atlas, Mongoose, indexing.
- Tools: Git, PWA manifests, Render, telemetry logs.`;
    }

    if (query.includes('contact') || query.includes('email') || query.includes('hire') || query.includes('reach')) {
      return `You can contact Sudalaimuthu directly via email at: ${context.contact.email}. You can also connect via LinkedIn at: linkedin.com/in/sudalaimuthu-a-73bb77218/.`;
    }

    if (query.includes('education') || query.includes('college') || query.includes('degree') || query.includes('resume') || query.includes('career') || query.includes('cv') || query.includes('credential')) {
      return `Sudalaimuthu A — Credentials Profile:
- Specialization: Full Stack Web Developer.
- Core Stack: Node.js, Express, MongoDB Atlas, HTML5, CSS3, and Vanilla JavaScript.
- Highlights: Optimised API payload sizes by 99.8% (to 2.5KB), enforced constant-time authorization algorithms, and constructed PWA service caching paths.
- Active Works: CB Builders (business platform) and Full Stack Storefront.`;
    }

    if (query.includes('who') || query.includes('about') || query.includes('sudalai')) {
      return `Sudalaimuthu A is a Full Stack Web Developer based in India, specializing in secure, high-performance web applications and database integrations.`;
    }

    return `I recognized your query. I can answer questions about Sudalaimuthu's projects (e.g., CB Builders, Storefront), technical stack (Frontend, Backend, Database), education history, and direct contact details. What would you like to know?`;
  }

  // 4. Voice Input (Speech Recognition) Mode
  let isListening = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      chatInput.placeholder = "Listening...";
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      chatInput.placeholder = "Ask AI guide / Ctrl+K Command Palette...";
    };

    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      chatInput.value = resultText;
      handleUserMessage();
    };

    recognition.onerror = (err) => {
      console.warn('[Speech] Error:', err);
    };
  } else if (micBtn) {
    micBtn.style.display = 'none'; // Hide mic if not supported
  }

  // 5. Speech Synthesis voice outputs
  let voiceEnabled = false; // Muted by default

  function speakResponse(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop active speaking
    const cleanText = text.replace(/[*#\-]/g, ''); // Scrub markdown characters
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // Voice toggle status button inside chat interface
  const voiceToggle = document.getElementById('ai-voice-toggle');
  if (voiceToggle) {
    voiceToggle.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      voiceToggle.classList.toggle('active', voiceEnabled);
      if (!voiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }

  // 6. Project Explorer instant search filters
  const filterButtons = document.querySelectorAll('.project-filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const projectSearch = document.getElementById('project-search-input');

  function filterProjects() {
    const query = projectSearch ? projectSearch.value.toLowerCase().trim() : '';
    const activeFilterBtn = document.querySelector('.project-filter-btn.active');
    const filterVal = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

    projectCards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const matchesSearch = text.includes(query);
      
      const tags = Array.from(card.querySelectorAll('.project-tag')).map(t => t.textContent.toLowerCase());
      const matchesFilter = filterVal === 'all' || tags.includes(filterVal.toLowerCase());

      if (matchesSearch && matchesFilter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (filterButtons) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProjects();
      });
    });
  }

  if (projectSearch) {
    projectSearch.addEventListener('input', filterProjects);
  }

  // Helpers
  function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[s];
    });
  }

}
