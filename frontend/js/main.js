/* ==========================================================================
   FRONTEND APPLICATION LOGIC WITH ELEVENTH-HOUR ANIMATIONS
   Portfolio of Sudalaimuthu A - Full Stack Web Developer
   ========================================================================== */

const API_BASE_URL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === ''           // file:// protocol (opened directly)
)
  ? 'http://localhost:5000'
  : 'https://developer-portfolio-backend-x89y.onrender.com'; // Replace with your Render URL for production

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initContactForm();
  initScrollReveal();
  initEventTracking();
  
  // Track scroll indicators initially
  updateScrollProgress();
});

// Handle loading screen fadeout on full window load
window.addEventListener('load', () => {
  const loader = document.getElementById('loading-screen');
  if (loader) {
    loader.classList.add('fade-out');
  }
  
  // Make sure to check reveals on load (elements already in viewport)
  triggerInitialReveal();
});

// Scroll Event Listeners
window.addEventListener('scroll', () => {
  updateScrollProgress();
  updateActiveNavLinks();
});

/**
 * Initialize Sticky Header & Mobile Drawer Navigation
 */
function initNavbar() {
  const header = document.querySelector('.navbar');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Change navbar appearance on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.boxShadow = 'var(--shadow-md)';
      header.style.background = 'hsla(var(--bg-base-dark) / 0.9)';
    } else {
      header.style.boxShadow = 'none';
      header.style.background = 'hsla(var(--bg-base-dark) / 0.7)';
    }
  });

  // Toggle mobile navigation drawer
  if (toggleBtn && mobileNav) {
    toggleBtn.addEventListener('click', () => {
      const isActive = mobileNav.classList.toggle('active');
      toggleBtn.classList.toggle('open', isActive);
      toggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      
      // Accessibility: Focus management if opened
      if (isActive) {
        mobileNav.querySelector('a')?.focus();
      }
    });

    // Close mobile menu when a nav link is clicked
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        toggleBtn.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/**
 * Update Reading / Scroll Progress Bar
 */
function updateScrollProgress() {
  const scrollProgress = document.getElementById('scroll-progress');
  if (!scrollProgress) return;
  
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight <= 0) return;
  
  const progress = (window.scrollY / totalHeight) * 100;
  scrollProgress.style.width = `${progress}%`;
}

/**
 * Detect visible sections and update Nav Bar Links
 */
function updateActiveNavLinks() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.navbar .nav-links a:not(.btn)');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a:not(.btn)');
  
  let currentSectionId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.offsetHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  if (!currentSectionId) return;

  autoHighlight(navLinks, currentSectionId);
  autoHighlight(mobileNavLinks, currentSectionId);
}

function autoHighlight(links, targetId) {
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${targetId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Initialize IntersectionObserver Scroll Reveals
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-in');
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // Trigger sub-animations inside the revealed element if present
        const progressBars = entry.target.querySelectorAll('.skill-progress');
        if (progressBars.length > 0) {
          animateProgressBars(progressBars);
        }
        
        const statNumbers = entry.target.querySelectorAll('.stat-num');
        if (statNumbers.length > 0) {
          animateStats(statNumbers);
        }
        
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });
  
  revealElements.forEach(el => observer.observe(el));
}

/**
 * Trigger reveals manually for hero elements already on screen
 */
function triggerInitialReveal() {
  const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-in');
  revealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('active');
    }
  });
}

/**
 * Animate progress bar widths and labels
 */
function animateProgressBars(progressBars) {
  progressBars.forEach(bar => {
    const targetVal = bar.getAttribute('data-width');
    bar.style.width = `${targetVal}%`;
    
    // Animate label next to it
    const label = bar.closest('.skill-item').querySelector('.skill-percentage');
    if (label) {
      const dataVal = label.getAttribute('data-val');
      countUp(label, 0, parseInt(dataVal), 1000, '%');
    }
  });
}

/**
 * Animate statistic number labels counting up
 */
function animateStats(statNumbers) {
  statNumbers.forEach(stat => {
    const targetVal = parseInt(stat.getAttribute('data-target'));
    const suffix = stat.getAttribute('data-target') === '100' ? '%' : '+';
    countUp(stat, 0, targetVal, 1500, suffix);
  });
}

/**
 * Standard utility to count up a text element number
 */
function countUp(element, start, end, duration, suffix = '') {
  let startTime = null;
  
  function animation(currentTime) {
    if (!startTime) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const currentVal = Math.floor(progress * (end - start) + start);
    element.textContent = currentVal + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(animation);
    } else {
      element.textContent = end + suffix;
    }
  }
  
  requestAnimationFrame(animation);
}

/**
 * Initialize Contact Form Validation and Submission Simulation
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusMsg = document.getElementById('form-status-msg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset status message
    statusMsg.className = 'form-status';
    statusMsg.textContent = '';
    statusMsg.style.display = 'none';

    // Extract values
    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim();
    const phone = form.elements['phone'].value.trim();
    const projectType = form.elements['projectType'].value;
    const budget = form.elements['budget'].value;
    const message = form.elements['message'].value.trim();

    // Frontend Validations
    if (!name || !email || !phone || !projectType || !budget || !message) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }









    
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      showStatus('Please enter a valid phone number (7 to 20 digits).', 'error');
      return;
    }

    // Submit state: Disable submit button and show loading text
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Message...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: name,
          email,
          phone,
          projectType,
          budget,
          projectDescription: message
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showStatus('Thank you! Your message has been sent successfully.', 'success');
        trackGAEvent('contact_form_success', 'form', 'Inquiry Form');
        form.reset();
      } else {
        const errorMsg = result.message || 'Validation failed. Please review your input details.';
        showStatus(errorMsg, 'error');
        trackGAEvent('contact_form_failure', 'form', errorMsg);
      }
    } catch (err) {
      showStatus('Failed to connect to the server. Please check your network connection and try again.', 'error');
      trackGAEvent('contact_form_network_error', 'form', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = `form-status ${type}`;
    statusMsg.style.display = 'block';
  }

  function validateEmail(emailString) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(emailString);
  }
}

/**
 * Global GA4 Event Tracking Helper
 */
function trackGAEvent(action, category, label) {
  if (typeof gtag === 'function') {
    gtag('event', action, {
      'event_category': category,
      'event_label': label
    });
  }
}

/**
 * Track Scroll Depth Percentages
 */
let scrollThresholds = { p25: false, p50: false, p75: false, p100: false };
function trackScrollDepth() {
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight <= 0) return;
  const pct = Math.round((window.scrollY / totalHeight) * 100);
  
  if (pct >= 25 && !scrollThresholds.p25) {
    scrollThresholds.p25 = true;
    trackGAEvent('scroll_depth_25', 'scroll', '25% Depth');
  }
  if (pct >= 50 && !scrollThresholds.p50) {
    scrollThresholds.p50 = true;
    trackGAEvent('scroll_depth_50', 'scroll', '50% Depth');
  }
  if (pct >= 75 && !scrollThresholds.p75) {
    scrollThresholds.p75 = true;
    trackGAEvent('scroll_depth_75', 'scroll', '75% Depth');
  }
  if (pct >= 95 && !scrollThresholds.p100) {
    scrollThresholds.p100 = true;
    trackGAEvent('scroll_depth_100', 'scroll', '100% Depth');
  }
}

// Bind scroll tracker to window scroll events
window.addEventListener('scroll', trackScrollDepth);

/**
 * Initialize Click Event Tracking for critical interactive buttons
 */
function initEventTracking() {
  // 1. Hero CTAs
  const heroPrimary = document.querySelector('#hero .hero-content .hero-ctas a.btn-primary');
  const heroSecondary = document.querySelector('#hero .hero-content .hero-ctas a.btn-secondary');
  const heroResume = document.getElementById('hero-resume-btn');
  const heroGithub = document.querySelector('#hero a[aria-label="GitHub Profile"]');

  if (heroPrimary) {
    heroPrimary.addEventListener('click', () => trackGAEvent('click_hire_me_hero', 'cta', 'Hero Section'));
  }
  if (heroSecondary) {
    heroSecondary.addEventListener('click', () => trackGAEvent('click_view_projects_hero', 'cta', 'Hero Section'));
  }
  if (heroResume) {
    heroResume.addEventListener('click', () => trackGAEvent('click_resume_placeholder_hero', 'document', 'Hero Resume Link'));
  }
  if (heroGithub) {
    heroGithub.addEventListener('click', () => trackGAEvent('click_github_hero', 'social', 'Hero GitHub Link'));
  }

  // 2. Resume Section
  const downloadResume = document.getElementById('download-cv-btn-secondary');
  const viewResume = document.getElementById('view-cv-btn');

  if (downloadResume) {
    downloadResume.addEventListener('click', () => trackGAEvent('download_resume', 'document', 'Resume Section Download'));
  }
  if (viewResume) {
    viewResume.addEventListener('click', () => trackGAEvent('view_resume', 'document', 'Resume Section Viewer'));
  }

  // 3. Social and Contact Links
  const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  const githubLinks = document.querySelectorAll('a[href*="github.com"]');
  const linkedinLinks = document.querySelectorAll('a[aria-label="LinkedIn"]');
  const instagramLinks = document.querySelectorAll('a[aria-label="Instagram"]');

  mailLinks.forEach(link => {
    link.addEventListener('click', () => trackGAEvent('click_email', 'contact', link.getAttribute('href')));
  });
  phoneLinks.forEach(link => {
    link.addEventListener('click', () => trackGAEvent('click_phone', 'contact', link.getAttribute('href')));
  });
  githubLinks.forEach(link => {
    // Avoid double logging hero github
    if (link !== heroGithub) {
      link.addEventListener('click', () => trackGAEvent('click_github_general', 'social', 'GitHub link'));
    }
  });
  linkedinLinks.forEach(link => {
    link.addEventListener('click', () => trackGAEvent('click_linkedin_placeholder', 'social', 'LinkedIn Link'));
  });
  instagramLinks.forEach(link => {
    link.addEventListener('click', () => trackGAEvent('click_instagram_placeholder', 'social', 'Instagram Link'));
  });
}
