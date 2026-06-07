// ======================== UTILITIES ========================

// Toast notifications (only for errors)
export function showToast(msg, isError = false, duration = 4000) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove('show', 'error', 'success');
  if (isError) toastEl.classList.add('error');
  else toastEl.classList.add('success');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// Debounce function for search
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Virtual Scroller Class
export class VirtualScroller {
  constructor(container, itemHeight = 80, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.items = [];
    this.renderCallback = null;
    this.scrollHandler = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.scrollHandler);
    this.currentStart = 0;
    this.currentEnd = 0;
  }
  
  setItems(items, renderCallback) {
    this.items = items;
    this.renderCallback = renderCallback;
    this.container.innerHTML = '';
    this.contentDiv = document.createElement('div');
    this.contentDiv.className = 'virtual-scroller-content';
    this.contentDiv.style.height = `${items.length * this.itemHeight}px`;
    this.itemsDiv = document.createElement('div');
    this.itemsDiv.className = 'virtual-scroller-items';
    this.contentDiv.appendChild(this.itemsDiv);
    this.container.appendChild(this.contentDiv);
    this.onScroll();
  }
  
  onScroll() {
    if (!this.renderCallback) return;
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(this.items.length, Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer);
    
    if (startIndex === this.currentStart && endIndex === this.currentEnd) return;
    
    this.currentStart = startIndex;
    this.currentEnd = endIndex;
    
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top = `${i * this.itemHeight}px`;
      div.style.left = '0';
      div.style.right = '0';
      div.innerHTML = this.renderCallback(item);
      div.firstChild?.classList.add('drawer-item');
      fragment.appendChild(div);
    }
    
    this.itemsDiv.innerHTML = '';
    this.itemsDiv.appendChild(fragment);
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
  }
}

// Scroll to top helper
export function scrollToTop() {
  const homeView = document.getElementById('homeView');
  if (homeView) homeView.scrollTo({ top: 0, behavior: 'smooth' });
}