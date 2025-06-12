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
      </div>
    </div>
  `

  setupLoginEvents(onLogin)
}

const setupLoginEvents = (onLogin) => {
  const form = document.querySelector('#login-form')
  const errorMessage = document.querySelector('#error-message')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const username = document.querySelector('#username').value.trim()
    const password = document.querySelector('#password').value.trim()

    if (!username || !password) {
      showError('Veuillez remplir tous les champs')
      return
    }

    try {
      const result = await authService.login(username, password)
      
      if (result.success) {
        onLogin(result.user)
        setState({
          showLoginForm: false,
          currentUser: result.user,
          users: result.users,
          avatars: result.avatars,
          showChatWindow: true,
        })
      
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError('Erreur de connexion')
    }
  })

  const showError = (message) => {
    errorMessage.textContent = message
    errorMessage.classList.remove('hidden')
    setTimeout(() => {
      errorMessage.classList.add('hidden')
    }, 5000)
  }
}