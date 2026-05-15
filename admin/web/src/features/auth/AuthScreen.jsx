import '../../app/AdminShell.css';
import './AuthScreen.css';

const passwordRules = (password) => [
  { id: 'length', label: '8 or more characters', valid: password.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
  { id: 'lower', label: 'Lowercase letter', valid: /[a-z]/.test(password) },
  { id: 'number', label: 'Number', valid: /\d/.test(password) },
  { id: 'symbol', label: 'Symbol for extra protection', valid: /[^A-Za-z0-9]/.test(password) },
];

const getPasswordReport = (password) => {
  const checks = passwordRules(password);
  const score = checks.filter((check) => check.valid).length;
  const label = score >= 5 ? 'Excellent' : score >= 4 ? 'Strong' : score >= 3 ? 'Fair' : 'Needs work';
  return { checks, label, score, percent: Math.max(12, Math.round((score / checks.length) * 100)) };
};

const secureIndex = (length) => {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] % length;
  }
  return Math.floor(Math.random() * length);
};

const generatePasswordSuggestion = () => {
  const words = ['Grace', 'Signal', 'Anchor', 'Crown', 'Harbor', 'Studio', 'Cedar', 'Summit'];
  const symbols = ['!', '#', '%', '?', '@'];
  const number = 1000 + secureIndex(9000);
  return `${words[secureIndex(words.length)]}${words[secureIndex(words.length)]}${symbols[secureIndex(symbols.length)]}${number}`;
};

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 10.7a2.1 2.1 0 0 0 2.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.4 7.7C5.6 8.7 4.1 10.2 3 12c2.2 3.5 5.2 5.2 9 5.2 1.4 0 2.7-.2 3.8-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.2 6.9c.6-.1 1.2-.1 1.8-.1 3.8 0 6.8 1.7 9 5.2-.6.9-1.3 1.8-2.1 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M3 12c2.2-3.5 5.2-5.2 9-5.2s6.8 1.7 9 5.2c-2.2 3.5-5.2 5.2-9 5.2S5.2 15.5 3 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function AuthIcon({ name }) {
  if (name === 'home') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M4 10.8 12 4l8 6.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2v-8.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9.4 21v-6.2h5.2V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'upload') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M12 15V4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="m7.5 8.5 4.5-4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 15v3.2A1.8 1.8 0 0 0 6.8 20h10.4a1.8 1.8 0 0 0 1.8-1.8V15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'review') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M7 12.2 10.2 15 17 8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.8 4h12.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.2V5.8A1.8 1.8 0 0 1 5.8 4Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 8h5M9.5 12h5M9.5 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WorkflowSteps() {
  return (
    <section class="cg-auth-steps-panel" aria-label="Publishing workflow">
      <div class="cg-progress-steps cg-auth-progress-steps">
        <div class="cg-step">
          <span class="cg-step-icon"><AuthIcon name="upload" /></span>
          <div>
            <strong>Upload clearly</strong>
            <p class="cg-muted">Add title, description, media, thumbnail, and target sections in one controlled flow.</p>
          </div>
        </div>
        <div class="cg-step">
          <span class="cg-step-icon"><AuthIcon name="review" /></span>
          <div>
            <strong>Review safely</strong>
            <p class="cg-muted">Draft, correct, approve, and publish without hidden or confusing steps.</p>
          </div>
        </div>
        <div class="cg-step">
          <span class="cg-step-icon"><AuthIcon name="preview" /></span>
          <div>
            <strong>Preview mobile</strong>
            <p class="cg-muted">Confirm how published content appears before users see the next release.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

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
    hidePassword,
    hideConfirmPassword,
    authForm,
    pendingVerificationEmail,
    onSwitchMode,
    onGoogleLogin,
    onTogglePassword,
    onToggleConfirmPassword,
    showPublicHome,
    onShowPublicHome,
    onShowAuth,
    onSubmit,
    onReadValue,
    onResendVerificationCode,
    onDismissNotice,
  } = props;
  const passwordReport = getPasswordReport(authForm.password || '');

  const applySuggestedPassword = () => {
    const suggestedPassword = generatePasswordSuggestion();
    authForm.password = suggestedPassword;
    authForm.confirmPassword = suggestedPassword;
    if (hidePassword) {
      onTogglePassword();
    }
    if (hideConfirmPassword) {
      onToggleConfirmPassword();
    }
  };

  const pageTitle = isVerifyMode ? 'Verify your account' : isRegisterMode ? 'Create publisher access' : 'Sign in to Admin Studio';
  const pageCopy = isVerifyMode
    ? 'Enter the verification code sent to your email to open the publishing workspace.'
    : isRegisterMode
      ? 'Create a secure publisher profile for uploading, correcting, and releasing content.'
      : 'Use your approved account to manage content, mobile app structure, live sessions, and publishing.';

  const formAutocompleteMode = isRegisterMode || isVerifyMode ? 'off' : 'new-password';

  if (showPublicHome) {
    return (
      <section class="cg-auth-root">
        <div class="cg-auth-grid cg-auth-grid-home">
          <article class="cg-panel cg-auth-hero cg-auth-home-panel">
            <div class="cg-logo-box" style={{ width: '70px', height: '70px', borderRadius: '24px' }}>
              <img src={brandLogoUrl} alt="ClaudyGod" style={{ width: '46px', height: '46px' }} />
            </div>

            <div class="cg-auth-hero-intro">
              <p class="cg-kicker">ClaudyGod Ministries</p>
              <h1 class="cg-auth-title">Professional publishing control for every release.</h1>
              <p class="cg-hero-copy">
                Manage music, videos, live sessions, mobile placements, and publishing reviews from one secure studio built for clear client handoff.
              </p>
            </div>

            <div class="cg-auth-home-actions">
              <button type="button" class="cg-primary" onClick={onShowAuth}>Sign in</button>
              <button type="button" class="cg-secondary" onClick={() => { onSwitchMode('register'); onShowAuth(); }}>Create account</button>
            </div>
          </article>

          <WorkflowSteps />
        </div>
      </section>
    );
  }

  return (
    <section class="cg-auth-root">
      <div class="cg-auth-grid cg-auth-grid-form">
        <article class="cg-panel cg-auth-form">
          <div class="cg-auth-form-nav">
            <button type="button" class="cg-ghost compact cg-icon-btn" onClick={onShowPublicHome}>
              <AuthIcon name="home" />
              <span>Home</span>
            </button>
          </div>

          <div class="cg-section-head">
            <div>
              <p class="cg-kicker">Admin Access</p>
              <h2 class="cg-auth-form-title">{pageTitle}</h2>
              <p class="cg-copy" style={{ marginTop: '8px' }}>{pageCopy}</p>
            </div>
          </div>

          <div class="cg-auth-mode" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              class={authMode === 'login' ? 'is-active' : ''}
              onClick={() => onSwitchMode('login')}
              disabled={authLoading}
            >
              Sign in
            </button>
            <button
              type="button"
              class={isRegisterMode || isVerifyMode ? 'is-active' : ''}
              onClick={() => onSwitchMode('register')}
              disabled={authLoading}
            >
              Create account
            </button>
          </div>

          <div class="cg-stack" style={{ marginTop: '16px' }}>
            <span class="cg-chip is-success">{publicHealthSummary}</span>

            {googleLoginEnabled && !isVerifyMode ? (
              <button type="button" class="cg-secondary" onClick={onGoogleLogin} disabled={authLoading}>
                Continue with Google
              </button>
            ) : null}

            <form class="cg-form cg-auth-clean-form" autoComplete="off" onSubmit={(event) => void onSubmit(event)}>
              <input class="cg-autofill-decoy" type="text" name="cg_admin_decoy_email" autoComplete="username" tabIndex={-1} aria-hidden="true" />
              <input class="cg-autofill-decoy" type="password" name="cg_admin_decoy_password" autoComplete="new-password" tabIndex={-1} aria-hidden="true" />

              {isRegisterMode ? (
                <label>
                  <span>Username</span>
                  <input
                    value={authForm.username || ''}
                    onInput={(event) => { authForm.username = onReadValue(event); }}
                    placeholder="publisher_name"
                    name="cg_admin_publisher_name"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <small>This name appears in internal publishing activity and content ownership.</small>
                </label>
              ) : null}

              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={authForm.email || ''}
                  onInput={(event) => { authForm.email = onReadValue(event); }}
                  placeholder={isVerifyMode ? 'Email used during signup' : 'name@example.com'}
                  name={`cg_admin_email_${authMode}`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </label>

              {isVerifyMode ? (
                <label>
                  <span>Verification code</span>
                  <input
                    value={authForm.verificationCode || ''}
                    onInput={(event) => { authForm.verificationCode = onReadValue(event).replace(/\D/g, '').slice(0, 6); }}
                    placeholder="123456"
                    inputMode="numeric"
                    name="cg_admin_verification_code"
                    autoComplete="one-time-code"
                  />
                  <small>{pendingVerificationEmail ? `Code destination: ${pendingVerificationEmail}` : 'Use the newest 6-digit code sent to your email.'}</small>
                </label>
              ) : (
                <label>
                  <span>Password</span>
                  <div class="cg-password-field">
                    <input
                      type={hidePassword ? 'password' : 'text'}
                      value={authForm.password || ''}
                      onInput={(event) => { authForm.password = onReadValue(event); }}
                      placeholder={isRegisterMode ? 'Create a secure password' : 'Enter your password'}
                      name={`cg_admin_password_${authMode}`}
                      autoComplete={formAutocompleteMode}
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      class="cg-password-toggle"
                      onClick={onTogglePassword}
                      aria-label={hidePassword ? 'Show password' : 'Hide password'}
                    >
                      <EyeIcon hidden={hidePassword} />
                    </button>
                  </div>
                  {isRegisterMode ? (
                    <div class="cg-password-strength" aria-live="polite">
                      <div class="cg-password-strength-head">
                        <strong>{passwordReport.label} password</strong>
                        <button type="button" class="cg-inline-action" onClick={applySuggestedPassword}>
                          Suggest secure password
                        </button>
                      </div>
                      <div class="cg-password-meter" aria-hidden="true">
                        <span style={{ width: `${passwordReport.percent}%` }} />
                      </div>
                      <div class="cg-password-checks">
                        {passwordReport.checks.map((check) => (
                          <span key={check.id} class={check.valid ? 'is-valid' : ''}>
                            {check.valid ? 'OK' : '-'} {check.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </label>
              )}

              {isRegisterMode ? (
                <label>
                  <span>Confirm password</span>
                  <div class="cg-password-field">
                    <input
                      type={hideConfirmPassword ? 'password' : 'text'}
                      value={authForm.confirmPassword || ''}
                      onInput={(event) => { authForm.confirmPassword = onReadValue(event); }}
                      placeholder="Repeat password"
                      name="cg_admin_confirm_password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      class="cg-password-toggle"
                      onClick={onToggleConfirmPassword}
                      aria-label={hideConfirmPassword ? 'Show password confirmation' : 'Hide password confirmation'}
                    >
                      <EyeIcon hidden={hideConfirmPassword} />
                    </button>
                  </div>
                </label>
              ) : null}

              <button type="submit" class="cg-primary" disabled={authLoading}>
                {authLoading
                  ? isVerifyMode
                    ? 'Verifying...'
                    : isRegisterMode
                      ? 'Creating account...'
                      : 'Signing in...'
                  : isVerifyMode
                    ? 'Verify email'
                    : isRegisterMode
                      ? 'Create account'
                      : 'Sign in'}
              </button>
            </form>

            {isVerifyMode ? (
              <div class="cg-button-row">
                <button type="button" class="cg-secondary compact" onClick={() => void onResendVerificationCode()} disabled={authLoading}>
                  Resend code
                </button>
                <button type="button" class="cg-ghost compact" onClick={() => onSwitchMode('login')} disabled={authLoading}>
                  Back to sign in
                </button>
              </div>
            ) : null}
          </div>
        </article>

        <WorkflowSteps />
      </div>

      {notice ? (
        <div class="cg-admin-modal-backdrop" role="presentation" onClick={() => onDismissNotice && onDismissNotice()}>
          <div class={['cg-admin-modal', noticeKind === 'error' ? 'is-error' : '']} role="dialog" aria-modal="true" aria-live="polite" onClick={(event) => event.stopPropagation()}>
            <div class="cg-admin-modal-icon">{noticeKind === 'error' ? '!' : 'OK'}</div>
            <div>
              <h3>{noticeKind === 'error' ? 'Action needed' : 'Confirmed'}</h3>
              <p>{notice}</p>
            </div>
            <button type="button" class="cg-admin-modal-close" aria-label="Close notice" onClick={() => onDismissNotice && onDismissNotice()}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
