(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.querySelector('.primary-nav');

  const setMenuState = (isOpen) => {
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.classList.toggle('is-open', isOpen);
    }

    if (primaryNav) {
      primaryNav.classList.toggle('open', isOpen);
    }

    document.body.classList.toggle('menu-open', isOpen);
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      setMenuState(isOpen);
    });
  }

  if (primaryNav) {
    primaryNav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link) {
        setMenuState(false);
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (!primaryNav || !menuToggle) return;

    const clickedInsideNav = primaryNav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (primaryNav.classList.contains('open') && !clickedInsideNav && !clickedToggle) {
      setMenuState(false);
    }
  });

  window.addEventListener(
    'scroll',
    () => {
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 8);
      }
    },
    { passive: true }
  );

  const bottomNav = document.querySelector('.mobile-bottom-nav');

  if (bottomNav) {
    const SCROLL_THRESHOLD = 6;
    const IDLE_DELAY = 160;
    let lastScrollY = window.scrollY;
    let idleTimer = null;

    const showBottomNav = () => bottomNav.classList.remove('nav-hidden');
    const hideBottomNav = () => bottomNav.classList.add('nav-hidden');

    window.addEventListener(
      'scroll',
      () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;

        if (currentScrollY <= 12) {
          showBottomNav();
        } else if (delta > SCROLL_THRESHOLD) {
          hideBottomNav();
        } else if (delta < -SCROLL_THRESHOLD) {
          showBottomNav();
        }

        lastScrollY = currentScrollY;

        if (idleTimer) {
          window.clearTimeout(idleTimer);
        }
        idleTimer = window.setTimeout(showBottomNav, IDLE_DELAY);
      },
      { passive: true }
    );
  }

  const setActiveNavigation = () => {
    const path = window.location.pathname.toLowerCase();

    const pageMatchers = {
      home: /^\/(home(\.html)?)?\/?$/,
      about: /^\/about(\.html)?\/?$/,
      solutions: /^\/solutions(\.html)?\/?$/,
      contact: /^\/contact(\.html)?\/?$/,
    };

    const currentPage = Object.keys(pageMatchers).find((page) => pageMatchers[page].test(path));

    document.querySelectorAll('[data-page]').forEach((link) => {
      const isActive = link.dataset.page === currentPage;
      link.classList.toggle('active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  setActiveNavigation();

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Toast notifications — reusable across any page that includes this script.
  const TOAST_ICONS = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info',
  };

  const TOAST_TITLES = {
    success: 'Success',
    error: 'Error',
    warning: 'Heads up',
    info: 'Info',
  };

  const TOAST_DURATIONS = {
    success: 4500,
    info: 4500,
    warning: 5500,
    error: 6000,
  };

  const TOAST_LIMIT = 3;

  const getToastStack = () => {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  };

  const dismissToast = (toast, immediate = false) => {
    if (!toast || toast.dataset.dismissing) return;
    toast.dataset.dismissing = 'true';

    if (toast.dataset.timer) {
      window.clearTimeout(Number(toast.dataset.timer));
    }

    if (immediate) {
      toast.remove();
      return;
    }

    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 400);
  };

  const restartToastTimer = (toast) => {
    if (toast.dataset.timer) {
      window.clearTimeout(Number(toast.dataset.timer));
    }
    const duration = TOAST_DURATIONS[toast.dataset.type] || TOAST_DURATIONS.info;
    const timer = window.setTimeout(() => dismissToast(toast), duration);
    toast.dataset.timer = String(timer);
  };

  const showToast = (message, type = 'info') => {
    if (!message) return;
    const stack = getToastStack();

    const duplicate = Array.from(stack.children).find(
      (node) => node.dataset.message === message && node.dataset.type === type
    );
    if (duplicate) {
      restartToastTimer(duplicate);
      return;
    }

    while (stack.children.length >= TOAST_LIMIT) {
      dismissToast(stack.firstElementChild, true);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.dataset.message = message;
    toast.dataset.type = type;
    toast.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');

    const icon = document.createElement('i');
    icon.className = TOAST_ICONS[type] || TOAST_ICONS.info;
    icon.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'toast-body';

    const title = document.createElement('span');
    title.className = 'toast-title';
    title.textContent = TOAST_TITLES[type] || TOAST_TITLES.info;

    const text = document.createElement('p');
    text.className = 'toast-message';
    text.textContent = message;

    body.append(title, text);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast-close';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    closeButton.addEventListener('click', () => dismissToast(toast));

    toast.append(icon, body, closeButton);
    stack.appendChild(toast);
    restartToastTimer(toast);
  };

  window.showToast = showToast;

  document.querySelectorAll('.image-frame img').forEach((image) => {
    const frame = image.closest('.image-frame');
    if (!frame) return;

    if (image.complete && image.naturalWidth) {
      frame.classList.add('has-image');
    }

    image.addEventListener('load', () => {
      frame.classList.add('has-image');
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (!contactForm) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const buttonDefaultHTML = submitButton ? submitButton.innerHTML : '';
  let isSubmitting = false;

  const nameField = contactForm.querySelector('#name');
  const emailField = contactForm.querySelector('#email');
  const subjectField = contactForm.querySelector('#subject');
  const messageField = contactForm.querySelector('#message');

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MESSAGE_MIN_LENGTH = 6;
  const MESSAGE_MAX_LENGTH = 4000;

  const clearInvalidState = () => {
    [nameField, emailField, subjectField, messageField].forEach((field) => {
      field?.removeAttribute('aria-invalid');
    });
  };

  const flagInvalidField = (field) => {
    field?.setAttribute('aria-invalid', 'true');
    field?.focus();
  };

  [nameField, emailField, subjectField, messageField].forEach((field) => {
    field?.addEventListener('input', () => field.removeAttribute('aria-invalid'));
  });

  // Mirrors the checks performed in server.js so users get instant feedback,
  // while the server remains the final authority on submission.
  const validateContactForm = ({ name, email, subject, message }) => {
    if (!name) {
      return { field: nameField, message: 'Please enter your name.' };
    }
    if (!email) {
      return { field: emailField, message: 'Please enter your email address.' };
    }
    if (!EMAIL_PATTERN.test(email)) {
      return { field: emailField, message: 'Please enter a valid email address.' };
    }
    if (!subject) {
      return { field: subjectField, message: 'Please select a subject or service.' };
    }
    if (!message) {
      return { field: messageField, message: 'Please enter your message.' };
    }
    if (message.length < MESSAGE_MIN_LENGTH) {
      return {
        field: messageField,
        message: 'Your message is too short. Please provide a little more detail.',
      };
    }
    if (message.length > MESSAGE_MAX_LENGTH) {
      return {
        field: messageField,
        message: 'Your message is too long. Please shorten it and try again.',
      };
    }
    return null;
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = {
      name: nameField?.value.trim() || '',
      email: emailField?.value.trim() || '',
      subject: subjectField?.value.trim() || '',
      message: messageField?.value.trim() || '',
    };

    clearInvalidState();

    const problem = validateContactForm(formData);
    if (problem) {
      showToast(problem.message, 'warning');
      flagInvalidField(problem.field);
      return;
    }

    isSubmitting = true;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Sending…</span>';
    }

    try {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(
          payload.message || 'Something went wrong while sending your message. Please try again.',
          'error'
        );
        return;
      }

      showToast(payload.message || 'Your message has been sent successfully.', 'success');
      contactForm.reset();
    } catch (error) {
      showToast('Something went wrong while sending your message. Please try again.', 'error');
    } finally {
      isSubmitting = false;

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.innerHTML = buttonDefaultHTML;
      }
    }
  });
})();

