// API utility functions
class API {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.removeToken();
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Countertops
  async getCountertops(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/countertops?${queryString}`, { skipAuth: true });
  }

  async getCountertop(id) {
    return this.request(`/countertops/${id}`, { skipAuth: true });
  }

  // Blog
  async getBlogPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/blog?${queryString}`, { skipAuth: true });
  }

  async getBlogPost(slug) {
    return this.request(`/blog/${slug}`, { skipAuth: true });
  }

  // Leads
  async submitLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
      skipAuth: true
    });
  }

  // Search
  async search(query, type = 'all') {
    return this.request(`/search?q=${encodeURIComponent(query)}&type=${type}`, { skipAuth: true });
  }

  // Recommendations
  async getRecommendations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/recommendations?${queryString}`, { skipAuth: true });
  }

  // Fabricators
  async getFabricators(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/fabricators?${queryString}`, { skipAuth: true });
  }
}

// DOM utility functions
class DOM {
  static $(selector) {
    return document.querySelector(selector);
  }

  static $$(selector) {
    return document.querySelectorAll(selector);
  }

  static create(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      element.innerHTML = content;
    }

    return element;
  }

  static show(element) {
    element.style.display = '';
    element.classList.remove('d-none');
  }

  static hide(element) {
    element.style.display = 'none';
    element.classList.add('d-none');
  }

  static toggle(element) {
    if (element.style.display === 'none' || element.classList.contains('d-none')) {
      this.show(element);
    } else {
      this.hide(element);
    }
  }

  static loading(element, show = true) {
    if (show) {
      element.innerHTML = '<div class="spinner"></div> Loading...';
      element.disabled = true;
    } else {
      element.disabled = false;
    }
  }
}

// Form handling utilities
class FormHandler {
  constructor(formSelector, onSubmit) {
    this.form = DOM.$(formSelector);
    this.onSubmit = onSubmit;
    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  async handleSubmit() {
    try {
      this.setLoading(true);
      this.clearErrors();

      const formData = this.getFormData();
      await this.onSubmit(formData);
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (e.g., checkboxes)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  setLoading(loading) {
    const submitBtn = this.form.querySelector('[type="submit"]');
    if (submitBtn) {
      DOM.loading(submitBtn, loading);
    }
  }

  showError(message) {
    this.clearErrors();
    const errorDiv = DOM.create('div', {
      className: 'alert alert-error',
      role: 'alert'
    }, message);
    
    this.form.prepend(errorDiv);
  }

  showSuccess(message) {
    this.clearErrors();
    const successDiv = DOM.create('div', {
      className: 'alert alert-success',
      role: 'alert'
    }, message);
    
    this.form.prepend(successDiv);
  }

  clearErrors() {
    const alerts = this.form.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
  }

  reset() {
    this.form.reset();
    this.clearErrors();
  }
}

// Modal utilities
class Modal {
  constructor(modalSelector) {
    this.modal = DOM.$(modalSelector);
    this.overlay = DOM.$('.modal-overlay');
    this.init();
  }

  init() {
    if (!this.modal) return;

    // Close modal on overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Close button
    const closeBtn = this.modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  open() {
    DOM.show(this.modal);
    if (this.overlay) DOM.show(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  close() {
    DOM.hide(this.modal);
    if (this.overlay) DOM.hide(this.overlay);
    document.body.style.overflow = '';
  }

  isOpen() {
    return !this.modal.classList.contains('d-none') && this.modal.style.display !== 'none';
  }
}

// Notification system
class NotificationManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = DOM.$('.notification-container');
    if (!container) {
      container = DOM.create('div', { className: 'notification-container' });
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 5000) {
    const notification = DOM.create('div', {
      className: `notification notification-${type}`
    }, `
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `);

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.remove(notification));

    this.container.appendChild(notification);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }

    return notification;
  }

  remove(notification) {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Image lazy loading
class LazyLoader {
  constructor() {
    this.images = DOM.$$('img[data-src]');
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    this.init();
  }

  init() {
    this.images.forEach(img => this.observer.observe(img));
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        this.observer.unobserve(img);
      }
    });
  }
}

// Global instances
const api = new API();
const notifications = new NotificationManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize lazy loading
  new LazyLoader();

  // Initialize mobile menu toggle
  const mobileMenuBtn = DOM.$('.mobile-menu-btn');
  const navbar = DOM.$('.navbar-nav');
  
  if (mobileMenuBtn && navbar) {
    mobileMenuBtn.addEventListener('click', () => {
      DOM.toggle(navbar);
    });
  }

  // Initialize search functionality
  const searchForm = DOM.$('.search-form');
  if (searchForm) {
    new FormHandler('.search-form', async (data) => {
      const results = await api.search(data.query);
      displaySearchResults(results);
    });
  }
});

// Search results display
function displaySearchResults(results) {
  const resultsContainer = DOM.$('.search-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';

  if (results.countertops?.length) {
    const section = DOM.create('div', { className: 'search-section' });
    section.innerHTML = `
      <h3>Countertops</h3>
      <div class="gallery-grid">
        ${results.countertops.map(countertop => `
          <div class="card">
            <img src="${countertop.images[0]}" alt="${countertop.name}" class="card-img">
            <div class="card-body">
              <h4 class="card-title">${countertop.name}</h4>
              <p class="card-text">${countertop.material}</p>
              <a href="/countertops/${countertop._id}" class="btn btn-primary">View Details</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    resultsContainer.appendChild(section);
  }

  if (results.blog?.length) {
    const section = DOM.create('div', { className: 'search-section' });
    section.innerHTML = `
      <h3>Blog Posts</h3>
      <div class="blog-results">
        ${results.blog.map(post => `
          <article class="blog-card">
            <h4><a href="/blog/${post.slug}">${post.title}</a></h4>
            <p>${post.excerpt}</p>
            <small>Published on ${new Date(post.publishedAt).toLocaleDateString()}</small>
          </article>
        `).join('')}
      </div>
    `;
    resultsContainer.appendChild(section);
  }

  if (!results.countertops?.length && !results.blog?.length) {
    resultsContainer.innerHTML = '<p>No results found. Try different keywords.</p>';
  }
}

// Export for use in other scripts
window.AppUtils = {
  API,
  DOM,
  FormHandler,
  Modal,
  NotificationManager,
  LazyLoader,
  api,
  notifications
};
