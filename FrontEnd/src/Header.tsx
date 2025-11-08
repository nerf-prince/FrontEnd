interface HeaderProps {
  onNavigateToLogin?: () => void
  onNavigateBack?: () => void
  onNavigateToLanding?: () => void
  showLoginButton?: boolean
  showBackButton?: boolean
}

function Header({ 
  onNavigateToLogin, 
  onNavigateBack,
  onNavigateToLanding, 
  showLoginButton = false, 
  showBackButton = false 
}: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={onNavigateToLanding}
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer transition-transform duration-200"
        >
          InfoBac
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {showBackButton && onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ÎNAPOI
            </button>
          )}

          {showLoginButton && onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
            >
              Intră în cont
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
