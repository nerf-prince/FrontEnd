import './LandingPage.css'

interface LandingPageProps {
  onNavigateToLogin: () => void
}

function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo">SmartLearn</div>
          <button className="header-login-button" onClick={onNavigateToLogin}>
            Intră în cont
          </button>
        </div>
      </header>

      <div className="landing-content">
        <h1 className="landing-title">SmartLearn</h1>

        <div className="hero-container">
          <h2 className="hero-heading">Modelăm succesul noii generații.</h2>
          <p className="hero-description">
            Intră într-o experiență de învățare personalizată, în care fiecare exercițiu,
            explicație și evaluare este adaptată ritmului tău. SmartLearn devine profesorul
            tău digital, mereu prezent și gata să te ghideze spre performanță, oriunde te
            afli și oricând alegi să înveți.
          </p>
          <button className="signup-button" onClick={onNavigateToLogin}>
            ÎNSCRIE-TE
          </button>
        </div>

      </div>
    </div>
  )
}

export default LandingPage

