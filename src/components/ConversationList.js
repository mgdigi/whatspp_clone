import { state, setState } from '../utils/state.js'
import { conversationService } from '../services/conversationService.js'
import { userService } from '../services/userService.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'

export const createConversationList = async (container, rerender) => {
  // Charger les conversations et les utilisateurs en parallèle
  const [conversations, allUsers] = await Promise.all([
    conversationService.getUserConversations(state.currentUser.id),
    userService.getAllUsers()
  ])

  // Créer un cache des utilisateurs pour éviter les appels répétés
  const usersCache = new Map()
  allUsers.forEach(user => {
    usersCache.set(user.id, user)
  })

  setState({ ...state, conversations, usersCache })

  const filteredConversations = await filterConversations(conversations, state.currentFilter, state.searchQuery, usersCache)

  const render = async () => {
    if (filteredConversations.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-whatsapp-text-secondary">
          <p>Aucune conversation ${getFilterLabel(state.currentFilter)}</p>
        </div>
      `
      return
    }

    // Traitement en parallèle des conversations avec cache
    const conversationsWithUserInfo = filteredConversations.map((conv) => {
      if (conv.type === 'direct') {
        const otherUserId = conv.participants.find(id => id !== state.currentUser.id)
        const otherUser = usersCache.get(otherUserId)
        
        return {
          ...conv,
          displayName: otherUser?.name || 'Utilisateur inconnu',
          displayAvatar: otherUser?.avatar || '/avatars/default.jpg',
          isOnline: otherUser?.isOnline || false
        }
      }
      
      return {
        ...conv,
        displayName: conv.name,
        displayAvatar: conv.avatar || '/avatars/group-default.jpg',
        isOnline: false
      }
    })

    container.innerHTML = conversationsWithUserInfo.map(conversation => {
      const avatarSrc = conversation.displayAvatar.startsWith('/avatars/') 
        ? avatarService.getAvatar(conversation.id)
        : conversation.displayAvatar

      return `
        <div class="conversation-item p-4 border-b border-whatsapp-bg-dark hover:bg-whatsapp-bg-dark cursor-pointer transition-colors ${state.selectedConversationId === conversation.id ? 'bg-whatsapp-bg-dark' : ''}" 
             data-conversation-id="${conversation.id}">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img src="${avatarSrc}" 
                   alt="${conversation.displayName}" 
                   class="w-12 h-12 rounded-full object-cover border border-whatsapp-bg-dark"
                   loading="lazy">
              ${conversation.isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-whatsapp-bg-light"></div>' : ''}
              ${conversation.unreadCount > 0 ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-whatsapp-bg-light"></div>' : ''}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-whatsapp-text-light truncate ${conversation.unreadCount > 0 ? 'font-bold' : ''}">
                    ${conversation.displayName}
                  </h3>
                  ${conversation.type === 'group' ? '<span class="text-whatsapp-text-secondary text-xs">👥</span>' : ''}
                  ${conversation.isPinned ? '<span class="text-yellow-400 text-sm">📌</span>' : ''}
                  ${conversation.isArchived ? '<span class="text-whatsapp-text-secondary text-sm">📁</span>' : ''}
                </div>
                <span class="text-xs text-whatsapp-text-secondary">${formatTime(conversation.lastMessageTime)}</span>
              </div>
              
              <div class="flex items-center justify-between mt-1">
                <p class="text-sm text-whatsapp-text-secondary truncate ${conversation.unreadCount > 0 ? 'text-whatsapp-text-light font-medium' : ''}">
                  ${conversation.lastMessage}
                </p>
                ${conversation.unreadCount > 0 ? `<span class="bg-whatsapp-green text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">${conversation.unreadCount}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="conversation-actions mt-2 hidden">
            <div class="flex gap-2 flex-wrap">
              <button class="pin-btn text-xs px-2 py-1 rounded ${conversation.isPinned ? 'bg-yellow-500 text-white' : 'bg-whatsapp-bg-chat text-whatsapp-text-secondary'}" 
                      data-conversation-id="${conversation.id}">
                ${conversation.isPinned ? 'Désépingler' : 'Épingler'}
              </button>
              
              <button class="archive-btn text-xs px-2 py-1 rounded ${conversation.isArchived ? 'bg-blue-500 text-white' : 'bg-whatsapp-bg-chat text-whatsapp-text-secondary'}" 
                      data-conversation-id="${conversation.id}">
                ${conversation.isArchived ? 'Désarchiver' : 'Archiver'}
              </button>
              
              ${conversation.type === 'group' ? `
                <button class="group-info-btn text-xs px-2 py-1 rounded bg-purple-500 text-white" 
                        data-conversation-id="${conversation.id}">
                  Info groupe
                </button>
                ${conversation.admins && conversation.admins.includes(state.currentUser.id) ? `
                  <button class="delete-group-btn text-xs px-2 py-1 rounded bg-red-500 text-white" 
                          data-conversation-id="${conversation.id}">
                    Supprimer groupe
                  </button>
                ` : `
                  <button class="leave-group-btn text-xs px-2 py-1 rounded bg-orange-500 text-white" 
                          data-conversation-id="${conversation.id}">
                    Quitter groupe
                  </button>
                `}
              ` : ''}
            </div>
          </div>
        </div>
      `
    }).join('')

    setupConversationListEvents(rerender)
  }

  const setupConversationListEvents = (rerender) => {
    const conversationItems = container.querySelectorAll('.conversation-item')
    
    conversationItems.forEach(item => {
      // Optimisation: utiliser une seule fonction pour le clic
      item.addEventListener('click', handleConversationClick, { passive: true })
      
      // Optimisation: debounce pour les événements hover
      let hoverTimeout
      item.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout)
        const actions = item.querySelector('.conversation-actions')
        if (actions) {
          actions.classList.remove('hidden')
        }
      }, { passive: true })

      item.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
          const actions = item.querySelector('.conversation-actions')
          if (actions) {
            actions.classList.add('hidden')
          }
        }, 100)
      }, { passive: true })
    })

    // Fonction optimisée pour gérer les clics avec marquage automatique comme lu
    async function handleConversationClick(e) {
      if (!e.target.closest('button')) {
        const conversationId = parseInt(this.dataset.conversationId)
        
        // Optimisation: éviter le re-render si c'est déjà sélectionné
        if (state.selectedConversationId !== conversationId) {
          // Trouver la conversation sélectionnée
          const selectedConversation = state.conversations.find(c => c.id === conversationId)
          
          // Si la conversation a des messages non lus, les marquer comme lus automatiquement
          if (selectedConversation && selectedConversation.unreadCount > 0) {
            try {
              // Marquer la conversation comme lue en arrière-plan
              await conversationService.markConversationAsRead(conversationId, state.currentUser.id)
              
              // Mettre à jour immédiatement l'état local pour un feedback instantané
              const updatedConversations = state.conversations.map(conv => 
                conv.id === conversationId 
                  ? { ...conv, unreadCount: 0 }
                  : conv
              )
              
              setState({ 
                ...state, 
                selectedConversationId: conversationId,
                conversations: updatedConversations
              })
              
              // Recharger les conversations depuis le serveur en arrière-plan
              conversationService.getUserConversations(state.currentUser.id)
                .then(serverConversations => {
                  setState(prevState => ({ 
                    ...prevState, 
                    conversations: serverConversations 
                  }))
                  // Re-render silencieux pour mettre à jour l'UI
                  if (typeof window.globalRerender === 'function') {
                    window.globalRerender()
                  }
                })
                .catch(error => {
                  console.error('Erreur rechargement conversations:', error)
                })
              
            } catch (error) {
              console.error('Erreur marquage comme lu:', error)
              // Même en cas d'erreur, on sélectionne la conversation
              setState({ ...state, selectedConversationId: conversationId })
            }
          } else {
            // Pas de messages non lus, sélection simple
            setState({ ...state, selectedConversationId: conversationId })
          }
          
          rerender()
        }
      }
    }

    // Délégation d'événements pour les boutons
    container.addEventListener('click', async (e) => {
      const button = e.target.closest('button')
      if (!button) return

      e.stopPropagation()
      const conversationId = parseInt(button.dataset.conversationId)

      try {
        if (button.classList.contains('pin-btn')) {
          await handlePinToggle(conversationId, rerender)
        } else if (button.classList.contains('archive-btn')) {
          await handleArchiveToggle(conversationId, rerender)
        } else if (button.classList.contains('group-info-btn')) {
          handleGroupInfo(conversationId, rerender)
        } else if (button.classList.contains('leave-group-btn')) {
          await handleLeaveGroup(conversationId, rerender)
        } else if (button.classList.contains('delete-group-btn')) {
          await handleDeleteGroup(conversationId, rerender)
        }
      } catch (error) {
        console.error('Erreur action conversation:', error)
        alert('Une erreur est survenue')
      }
    })
  }

  // Fonctions d'action optimisées (sans le bouton marquer comme lu)
  const handlePinToggle = async (conversationId, rerender) => {
    await conversationService.togglePin(conversationId)
    await refreshConversations(rerender)
  }

  const handleArchiveToggle = async (conversationId, rerender) => {
    await conversationService.toggleArchive(conversationId)
    await refreshConversations(rerender)
  }

  const handleGroupInfo = (conversationId, rerender) => {
    setState({
      ...state,
      showGroupInfo: true,
      selectedConversationId: conversationId
    })
    rerender()
  }

  const handleLeaveGroup = async (conversationId, rerender) => {
    if (confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
      await conversationService.leaveGroup(conversationId, state.currentUser.id)
      setState({
        ...state,
        conversations: await conversationService.getUserConversations(state.currentUser.id),
        selectedConversationId: state.selectedConversationId === conversationId ? null : state.selectedConversationId
      })
      rerender()
    }
  }

  const handleDeleteGroup = async (conversationId, rerender) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.')) {
      await conversationService.deleteGroup(conversationId, state.currentUser.id)
      setState({
        ...state,
        conversations: await conversationService.getUserConversations(state.currentUser.id),
        selectedConversationId: state.selectedConversationId === conversationId ? null : state.selectedConversationId
      })
      rerender()
    }
  }

  // Fonction utilitaire pour rafraîchir les conversations
  const refreshConversations = async (rerender) => {
    const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
    setState({ ...state, conversations: updatedConversations })
    rerender()
  }

  await render()
}

// Fonction de filtrage optimisée avec cache
const filterConversations = async (conversations, filter, searchQuery, usersCache) => {
  let filtered = conversations

  switch (filter) {
    case 'pinned':
      filtered = conversations.filter(c => c.isPinned && !c.isArchived)
      break
    case 'archived':
      filtered = conversations.filter(c => c.isArchived)
      break
    case 'unread':
      filtered = conversations.filter(c => c.unreadCount > 0 && !c.isArchived)
      break
    case 'groups':
      filtered = conversations.filter(c => c.type === 'group' && !c.isArchived)
      break
    case 'direct':
      filtered = conversations.filter(c => c.type === 'direct' && !c.isArchived)
      break
    case 'all':
    default:
      filtered = conversations.filter(c => !c.isArchived)
      break
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter((conv) => {
      if (conv.type === 'direct') {
        const otherUserId = conv.participants.find(id => id !== state.currentUser.id)
        const otherUser = usersCache.get(otherUserId)
        const userName = otherUser?.name?.toLowerCase() || ''
        return userName.includes(query)
      } else {
        const groupName = conv.name?.toLowerCase() || ''
        return group
                return groupName.includes(query)
      }
    })
  }

  return filtered.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  })
}

const getFilterLabel = (filter) => {
  switch (filter) {
    case 'pinned':
      return 'épinglée'
    case 'archived':
      return 'archivée'
    case 'unread':
      return 'non lue'
    case 'groups':
      return 'de groupe'
    case 'direct':
      return 'directe'
    default:
      return ''
  }
}

