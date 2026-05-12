import '../../app/AdminShell.css';

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

  const pageTitle = isVerifyMode ? 'Verify your account' : isRegisterMode ? 'Create publisher access' : 'Sign in to Admin Studio';
  const pageCopy = isVerifyMode
    ? 'Enter the verification code sent to your email to open the publishing workspace.'
    : isRegisterMode
      ? 'Create a secure publisher profile for uploading, correcting, and releasing content.'
      : 'Use your approved account to manage content, mobile app structure, live sessions, and publishing.';

  return (
    <section class="cg-auth-root">
      <div class="cg-orb cg-orb-one" />
      <div class="cg-orb cg-orb-two" />

      <div class="cg-auth-grid">
        <article class="cg-panel cg-auth-hero">
          <div class="cg-logo-box" style={{ width: '74px', height: '74px', borderRadius: '26px' }}>
            <img src={brandLogoUrl} alt="ClaudyGod" style={{ width: '48px', height: '48px' }} />
          </div>

          <div style={{ marginTop: '28px' }}>
            <p class="cg-kicker">ClaudyGod Ministries</p>
            <h1 class="cg-auth-title">Client-friendly publishing control.</h1>
            <p class="cg-hero-copy">
              A secure admin workspace for uploading media, assigning mobile app placements, managing live sessions, and reviewing every release before it reaches users.
            </p>
          </div>

          <div class="cg-progress-steps" style={{ marginTop: '30px' }}>
            <div class="cg-step">
              <span class="cg-step-pill">01</span>
              <strong>Upload clearly</strong>
              <p class="cg-muted">Add title, description, media, thumbnail, and target sections in one flow.</p>
            </div>
            <div class="cg-step">
              <span class="cg-step-pill">02</span>
              <strong>Review safely</strong>
              <p class="cg-muted">Draft, correct, approve, and publish without confusing hidden steps.</p>
            </div>
            <div class="cg-step">
              <span class="cg-step-pill">03</span>
              <strong>Preview mobile</strong>
              <p class="cg-muted">Confirm how published content appears before moving to the next task.</p>
            </div>
          </div>
        </article>

        <article class="cg-panel cg-auth-form">
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
            {notice ? <div class={['cg-notice', noticeKind === 'error' ? 'is-error' : '']}>{notice}</div> : null}
            <span class="cg-chip is-success">{publicHealthSummary}</span>

            {googleLoginEnabled && !isVerifyMode ? (
              <button type="button" class="cg-secondary" onClick={onGoogleLogin} disabled={authLoading}>
                Continue with Google
              </button>
            ) : null}

            <form class="cg-form" onSubmit={(event) => void onSubmit(event)}>
              {isRegisterMode ? (
                <label>
                  <span>Username</span>
                  <input
                    value={authForm.username}
                    onInput={(event) => { authForm.username = onReadValue(event); }}
                    placeholder="publisher_name"
                    autoComplete="nickname"
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
                  autoComplete="email"
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
                  />
                  <small>{pendingVerificationEmail ? `Code destination: ${pendingVerificationEmail}` : 'Use the newest 6-digit code sent to your email.'}</small>
                </label>
              ) : (
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onInput={(event) => { authForm.password = onReadValue(event); }}
                    placeholder={isRegisterMode ? 'Create a secure password' : 'Enter your password'}
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  />
                </label>
              )}

              {isRegisterMode ? (
                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    value={authForm.confirmPassword}
                    onInput={(event) => { authForm.confirmPassword = onReadValue(event); }}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
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
      </div>
    </section>
  );
}
