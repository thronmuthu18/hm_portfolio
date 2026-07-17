# SEO, Search Console & Google Analytics 4 Guide

This document describes the search engine optimization (SEO) configurations, site crawling directives, and user interaction analytics telemetry setup in **Module 9**.

---

## 1. Google Analytics 4 (GA4) Integration

### What is GA4 & Why is it Important?
Google Analytics 4 is Google's modern analytics system, designed to track web events across platform structures without relying extensively on third-party tracking cookies. It organizes telemetry into unified event parameters (rather than page view hits), allowing you to measure exactly how visitors engage with your freelance portfolio.

### Setup Instructions (Obtaining Measurement ID)
1. Register and sign in to [analytics.google.com](https://analytics.google.com).
2. Click **Admin** (gear icon) -> **Create Account** (name: `Portfolio Analytics`).
3. Create a **Property** (name: `Sudalaimuthu-Portfolio`, set reporting time zone and currency).
4. Under **Data Streams**, select **Web**.
5. Input your portfolio URL (`https://sudalaimuthu.dev`) and Stream Name, then click **Create Stream**.
6. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`).
7. Replace `G-XXXXXXXXXX` inside the `<head>` tag of `frontend/index.html` with your active ID.

---

## 2. Integrated Event Tracking Logs (GA4)

| Event Name | Category | Trigger Action |
| :--- | :--- | :--- |
| **`click_hire_me_hero`** | `cta` | Clicking "Hire Me" primary button in the Hero section. |
| **`click_view_projects_hero`** | `cta` | Clicking "View Projects" secondary button in the Hero section. |
| **`click_resume_placeholder_hero`** | `document` | Clicking "Resume (Placeholder)" button in the Hero section. |
| **`click_github_hero`** | `social` | Clicking "GitHub" profile link in the Hero section. |
| **`download_resume`** | `document` | Clicking "Download Resume" in the Credentials section. |
| **`view_resume`** | `document` | Clicking "View Document" in the Credentials section. |
| **`click_email`** | `contact` | Clicking any `mailto:` direct email link. |
| **`click_phone`** | `contact` | Clicking any `tel:` direct phone link. |
| **`contact_form_success`** | `form` | Submitting the Contact Form successfully (frontend validation passes). |
| **`scroll_depth_25` / `50` / `75` / `100`** | `scroll` | Fired once per page load when user scrolls past 25%, 50%, 75%, and 95% of reading depth. |

---

## 3. SEO Optimization Meta Tags

- **robots.txt**: Configured at `/robots.txt` to instruct crawlers to index static layouts while hiding internal API endpoints (`/api/`) and configuration folder sectors.
- **sitemap.xml**: Configured at `/sitemap.xml` mapping the canonical layout path to assist indexing bots.
- **Title**: `Sudalaimuthu A | Full Stack Web Developer & Freelancer` (under 60 characters).
- **Meta Description**: Premium, keywords-rich, user-focused summary under 160 characters.
- **JSON-LD Schema**: Embedded Person, WebSite, and WebPage structural metadata array to qualify for rich search result snippets on Google.
- **Social Tags**: Open Graph (OG) and Twitter card descriptors with preview image tags (`/assets/images/og-preview.webp`) for cleaner sharing embeds on LinkedIn, GitHub, and Twitter.

---

## 4. Google Search Console Property Setup

Google Search Console (GSC) monitors site presence and performance in search indices:

1. Register at [search.google.com/search-console](https://search.google.com/search-console).
2. Click **Add Property** and select **URL prefix** (enter `https://sudalaimuthu.dev`).
3. **Verify Ownership**:
   - Select **HTML tag** option.
   - Copy the `<meta name="google-site-verification" content="..." />` tag.
   - Insert this tag in the `<head>` of your `index.html` and redeploy.
   - Click **Verify** in Search Console.
4. **Sitemap Submission**:
   - Navigate to **Sitemaps** from the sidebar.
   - Enter `sitemap.xml` in the field and click **Submit**.
   - Ensure GSC reports status **Success**.

---

## 5. Performance & Accessibility Audit Guidelines (Targeting Lighthouse 95+)

- **Lazy Loading**: Ensure images use `loading="lazy"` tags.
- **Critical Asset Preloads**: Preload main CSS files and Outfit Google fonts to avoid layout shifts (CLS).
- **Keyboard Navigation**: Interactive tags utilize `:focus-visible` with a cyan outline. Clicking "Tab" traverses links and buttons sequentially.
- **Semantic Headers Hierarchy**: Main layout structured sequentially starting with exactly one `<h1>` tag in the hero banner, followed by `<h2>` headers for sections.
- **Color Contrast**: Main text has contrast ratio of >13:1 over dark slate backgrounds, exceeding AAA criteria.
- **Favicon setup**: Configured ICO and PNG favicon tags to prevent `404 Not Found` requests, speeding up page generation.
