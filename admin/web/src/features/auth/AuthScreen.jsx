import '../../app/AdminShell.css';
import './AuthScreen.css';

// ─── Password utilities ────────────────────────────────────────────────────────

const passwordRules = (password) => [
  { id: 'length',  label: '8 or more characters',       valid: password.length >= 8 },
  { id: 'upper',   label: 'Uppercase letter',            valid: /[A-Z]/.test(password) },
  { id: 'lower',   label: 'Lowercase letter',            valid: /[a-z]/.test(password) },
  { id: 'number',  label: 'Number',                      valid: /\d/.test(password) },
  { id: 'symbol',  label: 'Symbol for extra protection', valid: /[^A-Za-z0-9]/.test(password) },
];

const getPasswordReport = (password) => {
  const checks = passwordRules(password);
  const score = checks.filter((c) => c.valid).length;
  const label = score >= 5 ? 'Excellent' : score >= 4 ? 'Strong' : score >= 3 ? 'Fair' : 'Needs work';
  return { checks, label, score, percent: Math.max(12, Math.round((score / checks.length) * 100)) };
};

const secureIndex = (length) => {
  if (globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % length;
  }
  return Math.floor(Math.random() * length);
};

const generatePasswordSuggestion = () => {
  const words   = ['Grace', 'Signal', 'Anchor', 'Crown', 'Harbor', 'Studio', 'Cedar', 'Summit'];
  const symbols = ['!', '#', '%', '?', '@'];
  const num     = 1000 + secureIndex(9000);
  return `${words[secureIndex(words.length)]}${words[secureIndex(words.length)]}${symbols[secureIndex(symbols.length)]}${num}`;
};

// ─── SVG icon library ─────────────────────────────────────────────────────────

function Icon({ name, size = 18 }) {
  const paths = {
    eye:          'M3 12c2.2-3.5 5.2-5.2 9-5.2s6.8 1.7 9 5.2c-2.2 3.5-5.2 5.2-9 5.2S5.2 15.5 3 12Z M12 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z',
    'eye-off':    'M3 3l18 18 M10.6 10.7a2.1 2.1 0 0 0 2.8 2.8 M7.4 7.7C5.6 8.7 4.1 10.2 3 12c2.2 3.5 5.2 5.2 9 5.2 1.4 0 2.7-.2 3.8-.7 M10.2 6.9c.6-.1 1.2-.1 1.8-.1 3.8 0 6.8 1.7 9 5.2-.6.9-1.3 1.8-2.1 2.5',
    home:         'M4 10.8 12 4l8 6.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2v-8.4Z M9.4 21v-6.2h5.2V21',
    lock:         'M6 11V8a6 6 0 0 1 12 0v3 M3 11h18v11H3V11Z M12 15v3',
    'person-add': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M19 8v6 M22 11h-6',
    upload:       'M12 16V4m0 0 4.4 4.4M12 4 7.6 8.4 M5 16.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5',
    check:        'M9 12 11.4 14.4 15 9 M5.5 12a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
    preview:      'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-11A2.5 2.5 0 0 1 4 13.5v-7Z M9 20h6 M12 16v4',
    'arrow-right': 'M5 12h14 M13 6l6 6-6 6',
    'chevron-left': 'M15 18l-6-6 6-6',
    'shield-check': 'M12 2L4 5v6c0 5.5 3.6 10.7 8 12 4.4-1.3 8-6.5 8-12V5L12 2Z M9 12l2 2 4-4',
    sparkles:     'M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z',
    publish:      'M12 4v12 M7 9l5-5 5 5 M19 12v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7',
    live:         'M6.3 6.3a8 8 0 0 0 0 11.4m11.4-11.4a8 8 0 0 1 0 11.4M9.2 9.2a4 4 0 0 0 0 5.6m5.6-5.6a4 4 0 0 1 0 5.6M12 12h.01',
  };

  const d = paths[name];
  if (!d) return null;

  // Multi-path icons split by " M" prefix — handle both stroke-only and mixed
  const isMultiPath = name === 'eye' || name === 'eye-off';

  if (isMultiPath) {
    const segments = d.split(' M').map((seg, i) => (i === 0 ? seg : 'M' + seg));
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
        {segments.map((seg, i) => (
          <path key={i} d={seg} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.23c0-.74-.07-1.28-.2-1.85H12v3.36h5.52c-.11.84-.71 2.1-2.04 2.95l-.02.12 2.96 2.08.2.02c1.84-1.55 2.98-3.84 2.98-6.68Z" />
      <path fill="currentColor" d="M12 21c2.63 0 4.84-.79 6.45-2.15l-3.07-2.16c-.82.52-1.92.88-3.38.88-2.57 0-4.75-1.55-5.52-3.7l-.12.01-3.08 2.17-.04.1C4.84 19.02 8.14 21 12 21Z" opacity=".78" />
      <path fill="currentColor" d="M6.48 13.87A5.18 5.18 0 0 1 6.2 12c0-.65.1-1.28.27-1.87l-.01-.13-3.12-2.2-.1.04A8.25 8.25 0 0 0 2.4 12c0 1.5.39 2.9 1.08 4.1l3-2.23Z" opacity=".56" />
      <path fill="currentColor" d="M12 6.43c1.83 0 3.06.72 3.76 1.32l2.75-2.44C16.82 3.88 14.63 3 12 3 8.14 3 4.84 4.98 3.24 7.84l3.24 2.29c.77-2.15 2.95-3.7 5.52-3.7Z" opacity=".9" />
    </svg>
  );
}

// ─── Shared password field ──────────────────────────────────────────────────────

function PasswordField({ value, onInput, placeholder, hidden, onToggle, name }) {
  return (
    <div class="cg-password-field">
      <input
        type={hidden ? 'password' : 'text'}
        value={value}
        onInput={onInput}
        placeholder={placeholder}
        autoComplete="off"
        name={name}
        readOnly
        onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
        data-lpignore="true"
        data-1p-ignore="true"
      />
      <button
        type="button"
        class="cg-password-toggle"
        onClick={onToggle}
        aria-label={hidden ? 'Show password' : 'Hide password'}
      >
        <Icon name={hidden ? 'eye' : 'eye-off'} size={18} />
      </button>
    </div>
  );
}

// ─── Landing page ───────────────────────────────────────────────────────────────

function LandingPage({ brandLogoUrl, onShowAuth, onSwitchMode, publicHealthSummary }) {
  const isReady = publicHealthSummary && !publicHealthSummary.toLowerCase().includes('unavailable') && !publicHealthSummary.toLowerCase().includes('checking');
  const statusDotClass = isReady ? 'cg-auth-status-dot' : 'cg-auth-status-dot is-warning';

  const features = [
    {
      icon: 'upload',
      title: 'Upload content',
      desc: 'Add title, description, media URL, thumbnail, tags, and target app sections in one guided form.',
    },
    {
      icon: 'check',
      title: 'Review and publish',
      desc: 'Draft, correct, approve, and release with clear visibility status and a full audit trail.',
    },
    {
      icon: 'preview',
      title: 'Preview on mobile',
      desc: 'See exactly how content appears in the mobile app before it reaches users on any device.',
    },
  ];

  return (
    <div class="cg-auth-landing">
      <div class="cg-auth-landing-hero">
        <div class="cg-auth-brand-mark">
          <img src={brandLogoUrl} alt="ClaudyGod" />
        </div>

        <div>
          <p class="cg-auth-org-name">ClaudyGod</p>
          <p class="cg-auth-org-sub">ClaudyGod Ministries</p>
        </div>

        <h1 class="cg-auth-headline">
          Professional publishing<br />
          <span>control for every release.</span>
        </h1>

        <p class="cg-auth-tagline">
          Upload, review, publish, and monitor the mobile app experience from one secure admin studio built for production operations.
        </p>

        <div class="cg-auth-status">
          <span class={statusDotClass} />
          {publicHealthSummary || 'Checking portal status'}
        </div>

        <div class="cg-auth-landing-actions">
          <button
            type="button"
            class="cg-primary cg-icon-button"
            onClick={onShowAuth}
          >
            <Icon name="lock" size={17} />
            Sign in
          </button>
          <button
            type="button"
            class="cg-secondary cg-icon-button"
            onClick={() => { onSwitchMode('register'); onShowAuth(); }}
          >
            <Icon name="person-add" size={17} />
            Create account
          </button>
        </div>
      </div>

      <div class="cg-auth-features">
        {features.map((feature) => (
          <div class="cg-auth-feature-card" key={feature.icon}>
            <div class="cg-auth-feature-icon">
              <Icon name={feature.icon} size={20} />
            </div>
            <div>
              <strong>{feature.title}</strong>
              <p>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sign-in sidebar ────────────────────────────────────────────────────────────

function SignInSidebar({ publicHealthSummary }) {
  const isReady = publicHealthSummary && !publicHealthSummary.toLowerCase().includes('unavailable');

  return (
    <section class="cg-panel cg-auth-sidebar" aria-label="Portal status">
      <div>
        <p class="cg-auth-sidebar-kicker">Publishing workspace</p>
        <h2 class="cg-auth-sidebar-title">Your studio is ready.</h2>
        <p class="cg-auth-sidebar-body">
          Everything you need to upload, review, and publish content to the ClaudyGod mobile app is here.
        </p>
      </div>

      <div class="cg-auth-divider" />

      <div>
        <p class="cg-auth-sidebar-kicker" style={{ marginBottom: '10px' }}>What you can do</p>
        <ul class="cg-auth-unlock-list">
          <li class="cg-auth-unlock-item">
            <Icon name="upload" size={16} />
            Upload audio, video, and announcements
          </li>
          <li class="cg-auth-unlock-item">
            <Icon name="publish" size={16} />
            Review, approve, and publish content
          </li>
          <li class="cg-auth-unlock-item">
            <Icon name="live" size={16} />
            Start and manage live sessions
          </li>
          <li class="cg-auth-unlock-item">
            <Icon name="preview" size={16} />
            Preview the mobile app before releasing
          </li>
        </ul>
      </div>

      <div class="cg-auth-divider" />

      <div class="cg-auth-status">
        <span class={isReady ? 'cg-auth-status-dot' : 'cg-auth-status-dot is-warning'} />
        {publicHealthSummary || 'Checking status'}
      </div>
    </section>
  );
}

// ─── Register sidebar ──────────────────────────────────────────────────────────

function RegisterSidebar() {
  const steps = [
    { icon: 'person-add', label: 'Create your publisher profile', desc: 'Choose a username and secure password.' },
    { icon: 'shield-check', label: 'Verify your email', desc: 'Confirm your address with a one-time code.' },
    { icon: 'sparkles',   label: 'Access your studio', desc: 'Upload, publish, and manage the mobile app.' },
  ];

  return (
    <section class="cg-panel cg-auth-sidebar" aria-label="Registration steps">
      <div>
        <p class="cg-auth-sidebar-kicker">Getting started</p>
        <h2 class="cg-auth-sidebar-title">Three steps to your studio.</h2>
        <p class="cg-auth-sidebar-body">
          Once registered and verified, you can upload content, manage live sessions, and configure the mobile app.
        </p>
      </div>

      <div class="cg-auth-divider" />

      <div class="cg-stack">
        {steps.map((step, index) => (
          <div key={step.icon} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)', color: 'var(--admin-primary)', flexShrink: 0 }}>
              <Icon name={step.icon} size={16} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '13.5px', fontWeight: 760, color: 'var(--admin-text)' }}>
                {index + 1}. {step.label}
              </strong>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Verify sidebar ─────────────────────────────────────────────────────────────

function VerifySidebar({ pendingEmail }) {
  return (
    <section class="cg-panel cg-auth-sidebar" aria-label="Verification info">
      <div>
        <p class="cg-auth-sidebar-kicker">Almost there</p>
        <h2 class="cg-auth-sidebar-title">Check your email.</h2>
        <p class="cg-auth-sidebar-body">
          A 6-digit code was sent to{' '}
          <strong style={{ color: 'var(--admin-text)' }}>
            {pendingEmail || 'your email address'}
          </strong>
          . Enter it to open your publishing workspace.
        </p>
      </div>
      <div class="cg-auth-divider" />
      <ul class="cg-auth-unlock-list">
        <li class="cg-auth-unlock-item">
          <Icon name="check" size={16} />
          Use the most recent code — earlier ones expire
        </li>
        <li class="cg-auth-unlock-item">
          <Icon name="check" size={16} />
          Check your spam folder if it doesn't appear
        </li>
        <li class="cg-auth-unlock-item">
          <Icon name="check" size={16} />
          Resend a new code if needed
        </li>
      </ul>
    </section>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

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
    const suggestion = generatePasswordSuggestion();
    authForm.password = suggestion;
    authForm.confirmPassword = suggestion;
    if (hidePassword) onTogglePassword();
    if (hideConfirmPassword) onToggleConfirmPassword();
  };

  // ── Landing ────────────────────────────────────────────────────────────────
  if (showPublicHome) {
    return (
      <section class="cg-auth-root-polished">
        <LandingPage
          brandLogoUrl={brandLogoUrl}
          onShowAuth={onShowAuth}
          onSwitchMode={onSwitchMode}
          publicHealthSummary={publicHealthSummary}
        />
      </section>
    );
  }

  // ── Form titles and icons per mode ────────────────────────────────────────
  const formTitle = isVerifyMode
    ? 'Verify your account'
    : isRegisterMode
      ? 'Create publisher access'
      : 'Welcome back';

  const formSubtitle = isVerifyMode
    ? 'Enter the 6-digit code sent to your email.'
    : isRegisterMode
      ? 'Set up your secure publisher profile to start managing content.'
      : 'Sign in to access your admin publishing studio.';

  const formIcon = isVerifyMode ? 'shield-check' : isRegisterMode ? 'sparkles' : 'lock';

  const submitLabel = authLoading
    ? isVerifyMode ? 'Verifying...' : isRegisterMode ? 'Creating account...' : 'Signing in...'
    : isVerifyMode ? 'Verify email' : isRegisterMode ? 'Create account' : 'Sign in';

  const submitIcon = isVerifyMode ? 'shield-check' : isRegisterMode ? 'person-add' : 'arrow-right';

  // ── Form + sidebar ────────────────────────────────────────────────────────
  return (
    <section class="cg-auth-root-polished">
      <div class="cg-auth-form-layout">
        {/* Left — form panel */}
        <article class="cg-panel cg-auth-form-panel">
          <button type="button" class="cg-auth-form-back" onClick={onShowPublicHome}>
            <Icon name="chevron-left" size={16} />
            Home
          </button>

          <div class="cg-auth-form-identity">
            <div class="cg-auth-form-identity-icon">
              <Icon name={formIcon} size={22} />
            </div>
            <div>
              <h2 class="cg-auth-form-title">{formTitle}</h2>
              <p class="cg-auth-form-subtitle">{formSubtitle}</p>
            </div>
          </div>

          {/* Mode toggle — sign in vs create account */}
          {!isVerifyMode ? (
            <div class="cg-auth-mode-toggle" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                class={authMode === 'login' ? 'is-active' : ''}
                role="tab"
                aria-selected={authMode === 'login'}
                onClick={() => onSwitchMode('login')}
                disabled={authLoading}
              >
                <Icon name="lock" size={15} />
                Sign in
              </button>
              <button
                type="button"
                class={isRegisterMode ? 'is-active' : ''}
                role="tab"
                aria-selected={isRegisterMode}
                onClick={() => onSwitchMode('register')}
                disabled={authLoading}
              >
                <Icon name="person-add" size={15} />
                Create account
              </button>
            </div>
          ) : null}

          <div class="cg-stack">
            {/* Google sign-in */}
            {googleLoginEnabled && !isVerifyMode ? (
              <button
                type="button"
                class="cg-secondary cg-google-button"
                onClick={onGoogleLogin}
                disabled={authLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            ) : null}

            <form class="cg-form cg-auth-clean-form" onSubmit={(e) => void onSubmit(e)} autoComplete="off">
              {/* Username — register only */}
              {isRegisterMode ? (
                <label>
                  <span>Username</span>
                  <input
                    value={authForm.username}
                    onInput={(e) => { authForm.username = onReadValue(e); }}
                    placeholder="publisher_name"
                    autoComplete="off"
                    name="cg_admin_new_publisher_name"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <small>This name appears on published content and in ownership records.</small>
                </label>
              ) : null}

              {/* Email */}
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={authForm.email}
                  onInput={(e) => { authForm.email = onReadValue(e); }}
                  placeholder={isVerifyMode ? 'Email used during signup' : 'name@example.com'}
                  autoComplete="off"
                  name={isVerifyMode ? 'cg_admin_verify_email' : 'cg_admin_user_identifier'}
                  inputMode="email"
                  spellCheck="false"
                  autoCorrect="off"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
              </label>

              {/* Verification code or password */}
              {isVerifyMode ? (
                <label>
                  <span>Verification code</span>
                  <input
                    value={authForm.verificationCode}
                    onInput={(e) => { authForm.verificationCode = onReadValue(e).replace(/\D/g, '').slice(0, 6); }}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    name="cg_admin_verification_code"
                    style={{ letterSpacing: '0.14em', fontSize: '20px', fontWeight: 700 }}
                  />
                  <small>
                    {pendingVerificationEmail
                      ? `Sent to ${pendingVerificationEmail}`
                      : 'Use the newest 6-digit code from your inbox.'}
                  </small>
                </label>
              ) : (
                <label>
                  <span>{isRegisterMode ? 'Create a password' : 'Password'}</span>
                  <PasswordField
                    value={authForm.password}
                    onInput={(e) => { authForm.password = onReadValue(e); }}
                    placeholder={isRegisterMode ? 'Secure password' : 'Enter your password'}
                    hidden={hidePassword}
                    onToggle={onTogglePassword}
                    name={isRegisterMode ? 'cg_admin_new_secret' : 'cg_admin_access_phrase'}
                  />
                  {isRegisterMode ? (
                    <div class="cg-password-strength" aria-live="polite">
                      <div class="cg-password-strength-head">
                        <strong>{passwordReport.label} password</strong>
                        <button type="button" class="cg-inline-action" onClick={applySuggestedPassword}>
                          Suggest password
                        </button>
                      </div>
                      <div class="cg-password-meter" aria-hidden="true">
                        <span style={{ width: `${passwordReport.percent}%` }} />
                      </div>
                      <div class="cg-password-checks">
                        {passwordReport.checks.map((check) => (
                          <span key={check.id} class={check.valid ? 'is-valid' : ''}>
                            {check.valid ? '✓' : '·'} {check.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </label>
              )}

              {/* Confirm password — register only */}
              {isRegisterMode ? (
                <label>
                  <span>Confirm password</span>
                  <PasswordField
                    value={authForm.confirmPassword}
                    onInput={(e) => { authForm.confirmPassword = onReadValue(e); }}
                    placeholder="Repeat your password"
                    hidden={hideConfirmPassword}
                    onToggle={onToggleConfirmPassword}
                    name="cg_admin_confirm_secret"
                  />
                </label>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                class="cg-primary cg-auth-submit-btn"
                disabled={authLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px' }}
              >
                <Icon name={submitIcon} size={17} />
                {submitLabel}
              </button>
            </form>

            {/* Verify mode secondary actions */}
            {isVerifyMode ? (
              <div class="cg-button-row">
                <button
                  type="button"
                  class="cg-secondary compact"
                  onClick={() => void onResendVerificationCode()}
                  disabled={authLoading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
                >
                  <Icon name="arrow-right" size={15} />
                  Resend code
                </button>
                <button
                  type="button"
                  class="cg-ghost compact"
                  onClick={() => onSwitchMode('login')}
                  disabled={authLoading}
                  style={{ flex: 1 }}
                >
                  Back to sign in
                </button>
              </div>
            ) : null}
          </div>
        </article>

        {/* Right — contextual sidebar */}
        {isVerifyMode
          ? <VerifySidebar pendingEmail={pendingVerificationEmail} />
          : isRegisterMode
            ? <RegisterSidebar />
            : <SignInSidebar publicHealthSummary={publicHealthSummary} />}
      </div>

      {/* Notice modal */}
      {notice ? (
        <div
          class="cg-admin-modal-backdrop"
          role="presentation"
          onClick={() => onDismissNotice?.()}
        >
          <div
            class={['cg-admin-modal', noticeKind === 'error' ? 'is-error' : '']}
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="cg-admin-modal-icon" style={{ display: 'grid', placeItems: 'center' }}>
              {noticeKind === 'error'
                ? <Icon name="eye-off" size={16} />
                : <Icon name="check" size={16} />}
            </div>
            <div>
              <h3>{noticeKind === 'error' ? 'Action needed' : 'Confirmed'}</h3>
              <p>{notice}</p>
            </div>
            <button
              type="button"
              class="cg-admin-modal-close"
              aria-label="Close notice"
              onClick={() => onDismissNotice?.()}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
