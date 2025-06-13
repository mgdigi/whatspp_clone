import { state, setState } from '../utils/state.js'
import { messageService } from '../services/messageService.js'
import { conversationService } from '../services/conversationService.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'

export const createChatWindow = async (container, rerender) => {
  // Vérifier si une conversation est sélectionnée
    if (!state.conversations || !state.users) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full bg-whatsapp-bg-chat">
        <div class="text-center">
          <div class="text-whatsapp-text-light">Chargement de la conversation...</div>
        </div>
      </div>`
    return
  }

  const messages = await messageService.getConversationMessages(state.selectedConversationId)
  setState({ ...state, messages, })

  const conversation = state.conversations.find(c => c.id === state.selectedConversationId)
  if (!conversation) return

  let displayName, displayAvatar
  
  if (conversation.type === 'group') {
    displayName = conversation.name
    displayAvatar = conversation.avatar || '../../public/avatars/group-default.png'
  } else {
    const otherParticipantId = conversation.participants.find(id => id !== state.currentUser.id)
    const otherParticipant = state.users.find(u => u.id === otherParticipantId)
    
    if (otherParticipant) {
      displayName = otherParticipant.username
      displayAvatar = otherParticipant.avatar || avatarService.getAvatar(otherParticipant.id)
    } else {
      displayName = 'Utilisateur inconnu'
      displayAvatar = '../../public/avatars/default.jpeg'
    }
  }

  const render = () => {
    container.innerHTML = `
      <div class="flex flex-col h-full bg-whatsapp-bg-chat">
        <!-- Header du chat -->
        <div class="flex items-center gap-3 p-4 bg-whatsapp-bg-light border-b border-whatsapp-bg-dark">
          <img src="${displayAvatar}" alt="${displayName}" class="w-10 h-10 rounded-full object-cover border border-whatsapp-bg-dark">
          <div class="flex-1">
            <h3 class="font-medium text-whatsapp-text-light">${displayName}</h3>
            <p class="text-sm text-whatsapp-text-secondary">
              ${conversation.type === 'group' ? `${conversation.participants.length} participants` : 'En ligne'}
            </p>
          </div>
          <div class="flex items-center gap-2">
            ${conversation.type === 'group' ? `
              <button id="group-info-btn" class="text-whatsapp-text-secondary hover:text-whatsapp-text-light p-2">
                <i class="fa-solid fa-info-circle"></i>
              </button>
            ` : ''}
            <button id="back-btn" class="md:hidden text-whatsapp-text-secondary hover:text-whatsapp-text-light p-2">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
          </div>
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
    
    messageService.markConversationAsRead(state.selectedConversationId, state.currentUser.id)
  }

  const setupChatEvents = (rerender) => {
    const backBtn = container.querySelector('#back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        setState({ ...state, selectedConversationId: null })
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

        try {
          const savedMessage = await messageService.sendMessage(
            state.selectedConversationId,
            state.currentUser.id,
            text
          )

          const updatedMessages = [...state.messages, savedMessage]
          setState({ ...state, messages: updatedMessages })

          messageInput.value = ''
          render()

          if (conversation.type === 'direct') {
            setTimeout(async () => {
              showTypingIndicator()
              
              setTimeout(async () => {
                hideTypingIndicator()
                
                render()
              }, 1500)
            }, 1000)
          }
        } catch (error) {
          console.error('Erreur envoi message:', error)
          alert('Erreur lors de l\'envoi du message')
        }
      })

      messageInput.focus()
    }

    const deleteButtons = container.querySelectorAll('.delete-message-btn')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const messageId = parseInt(btn.dataset.messageId)
        
        if (confirm('Supprimer ce message ?')) {
          try {
            await messageService.deleteMessage(messageId, state.currentUser.id)
            
            const updatedMessages = state.messages.map(m => 
              m.id === messageId 
                ? { ...m, isDeleted: true, text: 'Ce message a été supprimé' }
                : m
            )
            setState({ ...state, messages: updatedMessages })
            render()
          } catch (error) {
            console.error('Erreur suppression message:', error)
            alert('Erreur lors de la suppression du message')
          }
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
  return messages.map(message => {
    const isFromCurrentUser = message.senderId === state.currentUser.id
    const senderName = isFromCurrentUser ? 'Vous' : getSenderName(message.senderId)
    
    return `
      <div class="message-enter ${isFromCurrentUser ? 'text-right' : 'text-left'}">
        <div class="message-bubble ${isFromCurrentUser ? 'message-user' : 'message-contact'} inline-block p-3 rounded-lg relative group">
          ${!isFromCurrentUser && state.conversations.find(c => c.id === state.selectedConversationId)?.type === 'group' ? 
            `<p class="text-xs text-gray-400 mb-1">${senderName}</p>` : ''
          }
          <p class="text-sm text-white ${message.isDeleted ? 'italic text-gray-400' : ''}">${message.text}</p>
          <span class="text-xs text-gray-300 mt-1 block">${formatTime(message.timestamp)}</span>
          
          ${isFromCurrentUser && !message.isDeleted ? `
            <!-- Bouton supprimer (visible au hover) -->
            <button 
              class="delete-message-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              data-message-id="${message.id}"
              title="Supprimer le message"
            >
              ×
            </button>
          ` : ''}
        </div>
      </div>
    `
  }).join('')
}

const getSenderName = (senderId) => {
  const user = state.users.find(u => u.id === senderId)
  return user ? user.username : 'Utilisateur inconnu'
}

