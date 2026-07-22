// assets/account-auth.js — Client-side Google & Email Authentication Handler

import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
  const authContainer = document.getElementById('account-auth-container');
  const dashboardContainer = document.getElementById('account-dashboard-container');
  const googleBtn = document.getElementById('btn-google-login');
  const emailForm = document.getElementById('email-auth-form');
  const emailInput = document.getElementById('email-input');
  const emailMsg = document.getElementById('email-status-msg');
  const logoutBtn = document.getElementById('btn-logout');

  // Check current auth session
  const { data: { session } } = await supabase.auth.getSession();

  function renderState(currentSession) {
    if (currentSession && currentSession.user) {
      // User is logged in -> show Dashboard
      if (authContainer) authContainer.style.display = 'none';
      if (dashboardContainer) dashboardContainer.style.display = 'block';

      const userEmailEl = document.getElementById('dashboard-user-email');
      const userGreetingEl = document.getElementById('dashboard-user-name');
      const email = currentSession.user.email || 'Member';
      const name = currentSession.user.user_metadata?.full_name || email.split('@')[0];

      if (userGreetingEl) userGreetingEl.textContent = `Welcome, ${name}`;
      if (userEmailEl) userEmailEl.textContent = email;
    } else {
      // User is logged out -> show Sign In form
      if (authContainer) authContainer.style.display = 'block';
      if (dashboardContainer) dashboardContainer.style.display = 'none';
    }
  }

  // Initial render
  renderState(session);

  // Listen for auth state changes (e.g. after OAuth redirect)
  supabase.auth.onAuthStateChange((_event, newSession) => {
    renderState(newSession);
  });

  // 1. Google OAuth Login
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<span>Connecting to Google...</span>`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.href
          }
        });
        if (error) throw error;
      } catch (err) {
        alert('Google Sign-In Error: ' + err.message);
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <span class="google__icon--bg">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.389 0 2.27 2.062.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
          </span>
          <span>Continue with Google</span>`;
      }
    });
  }

  // 2. Email Magic Link Login
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) return;

      if (emailMsg) {
        emailMsg.style.display = 'block';
        emailMsg.style.color = '#5b46e0';
        emailMsg.textContent = 'Sending sign-in link to your email...';
      }

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: window.location.href
          }
        });

        if (error) throw error;

        if (emailMsg) {
          emailMsg.style.color = '#059669';
          emailMsg.textContent = '✓ Check your email inbox! We sent you a magic login link.';
        }
        emailForm.reset();
      } catch (err) {
        if (emailMsg) {
          emailMsg.style.color = '#dc2626';
          emailMsg.textContent = 'Error: ' + err.message;
        }
      }
    });
  }

  // 3. Sign Out
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      renderState(null);
    });
  }
});
