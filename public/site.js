document.addEventListener('DOMContentLoaded', function () {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const contactForm = document.getElementById('contactForm');
  if (!contactForm) {
    return;
  }

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    message: document.getElementById('message')
  };

  const errorEls = {
    name: document.getElementById('nameError'),
    email: document.getElementById('emailError'),
    phone: document.getElementById('phoneError'),
    message: document.getElementById('messageError')
  };

  const responseMessage = document.getElementById('responseMessage');
  const submitBtn = document.getElementById('submitBtn');

  function setError(fieldName, message) {
    const field = fields[fieldName];
    const errorEl = errorEls[fieldName];
    if (field) field.classList.add('error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldName) {
    const field = fields[fieldName];
    const errorEl = errorEls[fieldName];
    if (field) field.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    if (!phone) return true;
    return /^[+()\-\s\d]{7,20}$/.test(phone);
  }

  function validateField(fieldName) {
    const rawValue = fields[fieldName] ? fields[fieldName].value.trim() : '';

    clearError(fieldName);

    if (fieldName === 'name') {
      if (rawValue.length < 2) {
        setError('name', 'Name must be at least 2 characters.');
        return false;
      }
    }

    if (fieldName === 'email') {
      if (!rawValue) {
        setError('email', 'Email is required.');
        return false;
      }
      if (!isValidEmail(rawValue)) {
        setError('email', 'Enter a valid email address.');
        return false;
      }
    }

    if (fieldName === 'phone') {
      if (!isValidPhone(rawValue)) {
        setError('phone', 'Enter a valid phone number or leave blank.');
        return false;
      }
    }

    if (fieldName === 'message') {
      if (rawValue.length < 10) {
        setError('message', 'Message must be at least 10 characters.');
        return false;
      }
    }

    return true;
  }

  ['name', 'email', 'phone', 'message'].forEach(function (fieldName) {
    const field = fields[fieldName];
    if (!field) return;

    field.addEventListener('blur', function () {
      validateField(fieldName);
    });

    field.addEventListener('input', function () {
      validateField(fieldName);
    });
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (responseMessage) {
      responseMessage.textContent = '';
      responseMessage.style.color = '#b91c1c';
    }

    const valid = ['name', 'email', 'phone', 'message'].every(validateField);
    if (!valid) {
      return;
    }

    const honeypot = contactForm.querySelector('input[name="_hp"]');
    if (honeypot && honeypot.value) {
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : 'Submit';
    if (submitBtn) {
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    const formData = new URLSearchParams(new FormData(contactForm));
    const thankYouUrl = new URL('/thank-you/', window.location.origin).pathname;

    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, 30000);

    fetch('/__forms/contact', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData,
      signal: controller.signal
    })
      .then(function (response) {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error('Form submission failed');
        }
        return response.text();
      })
      .then(function () {
        window.location.href = thankYouUrl;
      })
      .catch(function (error) {
        clearTimeout(timeoutId);
        console.error(error);
        if (submitBtn) {
          submitBtn.setAttribute('aria-busy', 'false');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText || 'Submit';
        }
        if (responseMessage) {
          responseMessage.textContent = 'Sorry, there was an error sending your message. Please try again.';
        }
      });
  });
});
