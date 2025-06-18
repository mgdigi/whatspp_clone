import { authService } from '../services/authService.js'
import { state, setState } from '../utils/state.js'

setState({
  showLoginForm: true,
  currentUser: null,
  users: [],
  avatars: [],
  showChatWindow: false,
})

export const createLoginForm = (container, onLogin) => {
  container.innerHTML = `
    <div class="min-h-screen bg-whatsapp-bg-dark flex items-center justify-center">
      <div class="bg-whatsapp-bg-light rounded-lg p-8 w-full max-w-md mx-4">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-whatsapp-green mb-2">My Chat</h1>
          <p class="text-whatsapp-text-secondary">Connectez-vous pour continuer</p>
        </div>

        <form id="login-form" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-whatsapp-text-light mb-2">
              Nom d'utilisateur ou email
            </label>
            <input
              type="text"
              id="username"
              class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              placeholder="mohamed ou mohamed@gmail.com"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-whatsapp-text-light mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              placeholder="password123"
            >
          </div>

          <div id="error-message" class="hidden bg-red-500 text-white p-3 rounded-lg text-sm"></div>

          <button
            type="submit"
            id="login-btn"
            class="w-full bg-whatsapp-green text-white py-3 rounded-lg hover:bg-whatsapp-dark-green transition-colors font-medium"
          >
            Se connecter
          </button>
        </form>

        <div class="mt-6 p-4 bg-whatsapp-bg-dark rounded-lg">
          <p class="text-whatsapp-text-secondary text-sm mb-2">Comptes de test :</p>
          <div class="space-y-1 text-xs text-whatsapp-text-secondary">
            <p>• mohamed / password123</p>
            <p>• bilal / password123</p>
            <p>• mbaye / password123</p>
          </div>
        </div>

        <!-- Boutons de connexion rapide -->
        <div class="mt-4 space-y-2">
          <p class="text-whatsapp-text-secondary text-sm text-center">Connexion rapide :</p>
          <div class="flex gap-2">
            <button class="quick-login-btn flex-1 bg-whatsapp-bg-dark text-whatsapp-text-light py-2 px-3 rounded text-sm hover:bg-gray-600 transition-colors" data-username="mohamed" data-password="password123">
              Mohamed
            </button>
            <button class="quick-login-btn flex-1 bg-whatsapp-bg-dark text-whatsapp-text-light py-2 px-3 rounded text-sm hover:bg-gray-600 transition-colors" data-username="bilal" data-password="password123">
              Bilal
            </button>
            <button class="quick-login-btn flex-1 bg-whatsapp-bg-dark text-whatsapp-text-light py-2 px-3 rounded text-sm hover:bg-gray-600 transition-colors" data-username="mbaye" data-password="password123">
              Mbaye
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  setupLoginEvents(onLogin)
}

const setupLoginEvents = (onLogin) => {
  const form = document.querySelector('#login-form')
  const errorMessage = document.querySelector('#error-message')
  const loginBtn = document.querySelector('#login-btn')
  const quickLoginBtns = document.querySelectorAll('.quick-login-btn')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const username = document.querySelector('#username').value.trim()
    const password = document.querySelector('#password').value.trim()
    
    await handleLogin(username, password, onLogin, loginBtn, errorMessage)
  })

  quickLoginBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      const username = btn.dataset.username
      const password = btn.dataset.password
      
      document.querySelector('#username').value = username
      document.querySelector('#password').value = password
      
      await handleLogin(username, password, onLogin, btn, errorMessage)
    })
  })
}

const handleLogin = async (username, password, onLogin, button, errorMessage) => {
  if (!username || !password) {
    showError('Veuillez remplir tous les champs', errorMessage)
    return
  }

  const originalText = button.textContent
  button.textContent = 'Connexion...'
  button.disabled = true
  hideError(errorMessage)

  try {
    const result = await authService.login(username, password)
    
    if (result.success) {
      localStorage.setItem('currentUser', JSON.stringify(result.user))
      localStorage.setItem('isAuthenticated', 'true')
      
      setState({
        showLoginForm: false,
        currentUser: result.user,
        users: result.users,
        avatars: result.avatars,
        showChatWindow: true,
        isAuthenticated: true
      })

      button.textContent = 'Connexion réussie !'
      button.classList.remove('bg-whatsapp-green')
      button.classList.add('bg-green-600')

      setTimeout(() => {
        if (onLogin) {
          onLogin(result.user)
        }
      }, 800) 

    } else {
      showError(result.error || 'Erreur de connexion', errorMessage)
    }
  } catch (error) {
    console.error('Erreur de connexion:', error)
    showError('Erreur de connexion. Veuillez réessayer.', errorMessage)
  } finally {
    setTimeout(() => {
      button.textContent = originalText
      button.disabled = false
      button.classList.remove('bg-green-600')
      button.classList.add('bg-whatsapp-green')
    }, 2000)
  }
}

const showError = (message, errorElement) => {
  errorElement.textContent = message
  errorElement.classList.remove('hidden')
  
  setTimeout(() => {
    hideError(errorElement)
  }, 5000)
}

const hideError = (errorElement) => {
  errorElement.classList.add('hidden')
}

export const checkExistingSession = async () => {
  try {
    const savedUser = localStorage.getItem('currentUser')
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    
    if (savedUser && isAuthenticated === 'true') {
      const user = JSON.parse(savedUser)
      
      const result = await authService.validateSession(user.id)
      
      if (result && result.success) {
        setState({
          showLoginForm: false,
          currentUser: user,
          users: result.users || [],
          avatars: result.avatars || [],
          showChatWindow: true,
          isAuthenticated: true
        })
        return user
      } else {
        clearSession()
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de session:', error)
    clearSession()
  }
  return null
}

export const clearSession = () => {
  localStorage.removeItem('currentUser')
  localStorage.removeItem('isAuthenticated')
  setState({
    showLoginForm: true,
    currentUser: null,
    users: [],
    avatars: [],
    showChatWindow: false,
    isAuthenticated: false
  })
}

export const logout = () => {
  clearSession()
  window.location.reload()
}
