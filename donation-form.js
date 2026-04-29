/**
 * BU Alumni Portal - Donation Form Handler
 * Connects donate.html to /api/register-donation endpoint
 */

(function() {
  'use strict';

  function init() {
    const form = document.getElementById('donation-form') || 
                 document.querySelector('form[action*="donate"]') ||
                 document.querySelector('form[data-form="donation"]') ||
                 document.querySelector('section#donation-form form');
    
    if (!form) {
      console.log('Donation form not found on this page');
      return;
    }

    form.addEventListener('submit', handleSubmit);
    console.log('✓ Donation form handler initialized');

    // Initialize amount presets
    initAmountPresets();
    // Initialize payment toggle
    initPaymentToggle();
  }

  function initAmountPresets() {
    const presetButtons = document.querySelectorAll('[data-amount]');
    const amountInput = document.querySelector('input[name="amount"]');

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        if (amountInput) {
          amountInput.value = amount;
        }
        // Highlight selected
        presetButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  function initPaymentToggle() {
    const paymentSelect = document.querySelector('select[name="paymentMethod"]');
    const momoSection = document.querySelector('.momo-section, [data-payment="momo"]');

    if (paymentSelect && momoSection) {
      paymentSelect.addEventListener('change', (e) => {
        const isMoMo = e.target.value.includes('momo') || 
                       e.target.value.includes('mobile') ||
                       e.target.value.includes('MTN') ||
                       e.target.value.includes('Airtel');
        momoSection.style.display = isMoMo ? 'block' : 'none';
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], .donate-btn');
    
    FormUtils.clearMessages(form);

    // Collect form data
    const formData = new FormData(form);
    const data = {
      fullName: formData.get('fullName') || formData.get('fullname') || formData.get('name'),
      email: formData.get('email'),
      amount: parseFloat(formData.get('amount')),
      currency: formData.get('currency') || 'UGX',
      paymentMethod: formData.get('paymentMethod') || formData.get('payment_method'),
      momoPhone: formData.get('momoPhone') || formData.get('momo_phone'),
      message: formData.get('message') || formData.get('notes'),
    };

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'amount', 'paymentMethod'];
    const missing = [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      FormUtils.showError(form, `Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    // Validate email
    if (!FormUtils.isValidEmail(data.email)) {
      FormUtils.showError(form, 'Please enter a valid email address');
      return;
    }

    // Validate amount
    if (isNaN(data.amount) || data.amount <= 0) {
      FormUtils.showError(form, 'Please enter a valid donation amount');
      return;
    }

    // Set loading
    if (submitBtn) {
      FormUtils.setLoading(submitBtn, true);
    }

    try {
      // If Mobile Money, process payment first
      if (data.paymentMethod.includes('momo') || data.paymentMethod.includes('mobile')) {
        const provider = data.paymentMethod.includes('MTN') ? 'mtn' : 'airtel';
        const momoResult = await BUAlumniAPI.momoPrompt(
          provider,
          data.momoPhone || data.phone,
          data.amount,
          data.currency,
          'BU-DONATION'
        );

        if (!momoResult.success) {
          FormUtils.showError(form, momoResult.error || 'Mobile Money payment failed. Please try again.');
          return;
        }
      }

      // Register donation
      const result = await BUAlumniAPI.registerDonation(data);

      if (result.success) {
        FormUtils.showSuccess(form, 
          `Thank you for your donation! ` +
          `Donation ID: ${result.data.donationId}. ` +
          (result.data.emailSent ? 'A receipt has been sent to your email.' : '')
        );

        // Clear form
        form.reset();

        // Show thank you modal or redirect
        setTimeout(() => {
          // Could show a thank you modal or redirect
          console.log('Donation ID:', result.data.donationId);
        }, 2000);
      } else {
        FormUtils.showError(form, result.error || 'Failed to process donation. Please try again.');
      }
    } catch (error) {
      console.error('Donation error:', error);
      FormUtils.showError(form, 'An unexpected error occurred. Please try again.');
    } finally {
      if (submitBtn) {
        FormUtils.setLoading(submitBtn, false);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
