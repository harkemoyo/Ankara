// assets/account-auth.js — Authentic Shopify-Style OTP Verification & Customer Portal

import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Views
  const stepEmailView = document.getElementById('auth-step-email');
  const stepCodeView = document.getElementById('auth-step-code');
  const portalView = document.getElementById('customer-portal-view');
  const headerLogoBox = document.getElementById('auth-header-logo-box');

  // Form Controls
  const googleBtn = document.getElementById('btn-google-login');
  const emailForm = document.getElementById('email-auth-form');
  const emailInput = document.getElementById('email-input');
  const sentEmailDisplay = document.getElementById('sent-email-display');
  const btnChangeEmail = document.getElementById('btn-change-email');
  const otpInputs = document.querySelectorAll('.otp__digit--input');
  const otpStatusMsg = document.getElementById('otp-status-msg');
  const btnLogout = document.getElementById('btn-logout');

  // Tab Views in Portal
  const navItems = document.querySelectorAll('.portal__nav--item');
  const tabOrders = document.getElementById('tab-content-orders');
  const tabProfile = document.getElementById('tab-content-profile');

  let currentEmail = '';

  // Check initial session
  const { data: { session } } = await supabase.auth.getSession();
  renderState(session);

  supabase.auth.onAuthStateChange((_event, newSession) => {
    renderState(newSession);
  });

  function renderState(currentSession) {
    if (currentSession && currentSession.user) {
      // Logged In -> Show Portal
      if (stepEmailView) stepEmailView.style.display = 'none';
      if (stepCodeView) stepCodeView.style.display = 'none';
      if (portalView) portalView.style.display = 'block';

      const email = currentSession.user.email || 'Customer';
      const name = currentSession.user.user_metadata?.full_name || email.split('@')[0];

      const userNameEl = document.getElementById('portal-user-name');
      const userEmailEl = document.getElementById('portal-user-email');
      if (userNameEl) userNameEl.textContent = `Welcome, ${name}`;
      if (userEmailEl) userEmailEl.textContent = email;
    } else {
      // Logged Out -> Show Email Form (or OTP form if in progress)
      if (portalView) portalView.style.display = 'none';
      if (!currentEmail && stepEmailView) {
        stepEmailView.style.display = 'flex';
        if (stepCodeView) stepCodeView.style.display = 'none';
      }
    }
  }

  // ── 1. Google OAuth ──────────────────────────────────────────────────────────
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href }
        });
        if (error) throw error;
      } catch (err) {
        alert('Google Sign-In Note: ' + err.message);
        googleBtn.disabled = false;
      }
    });
  }

  // ── 2. Submit Email -> Send 6-digit OTP Code ─────────────────────────────
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      currentEmail = emailInput.value.trim();
      if (!currentEmail) return;

      const submitBtn = emailForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        // Send OTP Code to user email via Supabase
        const { error } = await supabase.auth.signInWithOtp({
          email: currentEmail,
          options: { shouldCreateUser: true }
        });

        if (error && !error.message.includes('rate limit')) {
          console.warn('Supabase Auth OTP Note:', error.message);
        }

        // Switch View to Step 2: "Enter code"
        if (stepEmailView) stepEmailView.style.display = 'none';
        if (stepCodeView) stepCodeView.style.display = 'flex';
        if (sentEmailDisplay) sentEmailDisplay.textContent = currentEmail;

        // Focus first OTP box
        if (otpInputs.length > 0) {
          otpInputs[0].focus();
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // ── 3. Change Email Link ───────────────────────────────────────────────────
  if (btnChangeEmail) {
    btnChangeEmail.addEventListener('click', () => {
      currentEmail = '';
      if (stepCodeView) stepCodeView.style.display = 'none';
      if (stepEmailView) stepEmailView.style.display = 'flex';
      otpInputs.forEach(input => input.value = '');
    });
  }

  // ── 4. 6-Digit OTP Box Interactivity (Auto-Advance & Auto-Verify) ──────────
  otpInputs.forEach((input, idx) => {
    // Typing digit
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 1) {
        input.value = val.charAt(val.length - 1);
      }

      if (input.value && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }

      checkAndVerifyOTP();
    });

    // Keydown handling (Backspace)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        otpInputs[idx - 1].focus();
      }
    });

    // Paste full 6-digit code (e.g. 217023)
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pasteData)) {
        pasteData.split('').forEach((char, i) => {
          if (otpInputs[i]) otpInputs[i].value = char;
        });
        if (otpInputs[5]) otpInputs[5].focus();
        checkAndVerifyOTP();
      }
    });
  });

  async function checkAndVerifyOTP() {
    const code = Array.from(otpInputs).map(i => i.value).join('');
    if (code.length === 6) {
      if (otpStatusMsg) {
        otpStatusMsg.style.color = '#5b46e0';
        otpStatusMsg.textContent = 'Verifying code...';
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: currentEmail,
          token: code,
          type: 'email'
        });

        if (error) {
          // Fallback check for magic link token
          const { data: d2, error: e2 } = await supabase.auth.verifyOtp({
            email: currentEmail,
            token: code,
            type: 'magiclink'
          });
          if (e2) throw e2;
          renderState(d2.session);
        } else {
          renderState(data.session);
        }
      } catch (err) {
        if (otpStatusMsg) {
          otpStatusMsg.style.color = '#dc2626';
          otpStatusMsg.textContent = 'Invalid or expired code. Please check your email and try again.';
        }
      }
    }
  }

  // ── 5. Customer Portal Tabs (Orders / Profile) ──────────────────────────────
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const target = item.dataset.tab;
      if (target === 'orders') {
        if (tabOrders) tabOrders.style.display = 'block';
        if (tabProfile) tabProfile.style.display = 'none';
      } else if (target === 'profile') {
        if (tabOrders) tabOrders.style.display = 'none';
        if (tabProfile) tabProfile.style.display = 'block';
      }
    });
  });

  // ── 6. Sign Out ───────────────────────────────────────────────────────────
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabase.auth.signOut();
      currentEmail = '';
      renderState(null);
    });
  }
});
