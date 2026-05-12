import '../../app/AdminShell.css';

export default function BootScreen({ brandLogoUrl }) {
  return (
    <section class="cg-boot-root">
      <div class="cg-orb cg-orb-one" />
      <div class="cg-orb cg-orb-two" />
      <article class="cg-panel cg-boot-card">
        <div class="cg-logo-box" style={{ width: '78px', height: '78px', borderRadius: '28px' }}>
          <img src={brandLogoUrl} alt="ClaudyGod" style={{ width: '50px', height: '50px' }} />
        </div>
        <div class="cg-loader" aria-hidden="true" />
        <div>
          <p class="cg-kicker">Preparing Admin Studio</p>
          <h2 class="cg-title" style={{ fontSize: '28px', marginTop: '8px' }}>Loading your workspace</h2>
          <p class="cg-copy" style={{ marginTop: '8px' }}>
            We are checking your session, content library, upload rules, mobile configuration, and publishing permissions.
          </p>
        </div>
      </article>
    </section>
  );
}
