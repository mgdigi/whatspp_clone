import { state, setState } from '../utils/state.js'
import { messagesService } from '../services/api.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'

export const createChatWindow = async (container, rerender) => {
  if (!state.selectedContactId) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full bg-whatsapp-bg-chat">
        <div class="text-center">
          <div class="text-6xl mb-4">💬</div>
          <h2 class="text-xl text-whatsapp-text-light mb-2">WhatsApp Clone</h2>
          <p class="text-whatsapp-text-secondary">Sélectionnez un contact pour commencer une conversation</p>
        </div>
      </div>
    `
    return
  }

  const messages = await messagesService.getByContactId(state.selectedContactId)
  setState({ ...state, messages })

  const selectedContact = state.contacts.find(c => c.id === state.selectedContactId)
  if (!selectedContact) return

  const contactAvatar = selectedContact.avatar.startsWith('/avatars/') 
    ? avatarService.getAvatar(selectedContact.id)
    : selectedContact.avatar

  const render = () => {
    container.innerHTML = `
      <div class="flex flex-col h-full bg-whatsapp-bg-chat">
        <!-- Header du chat -->
        <div class="flex items-center gap-3 p-4 bg-whatsapp-bg-light border-b border-whatsapp-bg-dark">
          <img src="${contactAvatar}" alt="${selectedContact.name}" class="w-10 h-10 rounded-full object-cover border border-whatsapp-bg-dark">
          <div class="flex-1">
            <h3 class="font-medium text-whatsapp-text-light">${selectedContact.name}</h3>
            <p class="text-sm text-whatsapp-text-secondary">${selectedContact.phone}</p>
          </div>
          <button id="back-btn" class="md:hidden text-whatsapp-text-secondary hover:text-whatsapp-text-light">
            ←
          </button>
        </div>

        <!-- Messages -->
        <div id="messages-container" class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          ${renderMessages(state.messages)}
          <div id="typing-indicator" class="hidden">
            <div class="message-bubble message-contact bg-whatsapp-bg-light p-3 rounded-lg">
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Zone de saisie -->
        <div class="p-4 bg-whatsapp-bg-light border-t border-whatsapp-bg-dark">
          <form id="message-form" class="flex gap-3">
            <input 
              type="text" 
              id="message-input" 
              placeholder="Tapez un message..." 
              class="flex-1 bg-whatsapp-bg-dark text-whatsapp-text-light rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
              required
            >
            <button 
              type="submit" 
              class="bg-whatsapp-green text-white rounded-full p-2 hover:bg-whatsapp-dark-green transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `

    setupChatEvents(rerender)
    scrollToBottom()
  }

  const setupChatEvents = (rerender) => {
    const backBtn = container.querySelector('#back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        setState({ ...state, selectedContactId: null })
        rerender()
      })
    }

    const messageForm = container.querySelector('#message-form')
    const messageInput = container.querySelector('#message-input')

    if (messageForm && messageInput) {
      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const text = messageInput.value.trim()
        if (!text) return

        const userMessage = {
          contactId: state.selectedContactId,
          text,
          isFromUser: true,
          timestamp: new Date().toISOString()
        }

        const savedUserMessage = await messagesService.create(userMessage)
        const updatedMessages = [...state.messages, savedUserMessage]
        setState({ ...state, messages: updatedMessages })

        messageInput.value = ''
        render()

        setTimeout(async () => {
          showTypingIndicator()
          
          setTimeout(async () => {
            hideTypingIndicator()
            
            const autoReply = {
              contactId: state.selectedContactId,
              text: generateAutoReply(text),
              isFromUser: false,
              timestamp: new Date().toISOString()
            }

            const savedAutoReply = await messagesService.create(autoReply)
            const finalMessages = [...updatedMessages, savedAutoReply]
            setState({ ...state, messages: finalMessages })
            render()
          }, 1500)
        }, 1000)
      })

      messageInput.focus()
    }

    const deleteButtons = container.querySelectorAll('.delete-message-btn')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const messageId = parseInt(btn.dataset.messageId)
        
        if (confirm('Supprimer ce message ?')) {
          await messagesService.delete(messageId)
          
          const updatedMessages = state.messages.filter(m => m.id !== messageId)
          setState({ ...state, messages: updatedMessages })
          render()
        }
      })
    })
  }

  const showTypingIndicator = () => {
    const indicator = container.querySelector('#typing-indicator')
    if (indicator) {
      indicator.classList.remove('hidden')
      scrollToBottom()
    }
  }

  const hideTypingIndicator = () => {
    const indicator = container.querySelector('#typing-indicator')
    if (indicator) {
      indicator.classList.add('hidden')
    }
  }

  const scrollToBottom = () => {
    const messagesContainer = container.querySelector('#messages-container')
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }, 100)
    }
  }

  render()
}

const renderMessages = (messages) => {
  return messages.map(message => `
    <div class="message-enter ${message.isFromUser ? 'text-right' : 'text-left'}">
      <div class="message-bubble ${message.isFromUser ? 'message-user' : 'message-contact'} inline-block p-3 rounded-lg relative group">
        <p class="text-sm text-white">${message.text}</p>
        <span class="text-xs text-gray-300 mt-1 block">${formatTime(message.timestamp)}</span>
        
        <!-- Bouton supprimer (visible au hover) -->
        <button 
          class="delete-message-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          data-message-id="${message.id}"
          title="Supprimer le message"
        >
          ×
        </button>
      </div>
    </div>
  `).join('')
}

const generateAutoReply = (userMessage) => {
  const replies = [
    "Merci pour votre message !",
    "Je vous réponds dès que possible.",
    "Message bien reçu 👍",
    "Intéressant ! Dites-moi en plus.",
    "Je suis d'accord avec vous.",
    "Excellente question !",
    "Merci pour l'information.",
    "À bientôt !",
    "Parfait, c'est noté.",
    "Je vais y réfléchir."
  ]
  
  return replies[Math.floor(Math.random() * replies.length)]
}