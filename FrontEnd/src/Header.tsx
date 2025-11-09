import { useState, useEffect } from 'react'

interface HeaderProps {
  onNavigateToLogin?: () => void
  onNavigateBack?: () => void
  onNavigateToLanding?: () => void
  onNavigateToInterpretor?: () => void
  showLoginButton?: boolean
  showBackButton?: boolean
  showInterpretorButton?: boolean
}

interface CurrentUser {
  id: string
  username: string
  email: string
  fullName: string
  role: string
}

function Header({ 
  onNavigateToLogin, 
  onNavigateBack,
  onNavigateToLanding,
  onNavigateToInterpretor, 
  showLoginButton = false, 
  showBackButton = false,
  showInterpretorButton = false
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('currentUser')
      }
    }
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showDropdown && !target.closest('.relative')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setShowDropdown(false)
    if (onNavigateToLanding) {
      onNavigateToLanding()
    }
  }

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

          {showInterpretorButton && onNavigateToInterpretor && (
            <button
              onClick={onNavigateToInterpretor}
              className="px-6 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-600 rounded-full hover:bg-purple-50 transition-all duration-200"
            >
              Interpretor
            </button>
          )}

          {showLoginButton && (
            currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {currentUser.fullName}
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{currentUser.fullName}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Deconectează-te
                    </button>
                  </div>
                )}
              </div>
            ) : (
              onNavigateToLogin && (
                <button
                  onClick={onNavigateToLogin}
                  className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
                >
                  Intră în cont
                </button>
              )
            )
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
