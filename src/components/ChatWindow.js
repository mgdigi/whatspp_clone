import { state, setState } from '../utils/state.js'
import { messageService } from '../services/messageService.js'
import { conversationService, audioService } from '../services/conversationService.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'
import { mediaService } from '../services/mediaService.js'
import 'emoji-picker-element';

export const createChatWindow = async (container, rerender) => {
  if (!state.conversations || !state.users) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full bg-whatsapp-bg-chat">
        <div class="text-center">
          <div class="text-whatsapp-text-light">Chargement de la conversation...</div>
        </div>
      </div>`
    return
  }

  if (state.selectedConversationId) {
    await messageService.markConversationAsRead(state.selectedConversationId, state.currentUser.id)
    const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
    setState({ ...state, conversations: updatedConversations })
  }

  const messages = await messageService.getConversationMessages(state.selectedConversationId)
  setState({ ...state, messages })

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
  let selectedFiles = []

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



<div class="p-4 bg-whatsapp-bg-light border-t border-whatsapp-bg-dark">
  <form id="message-form" class="flex gap-3 items-end">
    <div class="flex-1 relative">
      <input
        type="text"
        id="message-input"
        placeholder="Tapez un message..."
        class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
      >
      <!-- Bouton emoji -->
      <button
        type="button"
        id="emoji-btn"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-whatsapp-text-secondary hover:text-whatsapp-text-light transition-colors"
        title="Emojis"
      >
        <i class="fa-solid fa-face-smile text-lg"></i>
      </button>
    </div>
    
    <button type="button" id="media-btn" class="bg-whatsapp-green text-white rounded-full p-2 hover:bg-whatsapp-dark-green transition-colors" title="Envoyer photo/vidéo">
      <i class="fa-solid fa-paperclip w-5 h-5"></i>
    </button>
    
    <button type="button" id="voice-btn" class="bg-whatsapp-green text-white rounded-full p-2 hover:bg-whatsapp-dark-green transition-colors" title="Message vocal">
      <i class="fa-solid fa-microphone w-5 h-5"></i>
    </button>
    
    <button type="submit" class="bg-whatsapp-green text-white rounded-full p-2 hover:bg-whatsapp-dark-green transition-colors">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
      </svg>
    </button>
  </form>

  <div id="emoji-picker-container" class="hidden absolute bottom-20 left-4 bg-white rounded-lg shadow-lg z-50">
    <emoji-picker></emoji-picker>
  </div>

  <input type="file" id="media-input" accept="image/*,video/*" multiple class="hidden">
</div>

`

    setupChatEvents(rerender)
    scrollToBottom()
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
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  const renderMessages = (messages) => {
  if (!messages || messages.length === 0) {
    return `
      <div class="text-center text-whatsapp-text-secondary py-8">
        <div class="text-4xl mb-2">💬</div>
        <p>Aucun message pour le moment</p>
        <p class="text-sm">Commencez la conversation !</p>
      </div>
    `
  }

  return messages.map(message => {
    const isCurrentUser = message.senderId === state.currentUser.id
    const senderName = getSenderName(message.senderId)
    const messageTime = formatTime(message.timestamp)
    const messageClass = isCurrentUser 
      ? 'message-user bg-whatsapp-green text-white ml-auto' 
      : 'message-contact bg-whatsapp-bg-light text-whatsapp-text-light'

    if (message.type === 'voice') {
      return `
        <div class="message-bubble ${messageClass} p-3 rounded-lg max-w-xs relative group">
          ${conversation.type === 'group' && !isCurrentUser ? `<div class="text-xs text-whatsapp-green font-medium mb-1">${senderName}</div>` : ''}
          <div class="flex items-center gap-3">
            <button class="play-voice-btn w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors" data-message-id="${message.id}">
              <i class="fa-solid fa-play text-sm"></i>
            </button>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <div class="flex-1 h-1 bg-white bg-opacity-30 rounded-full">
                  <div class="h-full bg-white rounded-full" style="width: 0%"></div>
                </div>
                <span class="text-xs opacity-75">${message.audioData ? audioService.formatDuration(message.audioData.duration) : '0:00'}</span>
              </div>
              <div class="text-xs opacity-75">Message vocal</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs opacity-75">${messageTime}</span>
            ${isCurrentUser ? `<div class="flex items-center gap-1">
              ${message.isImportant ? '<i class="fa-solid fa-star text-yellow-400 text-xs"></i>' : ''}
              <i class="fa-solid fa-check${message.isRead ? '-double text-blue-400' : ' text-gray-400'} text-xs"></i>
            </div>` : ''}
          </div>
        </div>
      `
    }

    // Messages média (image/vidéo)
    if (message.type === 'image' || message.type === 'video') {
      return `
        <div class="message-bubble ${messageClass} p-3 rounded-lg max-w-xs relative group">
          ${conversation.type === 'group' && !isCurrentUser ? `<div class="text-xs text-whatsapp-green font-medium mb-1">${senderName}</div>` : ''}
          <div class="message-content">
            ${renderMediaMessage(message)}
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs opacity-75">${messageTime}</span>
            ${isCurrentUser ? `<div class="flex items-center gap-1">
              ${message.isImportant ? '<i class="fa-solid fa-star text-yellow-400 text-xs"></i>' : ''}
              <i class="fa-solid fa-check${message.isRead ? '-double text-blue-400' : ' text-gray-400'} text-xs"></i>
            </div>` : ''}
          </div>
        </div>
      `
    }

    return `
      <div class="message-bubble ${messageClass} p-3 rounded-lg max-w-xs relative group">
        ${conversation.type === 'group' && !isCurrentUser ? `<div class="text-xs text-whatsapp-green font-medium mb-1">${senderName}</div>` : ''}
        <div class="message-content">
          <p class="break-words">${message.text}</p>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs opacity-75">${messageTime}</span>
          ${isCurrentUser ? `<div class="flex items-center gap-1">
            ${message.isImportant ? '<i class="fa-solid fa-star text-yellow-400 text-xs"></i>' : ''}
            <i class="fa-solid fa-check${message.isRead ? '-double text-blue-400' : ' text-gray-400'} text-xs"></i>
          </div>` : ''}
        </div>
      </div>
    `
  }).join('')
}


    const getSenderName = (senderId) => {
    const user = state.users.find(u => u.id === senderId)
    return user ? user.username : 'Utilisateur inconnu'
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

          const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
          setState({ ...state, conversations: updatedConversations })

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

          if (typeof window.globalRerender === 'function') {
            window.globalRerender()
          }

        } catch (error) {
          console.error('Erreur envoi message:', error)
          alert('Erreur lors de l\'envoi du message')
        }
      })

      messageInput.focus()
    }

    setupVoiceRecording(rerender)

    const importantButtons = container.querySelectorAll('.mark-important-btn')
    importantButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const messageId = parseInt(btn.dataset.messageId)
        
        try {
          await messageService.toggleImportant(messageId)
          const updatedMessages = await messageService.getConversationMessages(state.selectedConversationId)
          setState({ ...state, messages: updatedMessages })
          render()
        } catch (error) {
          console.error('Erreur marquage important:', error)
          alert('Erreur lors du marquage du message')
        }
      })
    })

    const deleteButtons = container.querySelectorAll('.delete-message-btn')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const messageId = parseInt(btn.dataset.messageId)
        if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
          try {
            await messageService.deleteMessage(messageId)
            const updatedMessages = await messageService.getConversationMessages(state.selectedConversationId)
            setState({ ...state, messages: updatedMessages })
            render()
          } catch (error) {
            console.error('Erreur suppression message:', error)
            alert('Erreur lors de la suppression du message')
          }
        }
      })
    })

    const playButtons = container.querySelectorAll('.play-voice-btn')
    playButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const messageId = btn.dataset.messageId
        const message = state.messages.find(m => m.id == messageId)
        
        if (message && message.type === 'voice' && message.audioData) {
          playVoiceMessage(message, btn)
        }
      })
    })

    const mediaBtn = container.querySelector('#media-btn')
const mediaInput = container.querySelector('#media-input')

if (mediaBtn && mediaInput) {
  mediaBtn.addEventListener('click', () => {
    mediaInput.click()
  })

  mediaInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const validFiles = []
    const errors = []

    for (const file of files) {
      const validation = mediaService.validateMediaFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      alert('Erreurs de validation:\n' + errors.join('\n'))
    }

    if (validFiles.length > 0) {
      selectedFiles = validFiles
      await showMediaPreview()
    }

    mediaInput.value = ''
  })
}


const emojiBtn = container.querySelector('#emoji-btn')
const emojiPickerContainer = container.querySelector('#emoji-picker-container')
const emojiPicker = container.querySelector('emoji-picker')

if (emojiBtn && emojiPickerContainer && emojiPicker) {
  emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    emojiPickerContainer.classList.toggle('hidden')
  })

  emojiPicker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.emoji.unicode
    const currentValue = messageInput.value
    const cursorPosition = messageInput.selectionStart
    
    const newValue = currentValue.slice(0, cursorPosition) + emoji + currentValue.slice(cursorPosition)
    messageInput.value = newValue
    
    const newCursorPosition = cursorPosition + emoji.length
    messageInput.setSelectionRange(newCursorPosition, newCursorPosition)
    
    emojiPickerContainer.classList.add('hidden')
    messageInput.focus()
  })

  document.addEventListener('click', (e) => {
    if (!emojiPickerContainer.contains(e.target) && e.target !== emojiBtn) {
      emojiPickerContainer.classList.add('hidden')
    }
  })
}


setupMediaPreviewEvents()
  }


const showMediaPreview = async () => {
  const modal = container.querySelector('#media-preview-modal')
  const previewContainer = container.querySelector('#media-preview-container')
  
  modal.classList.remove('hidden')
  previewContainer.innerHTML = ''

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i]
    const validation = mediaService.validateMediaFile(file)
    
    if (!validation.isValid) continue

    const previewItem = document.createElement('div')
    previewItem.className = 'media-preview-item relative bg-whatsapp-bg-dark rounded-lg overflow-hidden'
    
    if (validation.type === 'image') {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(file)
      img.className = 'w-full h-auto max-h-48 object-cover'
      previewItem.appendChild(img)
    } else if (validation.type === 'video') {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(file)
      video.className = 'w-full h-auto max-h-48 object-cover'
      video.controls = false
      video.muted = true
      previewItem.appendChild(video)

      try {
        const duration = await mediaService.getVideoDuration(file)
        if (duration > 0) {
          const durationSpan = document.createElement('span')
          durationSpan.className = 'video-duration absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'
          durationSpan.textContent = mediaService.formatDuration(duration)
          previewItem.appendChild(durationSpan)
        }
      } catch (error) {
        console.error('Erreur récupération durée:', error)
      }
    }

    const removeBtn = document.createElement('button')
    removeBtn.className = 'media-preview-remove absolute top-2 right-2 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600'
    removeBtn.innerHTML = '<i class="fa-solid fa-times text-xs"></i>'
    removeBtn.addEventListener('click', () => {
      selectedFiles.splice(i, 1)
      showMediaPreview()
    })
    previewItem.appendChild(removeBtn)

    const fileInfo = document.createElement('div')
    fileInfo.className = 'media-info absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2'
    fileInfo.innerHTML = `
      <div class="text-xs">${file.name}</div>
      <div class="text-xs opacity-75">${mediaService.formatFileSize(file.size)}</div>
    `
    previewItem.appendChild(fileInfo)

    previewContainer.appendChild(previewItem)
  }
}

const setupMediaPreviewEvents = () => {
  const modal = container.querySelector('#media-preview-modal')
  const closeBtn = container.querySelector('#close-media-preview')
  const cancelBtn = container.querySelector('#cancel-media-send')
  const sendBtn = container.querySelector('#send-media')

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden')
      selectedFiles = []
    })
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden')
      selectedFiles = []
    })
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      await sendMediaMessages()
    })
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
      selectedFiles = []
    }
  })
}

const sendMediaMessages = async () => {
  const caption = container.querySelector('#media-caption').value.trim()
  const modal = container.querySelector('#media-preview-modal')
  
  try {
    for (const file of selectedFiles) {
      const mediaData = await mediaService.saveMedia(
        file, 
        state.selectedConversationId, 
        state.currentUser.id
      )

      const message = {
        conversationId: state.selectedConversationId,
        senderId: state.currentUser.id,
        text: caption || (mediaData.type === 'image' ? '📷 Photo' : '🎥 Vidéo'),
        type: mediaData.type,
        mediaData: {
          base64Data: mediaData.base64Data,
          thumbnail: mediaData.thumbnail,
          duration: mediaData.duration,
          size: mediaData.size,
          fileName: mediaData.fileName,
          originalName: mediaData.originalName,
          mimeType: mediaData.mimeType
        },
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: [state.currentUser.id],
        isDeleted: false
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

      const savedMessage = await response.json()

      await conversationService.updateLastMessage(state.selectedConversationId, savedMessage)
    }

    const updatedMessages = await messageService.getConversationMessages(state.selectedConversationId)
    setState({ ...state, messages: updatedMessages })

    const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
    setState({ ...state, conversations: updatedConversations })

    modal.classList.add('hidden')
    selectedFiles = []
    container.querySelector('#media-caption').value = ''

    render()

    if (typeof window.globalRerender === 'function') {
      window.globalRerender()
    }

  } catch (error) {
    console.error('Erreur envoi médias:', error)
    alert('Erreur lors de l\'envoi des médias')
  }
}

window.openImageModal = (imageSrc) => {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="relative max-w-4xl max-h-4xl">
      <img src="${imageSrc}" alt="Image" class="max-w-full max-h-full object-contain">
      <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300" onclick="this.parentElement.parentElement.remove()">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `
  document.body.appendChild(modal)
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })
}


  const setupVoiceRecording = (rerender) => {
    const voiceBtn = container.querySelector('#voice-btn')
    const voiceRecorder = container.querySelector('#voice-recorder')
    const cancelBtn = container.querySelector('#cancel-recording')
    const sendBtn = container.querySelector('#send-recording')
    const timerElement = container.querySelector('#recording-timer')
    
    let recordingTimer = null
    let recordingStartTime = null

    if (voiceBtn) {
      voiceBtn.addEventListener('click', async () => {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' })
          if (permission.state === 'denied') {
            alert('Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.')
            return
          }

          await audioService.startRecording()
          
          voiceRecorder.classList.remove('hidden')
          
          recordingStartTime = Date.now()
          recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
            timerElement.textContent = audioService.formatDuration(elapsed)
            
            if (elapsed >= 300) {
              sendRecording()
            }
          }, 1000)

        } catch (error) {
          console.error('Erreur démarrage enregistrement:', error)
          alert('Impossible d\'accéder au microphone. Vérifiez vos paramètres.')
        }
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cancelRecording()
      })
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        sendRecording()
      })
    }

    if (voiceRecorder) {
      voiceRecorder.addEventListener('click', (e) => {
        if (e.target === voiceRecorder) {
          cancelRecording()
        }
      })
    }

    const cancelRecording = () => {
      if (recordingTimer) {
        clearInterval(recordingTimer)
        recordingTimer = null
      }
      
      audioService.cancelRecording()
      voiceRecorder.classList.add('hidden')
      timerElement.textContent = '0:00'
    }

    const sendRecording = async () => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
      
      if (elapsed < 1) {
        alert('Enregistrement trop court (minimum 1 seconde)')
        return
      }

      if (recordingTimer) {
        clearInterval(recordingTimer)
        recordingTimer = null
      }

      try {
        const audioBlob = await audioService.stopRecording()
        
        voiceRecorder.classList.add('hidden')
        timerElement.textContent = '0:00'

        await sendVoiceMessage(audioBlob, rerender)

      } catch (error) {
        console.error('Erreur envoi message vocal:', error)
        alert('Erreur lors de l\'envoi du message vocal')
        cancelRecording()
      }
    }
  }

  const sendVoiceMessage = async (audioBlob, rerender) => {
    try {
      const audioData = await audioService.saveAudioMessage(
        audioBlob, 
        state.selectedConversationId, 
        state.currentUser.id
      )
      
      const message = {
        conversationId: state.selectedConversationId,
        senderId: state.currentUser.id,
        text: '🎤 Message vocal',
        type: 'voice',
        audioData: {
          base64: audioData.base64Audio,
          duration: audioData.duration,
          fileName: audioData.fileName,
          size: audioData.size
        },
        timestamp: new Date().toISOString(),
        isRead: false,
        readBy: [state.currentUser.id],
        isDeleted: false
      }

      const response = await fetch('https://json-server-7n1p.onrender.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })

      const savedMessage = await response.json()

      await conversationService.updateLastMessage(state.selectedConversationId, savedMessage)

      const updatedMessages = [...state.messages, savedMessage]
      setState({ ...state, messages: updatedMessages })

      const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
      setState({ ...state, conversations: updatedConversations })

      render()

      if (typeof window.globalRerender === 'function') {
        window.globalRerender()
      }

    } catch (error) {
      console.error('Erreur envoi message vocal:', error)
      throw error
    }
  }

  const playVoiceMessage = (message, button) => {
    const audio = new Audio(message.audioData.base64)
    const icon = button.querySelector('i')
    const originalClass = icon.className
    
    icon.className = 'fa-solid fa-pause'
    button.disabled = true

    audio.onended = () => {
      icon.className = originalClass
      button.disabled = false
    }

    audio.onerror = () => {
      icon.className = originalClass
      button.disabled = false
      alert('Erreur lors de la lecture du message vocal')
    }

    audio.play().catch(error => {
      console.error('Erreur lecture audio:', error)
      icon.className = originalClass
      button.disabled = false
      alert('Impossible de lire le message vocal')
    })
  }

  render()
}

const renderMediaMessage = (message) => {
  if (message.type === 'image') {
    return `
      <div class="media-message">
        <img src="${message.mediaData.base64Data}" alt="Image" 
             class="max-w-xs rounded-lg cursor-pointer" 
             onclick="openImageModal('${message.mediaData.base64Data}')">
        ${message.text && message.text !== '📷 Photo' ? `<p class="mt-2 text-sm">${message.text}</p>` : ''}
      </div>
    `
  } else if (message.type === 'video') {
    return `
      <div class="media-message relative">
        <video controls class="max-w-xs rounded-lg" ${message.mediaData.thumbnail ? `poster="${message.mediaData.thumbnail}"` : ''}>
          <source src="${message.mediaData.base64Data}" type="${message.mediaData.mimeType}">
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
        ${message.mediaData.duration ? `
          <span class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            ${mediaService.formatDuration(message.mediaData.duration)}
          </span>
        ` : ''}
        ${message.text && message.text !== '🎥 Vidéo' ? `<p class="mt-2 text-sm">${message.text}</p>` : ''}
      </div>
    `
  }
  return ''
}

