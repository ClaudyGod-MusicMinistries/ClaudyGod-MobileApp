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

function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 10.8 12 4l8 6.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2v-8.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.4 21v-6.2h5.2V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.23c0-.74-.07-1.28-.2-1.85H12v3.36h5.52c-.11.84-.71 2.1-2.04 2.95l-.02.12 2.96 2.08.2.02c1.84-1.55 2.98-3.84 2.98-6.66Z" />
      <path fill="currentColor" d="M12 21c2.63 0 4.84-.79 6.45-2.15l-3.07-2.16c-.82.52-1.92.88-3.38.88-2.57 0-4.75-1.55-5.52-3.7l-.12.01-3.08 2.17-.04.1C4.84 19.02 8.14 21 12 21Z" opacity="0.78" />
      <path fill="currentColor" d="M6.48 13.87A5.18 5.18 0 0 1 6.2 12c0-.65.1-1.28.27-1.87l-.01-.13-3.12-2.2-.1.04A8.25 8.25 0 0 0 2.4 12c0 1.5.39 2.9 1.08 4.1l3-2.23Z" opacity="0.56" />
      <path fill="currentColor" d="M12 6.43c1.83 0 3.06.72 3.76 1.32l2.75-2.44C16.82 3.88 14.63 3 12 3 8.14 3 4.84 4.98 3.24 7.84l3.24 2.29c.77-2.15 2.95-3.7 5.52-3.7Z" opacity="0.9" />
    </svg>
  );
}

function WorkflowIcon({ type }) {
  const paths = {
    upload: 'M12 16V4m0 0 4.4 4.4M12 4 7.6 8.4M5 16.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5',
    review: 'M5 12.3 9.2 16.5 19 6.8M4.5 5.5h9M4.5 19.5h15',
    preview: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-11A2.5 2.5 0 0 1 4 13.5v-7ZM9 20h6m-3-4v4',
  };

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function unlockAutofillGuard(event) {
  event.currentTarget.removeAttribute('readonly');
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
    if (hidePassword) onTogglePassword();
    if (hideConfirmPassword) onToggleConfirmPassword();
  };

  const pageTitle = isVerifyMode ? 'Verify your account' : isRegisterMode ? 'Create publisher access' : 'Sign in to Admin Studio';
  const pageCopy = isVerifyMode
    ? 'Enter the verification code sent to your email to open the publishing workspace.'
    : isRegisterMode
      ? 'Create a secure publisher profile for uploading, correcting, and releasing content.'
      : 'Use your approved account to manage content, mobile app structure, live sessions, and publishing.';

  const workflowSteps = [
    { id: 'upload', title: 'Upload clearly', copy: 'Add title, description, media, thumbnail, and target sections in one guided flow.' },
    { id: 'review', title: 'Review safely', copy: 'Draft, correct, approve, and publish with clear status and audit history.' },
    { id: 'preview', title: 'Preview mobile', copy: 'Confirm how content appears before it reaches mobile, tablet, TV, and web users.' },
  ];

  if (showPublicHome) {
    return (
      <section class="cg-auth-root cg-auth-root-polished">
        <div class="cg-auth-grid cg-auth-grid-home cg-auth-grid-polished">
          <article class="cg-panel cg-auth-hero cg-auth-home-panel cg-auth-home-polished">
            <div class="cg-logo-box cg-auth-logo-large">
              <img src={brandLogoUrl} alt="ClaudyGod" />
            </div>

            <div class="cg-auth-hero-intro">
              <p class="cg-kicker">ClaudyGod Ministries</p>
              <h1 class="cg-auth-title">Professional publishing control for every release.</h1>
              <p class="cg-hero-copy">
                Upload, review, publish, and monitor the mobile app experience from one secure admin studio built for production operations.
              </p>
            </div>

            <div class="cg-auth-home-actions">
              <button type="button" class="cg-primary" onClick={onShowAuth}>Sign in</button>
              <button type="button" class="cg-secondary" onClick={() => { onSwitchMode('register'); onShowAuth(); }}>Create account</button>
            </div>
          </article>

          <section class="cg-auth-steps-panel cg-auth-steps-panel-polished" aria-label="Publishing workflow">
            <div class="cg-progress-steps cg-progress-steps-polished">
              {workflowSteps.map((step) => (
                <div class="cg-step cg-step-polished" key={step.id}>
                  <span class="cg-step-icon"><WorkflowIcon type={step.id} /></span>
                  <div>
                    <strong>{step.title}</strong>
                    <p class="cg-muted">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section class="cg-auth-root cg-auth-root-polished">
      <div class="cg-auth-grid cg-auth-grid-form cg-auth-grid-polished">
        <article class="cg-panel cg-auth-form cg-auth-form-polished">
          <div class="cg-auth-form-nav">
            <button type="button" class="cg-ghost compact cg-icon-button" onClick={onShowPublicHome}>
              <HomeIcon />
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
            <button type="button" class={authMode === 'login' ? 'is-active' : ''} onClick={() => onSwitchMode('login')} disabled={authLoading}>Sign in</button>
            <button type="button" class={isRegisterMode || isVerifyMode ? 'is-active' : ''} onClick={() => onSwitchMode('register')} disabled={authLoading}>Create account</button>
          </div>

          <div class="cg-stack" style={{ marginTop: '16px' }}>
            <span class="cg-chip is-success">{publicHealthSummary}</span>

            {googleLoginEnabled && !isVerifyMode ? (
              <button type="button" class="cg-secondary cg-icon-button cg-google-button" onClick={onGoogleLogin} disabled={authLoading}>
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            ) : null}

            <form class="cg-form cg-auth-clean-form" onSubmit={(event) => void onSubmit(event)} autoComplete="off">
              {isRegisterMode ? (
                <label>
                  <span>Username</span>
                  <input
                    value={authForm.username}
                    onInput={(event) => { authForm.username = onReadValue(event); }}
                    placeholder="publisher_name"
                    autoComplete="off"
                    name="cg_admin_new_publisher_name"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <small>This name appears in internal publishing activity and content ownership.</small>
                </label>
              ) : null}

              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={authForm.email}
                  onInput={(event) => { authForm.email = onReadValue(event); }}
                  placeholder={isVerifyMode ? 'Email used during signup' : 'name@example.com'}
                  autoComplete="off"
                  name={isVerifyMode ? 'cg_admin_verify_email' : 'cg_admin_user_identifier'}
                  inputMode="email"
                  spellCheck="false"
                  autoCorrect="off"
                  readOnly
                  onFocus={unlockAutofillGuard}
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </label>

              {isVerifyMode ? (
                <label>
                  <span>Verification code</span>
                  <input
                    value={authForm.verificationCode}
                    onInput={(event) => { authForm.verificationCode = onReadValue(event).replace(/\D/g, '').slice(0, 6); }}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    name="cg_admin_verification_code"
                  />
                  <small>{pendingVerificationEmail ? `Code destination: ${pendingVerificationEmail}` : 'Use the newest 6-digit code sent to your email.'}</small>
                </label>
              ) : (
                <label>
                  <span>Password</span>
                  <div class="cg-password-field">
                    <input
                      type={hidePassword ? 'password' : 'text'}
                      value={authForm.password}
                      onInput={(event) => { authForm.password = onReadValue(event); }}
                      placeholder={isRegisterMode ? 'Create a secure password' : 'Enter your password'}
                      autoComplete="off"
                      name={isRegisterMode ? 'cg_admin_new_secret' : 'cg_admin_access_phrase'}
                      readOnly
                      onFocus={unlockAutofillGuard}
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                    <button type="button" class="cg-password-toggle" onClick={onTogglePassword} aria-label={hidePassword ? 'Show password' : 'Hide password'}>
                      <EyeIcon hidden={hidePassword} />
                    </button>
                  </div>
                  {isRegisterMode ? (
                    <div class="cg-password-strength" aria-live="polite">
                      <div class="cg-password-strength-head">
                        <strong>{passwordReport.label} password</strong>
                        <button type="button" class="cg-inline-action" onClick={applySuggestedPassword}>Suggest secure password</button>
                      </div>
                      <div class="cg-password-meter" aria-hidden="true"><span style={{ width: `${passwordReport.percent}%` }} /></div>
                      <div class="cg-password-checks">
                        {passwordReport.checks.map((check) => (
                          <span key={check.id} class={check.valid ? 'is-valid' : ''}>{check.valid ? '✓' : '•'} {check.label}</span>
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
                      value={authForm.confirmPassword}
                      onInput={(event) => { authForm.confirmPassword = onReadValue(event); }}
                      placeholder="Repeat password"
                      autoComplete="off"
                      name="cg_admin_confirm_secret"
                      readOnly
                      onFocus={unlockAutofillGuard}
                      data-lpignore="true"
                      data-1p-ignore="true"
                    />
                    <button type="button" class="cg-password-toggle" onClick={onToggleConfirmPassword} aria-label={hideConfirmPassword ? 'Show password confirmation' : 'Hide password confirmation'}>
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
                <button type="button" class="cg-secondary compact" onClick={() => void onResendVerificationCode()} disabled={authLoading}>Resend code</button>
                <button type="button" class="cg-ghost compact" onClick={() => onSwitchMode('login')} disabled={authLoading}>Back to sign in</button>
              </div>
            ) : null}
          </div>
        </article>

        <section class="cg-auth-steps-panel cg-auth-steps-panel-polished" aria-label="Publishing workflow">
          <div class="cg-progress-steps cg-progress-steps-polished">
            {workflowSteps.map((step) => (
              <div class="cg-step cg-step-polished" key={step.id}>
                <span class="cg-step-icon"><WorkflowIcon type={step.id} /></span>
                <div>
                  <strong>{step.title}</strong>
                  <p class="cg-muted">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {notice ? (
        <div class="cg-admin-modal-backdrop" role="presentation" onClick={() => onDismissNotice && onDismissNotice()}>
          <div class={['cg-admin-modal', noticeKind === 'error' ? 'is-error' : '']} role="dialog" aria-modal="true" aria-live="polite" onClick={(event) => event.stopPropagation()}>
            <div class="cg-admin-modal-icon">{noticeKind === 'error' ? '!' : 'OK'}</div>
            <div>
              <h3>{noticeKind === 'error' ? 'Action needed' : 'Confirmed'}</h3>
              <p>{notice}</p>
            </div>
            <button type="button" class="cg-admin-modal-close" aria-label="Close notice" onClick={() => onDismissNotice && onDismissNotice()}>Close</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
