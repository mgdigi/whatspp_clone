import { state, setState } from '../utils/state.js'
import { userService } from '../services/userService.js'
import { conversationService } from '../services/conversationService.js'

export const createUserSearch = async (container, rerender) => {
  let searchResults = []

  const render = () => {
    container.innerHTML = `
      <div class="bg-whatsapp-bg-light rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <h2 class="text-xl font-semibold text-whatsapp-text-light mb-4">Rechercher des utilisateurs</h2>
        
        <div class="mb-4">
          <input
            type="text"
            id="user-search-input"
            placeholder="Rechercher par nom..."
            class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          >
        </div>

        <div id="search-results" class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          ${searchResults.length === 0 ? `
            <div class="text-center text-whatsapp-text-secondary py-8">
              <p>Tapez pour rechercher des utilisateurs</p>
            </div>
          ` : searchResults.map(user => `
            <div class="user-result flex items-center gap-3 p-3 rounded-lg hover:bg-whatsapp-bg-dark cursor-pointer transition-colors" 
                 data-user-id="${user.id}">
              <img src="${user.avatar || '/avatars/default.jpg'}" alt="${user.name}" class="w-10 h-10 rounded-full object-cover">
              <div class="flex-1">
                <h3 class="font-medium text-whatsapp-text-light">${user.name}</h3>
                <p class="text-sm text-whatsapp-text-secondary">${user.username}</p>
                <p class="text-xs text-whatsapp-text-secondary">${user.isOnline ? 'En ligne' : 'Hors ligne'}</p>
              </div>
              <button class="start-chat-btn bg-whatsapp-green text-white px-3 py-1 rounded-full text-sm hover:bg-whatsapp-dark-green transition-colors"
                      data-user-id="${user.id}">
                Discuter
              </button>
            </div>
          `).join('')}
        </div>

        <div class="flex gap-3 pt-4 mt-4 border-t border-whatsapp-bg-dark">
          <button
            type="button"
            id="close-search-btn"
            class="flex-1 bg-whatsapp-bg-dark text-whatsapp-text-secondary py-2 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    `

    setupUserSearchEvents(rerender)
  }

  const setupUserSearchEvents = (rerender) => {
    const searchInput = document.querySelector('#user-search-input')
    const closeBtn = document.querySelector('#close-search-btn')

    if (searchInput) {
      let searchTimeout
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout)
        const query = e.target.value.trim()
        
        if (query.length < 2) {
          searchResults = []
          render()
          return
        }

        searchTimeout = setTimeout(async () => {
          try {
            const allUsers = await userService.getAllUsers()
            searchResults = allUsers.filter(user => 
              user.id !== state.currentUser.id &&
              (user.name.toLowerCase().includes(query.toLowerCase()) ||
               user.username.toLowerCase().includes(query.toLowerCase()))
            )
            render()
          } catch (error) {
            console.error('Erreur recherche utilisateurs:', error)
          }
        }, 300)
      })

      searchInput.focus()
    }

    const startChatButtons = document.querySelectorAll('.start-chat-btn')
    startChatButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const userId = parseInt(btn.dataset.userId)
        
        try {
          const conversation = await conversationService.createDirectConversation(
            state.currentUser.id,
            userId
          )
          
          const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
          setState({ 
            ...state, 
            conversations: updatedConversations,
            showUserSearch: false,
            selectedConversationId: conversation.id
          })
          
          rerender()
        } catch (error) {
          console.error('Erreur création conversation:', error)
          alert('Erreur lors de la création de la conversation')
        }
      })
    })

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        setState({ ...state, showUserSearch: false })
        rerender()
      })
    }

    document.addEventListener('click', (e) => {
      if (e.target.id === 'user-search-modal') {
        setState({ ...state, showUserSearch: false })
        rerender()
      }
    })
  }

  render()
}