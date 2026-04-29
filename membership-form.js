/**
 * BU Alumni Portal - Membership Registration Form Handler
 * Connects auth.html to /api/register-member endpoint
 */

(function() {
  'use strict';

  function init() {
    // Look for membership form
    const form = document.getElementById('membership-form') || 
                 document.querySelector('form[action*="member"]') ||
                 document.querySelector('form[data-form="membership"]') ||
                 document.querySelector('.payment-section form');
    
    if (!form) {
      console.log('Membership form not found on this page');
      return;
    }

    form.addEventListener('submit', handleSubmit);
    console.log('✓ Membership form handler initialized');

    // Initialize payment method toggle
    initPaymentToggle();
  }

  function initPaymentToggle() {
    const paymentSelect = document.querySelector('select[name="paymentMethod"], select[name="payment_method"]');
    const momoSection = document.querySelector('.momo-phone-section, [data-payment="momo"]');

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
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], .btn-primary');
    
    FormUtils.clearMessages(form);

    // Collect form data
    const formData = new FormData(form);
    const data = {
      fullName: formData.get('fullName') || formData.get('fullname') || formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || formData.get('phoneNumber'),
      profession: formData.get('profession'),
      location: formData.get('location') || formData.get('address'),
      membershipType: formData.get('membershipType') || formData.get('membership_type') || 'Standard',
      paymentMethod: formData.get('paymentMethod') || formData.get('payment_method'),
      momoPhone: formData.get('momoPhone') || formData.get('momo_phone') || formData.get('phone'),
    };

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'profession'];
    const missing = [];
    
    for (const field of requiredFields) {
      if (!data[field] || !data[field].trim()) {
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

    // Validate phone
    if (!FormUtils.isValidUgandaPhone(data.phone)) {
      FormUtils.showError(form, 'Please enter a valid Uganda phone number (e.g., 07XX XXX XXX)');
      return;
    }

    // Set loading
    if (submitBtn) {
      FormUtils.setLoading(submitBtn, true);
    }

    try {
      const result = await BUAlumniAPI.registerMember(data);

      if (result.success) {
        FormUtils.showSuccess(form, 
          `Membership registered successfully! ` +
          `Your Member ID: ${result.data.memberId}. ` +
          (result.data.emailSent ? 'A confirmation email has been sent.' : '')
        );

        // Show success modal or redirect
        setTimeout(() => {
          // Option 1: Show receipt/download
          if (result.data.memberId) {
            // Could show a receipt modal here
            console.log('Member ID:', result.data.memberId);
          }
          
          // Option 2: Redirect to success page or home
          // window.location.href = 'membership-success.html?id=' + result.data.memberId;
        }, 2000);
      } else {
        FormUtils.showError(form, result.error || 'Failed to register membership. Please try again.');
      }
    } catch (error) {
      console.error('Membership registration error:', error);
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
