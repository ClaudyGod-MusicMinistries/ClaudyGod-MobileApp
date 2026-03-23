export default function BootScreen({ brandLogoUrl }) {
  return (
    <div class="boot-state">
      <div class="boot-card glass-panel reveal-up">
        <div class="logo-wrap logo-wrap-large">
          <div class="logo-glow" />
          <img src={brandLogoUrl} alt="ClaudyGod" class="brand-logo" />
        </div>
        <div class="boot-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Preparing your portal...</p>
        <p>Loading your dashboard...</p>
      </div>
    </div>
  );
}
