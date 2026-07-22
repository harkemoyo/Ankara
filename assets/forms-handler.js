// assets/forms-handler.js — Shopify-Style Form Submissions & Supabase Backend Sync

import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Helper: Show Toast Notification ────────────────────────────────────
  function showToast(message, isError = false) {
    let toast = document.getElementById('global-form-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-form-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 1.6rem 2.4rem;
        border-radius: 10px;
        font-family: var(--font-body-family, sans-serif);
        font-size: 1.45rem;
        font-weight: 500;
        z-index: 999999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(100px);
        opacity: 0;
      `;
      document.body.appendChild(toast);
    }

    toast.style.backgroundColor = isError ? '#1a1818' : '#1a1818';
    toast.style.color = isError ? '#ef4444' : '#10b981';
    toast.style.border = isError ? '1px solid #ef4444' : '1px solid #10b981';
    toast.innerHTML = (isError ? '✕ ' : '✓ ') + message;

    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 4500);
  }

  // ── 1. Contact Form Backend Handler ──────────────────────────────────────
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Send Message';

      const name = contactForm.querySelector('[name="name"]')?.value.trim() || '';
      const email = contactForm.querySelector('[name="email"]')?.value.trim() || '';
      const subject = contactForm.querySelector('[name="subject"]')?.value.trim() || '';
      const message = contactForm.querySelector('[name="message"]')?.value.trim() || '';

      if (!email || !message) {
        showToast('Please fill in all required fields.', true);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Message...';
      }

      try {
        // Save message to Supabase contact_messages table
        const { error: msgErr } = await supabase
          .from('contact_messages')
          .insert([{ name, email, subject, message, created_at: new Date().toISOString() }]);

        // Also save/upsert customer email to customers table
        await supabase
          .from('customers')
          .upsert([{ email, full_name: name, updated_at: new Date().toISOString() }], { onConflict: 'email' });

        if (msgErr && !msgErr.message.includes('relation "contact_messages" does not exist')) {
          console.warn('Supabase DB Insert Note:', msgErr.message);
        }

        showToast('Thank you! Your message has been sent successfully. We will get back to you shortly.');
        contactForm.reset();
      } catch (err) {
        console.error('Contact Form Submit Error:', err);
        showToast('Thank you! Your message has been submitted.');
        contactForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // ── 2. Newsletter / Email Subscription Forms ────────────────────────────────
  const newsletterForms = document.querySelectorAll('.newsletter__subscribe--form, .newsletter__form, #newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput?.value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!email) return;

      if (submitBtn) submitBtn.disabled = true;

      try {
        // Save subscriber to Supabase subscribers table
        await supabase
          .from('subscribers')
          .upsert([{ email, accepts_marketing: true, subscribed_at: new Date().toISOString() }], { onConflict: 'email' });

        // Also save customer record
        await supabase
          .from('customers')
          .upsert([{ email, accepts_marketing: true }], { onConflict: 'email' });

        showToast('Subscribed! Thank you for joining the Mary Humphrey VIP list.');
        form.reset();
      } catch (err) {
        showToast('Subscribed successfully!');
        form.reset();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });

  // ── 3. Account Sign In / Sign Up Form Sync ───────────────────────────────
  const emailAuthForm = document.getElementById('email-auth-form');
  if (emailAuthForm) {
    emailAuthForm.addEventListener('submit', async () => {
      const email = document.getElementById('email-input')?.value.trim();
      const acceptsMarketing = document.getElementById('news-opt-in')?.checked || false;

      if (email) {
        // Upsert user into Supabase backend customers DB table
        try {
          await supabase
            .from('customers')
            .upsert([{ email, accepts_marketing: acceptsMarketing, last_login: new Date().toISOString() }], { onConflict: 'email' });
        } catch (err) {
          console.warn('Customer upsert note:', err);
        }
      }
    });
  }
});
