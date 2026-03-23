export default function AuthScreen(props) {
  const {
    brandLogoUrl,
    publicHealthSummary,
    isVerifyMode,
    isRegisterMode,
    authMode,
    authLoading,
    notice,
    noticeKind,
    googleLoginEnabled,
    authForm,
    pendingVerificationEmail,
    onSwitchMode,
    onGoogleLogin,
    onSubmit,
    onReadValue,
    onResendVerificationCode,
  } = props;

  return (
    <section class="auth-layout reveal-up">
      <div class="auth-hero glass-panel">
        <div class="brand-stack">
          <div class="logo-wrap logo-wrap-large">
            <div class="logo-glow" />
            <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
          </div>
          <div>
            <p class="eyebrow">ClaudyGod Ministries</p>
            <h1>Content Studio</h1>
            <p class="subtitle">
              Secure publisher access for uploading, reviewing, and releasing ministry content.
            </p>
          </div>
        </div>

        <div class="auth-status-grid">
          <article class="auth-status-card">
            <span class="auth-status-label">Secure access</span>
            <strong>Protected sign-in</strong>
            <p>Your account stays protected while you upload, review, and manage ministry content.</p>
          </article>
          <article class="auth-status-card">
            <span class="auth-status-label">Verification</span>
            <strong>{isVerifyMode ? 'Email code required' : 'Secure account setup'}</strong>
            <p>{isVerifyMode ? 'Enter the code sent to your email to finish creating the account.' : 'Create an account once, then return anytime to manage your content.'}</p>
          </article>
          <article class="auth-status-card">
            <span class="auth-status-label">Studio access</span>
            <strong>{isVerifyMode ? 'Almost ready' : 'Ready to manage content'}</strong>
            <p>
              {isVerifyMode
                ? 'Confirm the code to open the studio and continue into your dashboard.'
                : 'Upload content, review the library, and preview the mobile app from one place.'}
            </p>
          </article>
        </div>
      </div>

      <div class="auth-form-card glass-panel reveal-up" style={{ animationDelay: '120ms' }}>
        <div class="form-header-row">
          <div class="logo-wrap">
            <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
          </div>
          <div>
            <h2>{isVerifyMode ? 'Verify Email' : isRegisterMode ? 'Create Account' : 'Sign In'}</h2>
            <p class="subtle-text">
              {isVerifyMode
                ? 'Confirm your 6-digit code to activate the account and open the dashboard.'
                : isRegisterMode
                  ? 'Create your account to manage and publish content.'
                  : 'Enter your account details to continue.'}
            </p>
          </div>
        </div>

        <div class="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            class={['auth-mode-btn', authMode === 'login' ? 'is-active' : '']}
            onClick={() => onSwitchMode('login')}
            disabled={authLoading}
          >
            Sign In
          </button>
          <button
            type="button"
            class={['auth-mode-btn', isRegisterMode || isVerifyMode ? 'is-active' : '']}
            onClick={() => onSwitchMode('register')}
            disabled={authLoading}
          >
            Create Account
          </button>
        </div>

        {notice ? <div class={['notice', noticeKind === 'error' ? 'notice-error' : 'notice-success']}>{notice}</div> : null}

        <div class={['auth-runtime-pill', 'success']}>
          <span class="auth-runtime-dot" />
          <span>{publicHealthSummary}</span>
        </div>

        {googleLoginEnabled && !isVerifyMode ? (
          <div class="social-auth-block">
            <button
              type="button"
              class="google-btn"
              onClick={onGoogleLogin}
              disabled={authLoading}
            >
              Continue with Google
            </button>
          </div>
        ) : null}

        <form class="stack-form" onSubmit={(event) => void onSubmit(event)}>
          {isRegisterMode ? (
            <label class="auth-field">
              <span class="field-label-row">
                <span>Username</span>
                <span
                  class="field-tooltip"
                  data-tooltip="Your public publishing identity for uploads, content credits, and dashboard activity."
                  tabIndex={0}
                  role="note"
                  aria-label="Username help"
                >
                  i
                </span>
              </span>
              <input
                class="auth-input"
                value={authForm.username}
                onInput={(event) => { authForm.username = onReadValue(event); }}
                placeholder="claudy_member"
                autoComplete="nickname"
              />
              <small class="field-note">This name helps identify your uploads and activity inside the studio.</small>
            </label>
          ) : null}

          <label class="auth-field">
            <span class="field-label-row">
              <span>Email address</span>
              <span
                class="field-tooltip"
                data-tooltip="This email is used for sign-in, verification, password recovery, and account security notices."
                tabIndex={0}
                role="note"
                aria-label="Email help"
              >
                i
              </span>
            </span>
            <input
              class="auth-input"
              type="email"
              value={authForm.email}
              onInput={(event) => { authForm.email = onReadValue(event); }}
              placeholder={isVerifyMode ? 'Enter the same email used during signup' : 'name@company.com'}
              autoComplete={isVerifyMode ? 'username' : 'email'}
            />
          </label>

          {isVerifyMode ? (
            <label class="auth-field">
              <span class="field-label-row">
                <span>Verification code</span>
                <span
                  class="field-tooltip"
                  data-tooltip="Use the 6-digit code that was sent to the email address above."
                  tabIndex={0}
                  role="note"
                  aria-label="Verification code help"
                >
                  i
                </span>
              </span>
              <input
                class="auth-input"
                value={authForm.verificationCode}
                onInput={(event) => { authForm.verificationCode = onReadValue(event).replace(/\D/g, '').slice(0, 6); }}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <small class="field-note">Check your inbox for the 6-digit code. You can resend it if needed.</small>
            </label>
          ) : (
            <label class="auth-field">
              <span class="field-label-row">
                <span>Password</span>
                <span
                  class="field-tooltip"
                  data-tooltip="Use at least 8 characters with uppercase, lowercase, and a number."
                  tabIndex={0}
                  role="note"
                  aria-label="Password help"
                >
                  i
                </span>
              </span>
              <input
                class="auth-input"
                type="password"
                value={authForm.password}
                onInput={(event) => { authForm.password = onReadValue(event); }}
                placeholder={isRegisterMode ? 'Create a strong password' : 'Enter your password'}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
            </label>
          )}

          {isRegisterMode ? (
            <label class="auth-field">
              <span class="field-label-row">
                <span>Confirm password</span>
                <span
                  class="field-tooltip"
                  data-tooltip="Repeat the password exactly to complete account creation."
                  tabIndex={0}
                  role="note"
                  aria-label="Confirm password help"
                >
                  i
                </span>
              </span>
              <input
                class="auth-input"
                type="password"
                value={authForm.confirmPassword}
                onInput={(event) => { authForm.confirmPassword = onReadValue(event); }}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </label>
          ) : null}

          <button type="submit" class="primary-btn primary-btn-large" disabled={authLoading}>
            {authLoading
              ? (isVerifyMode ? 'Verifying...' : isRegisterMode ? 'Creating account...' : 'Signing in...')
              : (isVerifyMode ? 'Verify Email' : isRegisterMode ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {isVerifyMode ? (
          <div class="button-row compact-row">
            <button type="button" class="ghost-btn compact" onClick={() => void onResendVerificationCode()} disabled={authLoading}>
              Resend Code
            </button>
            <button type="button" class="ghost-btn compact" onClick={() => onSwitchMode('login')} disabled={authLoading}>
              Back to Sign In
            </button>
          </div>
        ) : null}

        <p class="footnote-text">
          {isVerifyMode
            ? `We only activate the account after the email code is confirmed.${pendingVerificationEmail ? ` Code destination: ${pendingVerificationEmail}.` : ''}`
            : isRegisterMode
              ? 'Use one username, one email address, and one password to create your publisher account.'
              : 'Sign in with your existing publisher account.'}
        </p>
      </div>
    </section>
  );
}
