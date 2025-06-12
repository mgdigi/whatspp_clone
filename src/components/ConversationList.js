import { state, setState } from '../utils/state.js'
import { conversationService } from '../services/conversationService.js'
import { userService } from '../services/userService.js'
import { avatarService } from '../services/avatarService.js'
import { formatTime } from '../utils/utils.js'

export const createConversationList = async (container, rerender) => {
  const conversations = await conversationService.getUserConversations(state.currentUser.id)
  setState({ ...state, conversations })

  const filteredConversations = await filterConversations(conversations, state.currentFilter, state.searchQuery)

  const render = async () => {
    if (filteredConversations.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-whatsapp-text-secondary">
          <p>Aucune conversation ${getFilterLabel(state.currentFilter)}</p>
        </div>
      `
      return 
    }

    const conversationsWithUserInfo = await Promise.all(
      filteredConversations.map(async (conv) => {
        if (conv.type === 'direct') {
          const otherUserId = conv.participants.find(id => id !== state.currentUser.id)
          const otherUser = await userService.getUserById(otherUserId)
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
    )

    container.innerHTML = conversationsWithUserInfo.map(conversation => {
      const avatarSrc = conversation.displayAvatar.startsWith('/avatars/') 
        ? avatarService.getAvatar(conversation.id)
        : conversation.displayAvatar

      return `
        <div class="conversation-item p-4 border-b border-whatsapp-bg-dark hover:bg-whatsapp-bg-dark cursor-pointer transition-colors ${state.selectedConversationId === conversation.id ? 'bg-whatsapp-bg-dark' : ''}" 
             data-conversation-id="${conversation.id}">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img src="${avatarSrc}" alt="${conversation.displayName}" class="w-12 h-12 rounded-full object-cover border border-whatsapp-bg-dark">
              ${conversation.isOnline ? '<div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-whatsapp-bg-light"></div>' : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="font-medium text-whatsapp-text-light truncate">${conversation.displayName}</h3>
                  ${conversation.type === 'group' ? '<span class="text-whatsapp-text-secondary text-xs">👥</span>' : ''}
                  ${conversation.isPinned ? '<span class="text-yellow-400 text-sm">📌</span>' : ''}
                  ${conversation.isArchived ? '<span class="text-whatsapp-text-secondary text-sm">📁</span>' : ''}
                </div>
                <span class="text-xs text-whatsapp-text-secondary">${formatTime(conversation.lastMessageTime)}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <p class="text-sm text-whatsapp-text-secondary truncate">${conversation.lastMessage}</p>
                ${conversation.unreadCount > 0 ? `<span class="bg-whatsapp-green text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">${conversation.unreadCount}</span>` : ''}
              </div>
            </div>
          </div>
          
          <!-- Actions (visibles au hover) -->
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
              ${conversation.type === 'group' && conversation.admins.includes(state.currentUser.id) ? `
                <button class="delete-group-btn text-xs px-2 py-1 rounded bg-red-500 text-white" 
                        data-conversation-id="${conversation.id}">
                  Supprimer groupe
                </button>
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
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const conversationId = parseInt(item.dataset.conversationId)
          setState({ ...state, selectedConversationId: conversationId })
          rerender()
        }
      })

      item.addEventListener('mouseenter', () => {
        const actions = item.querySelector('.conversation-actions')
        if (actions) {
          actions.classList.remove('hidden')
        }
      })

      item.addEventListener('mouseleave', () => {
        const actions = item.querySelector('.conversation-actions')
        if (actions) {
          actions.classList.add('hidden')
        }
      })
    })

    const pinButtons = container.querySelectorAll('.pin-btn')
    pinButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const conversationId = parseInt(btn.dataset.conversationId)
        
        try {
          await conversationService.togglePin(conversationId)
          const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
          setState({ ...state, conversations: updatedConversations })
          rerender()
        } catch (error) {
          alert('Erreur lors de l\'épinglage')
        }
      })
    })

    const archiveButtons = container.querySelectorAll('.archive-btn')
    archiveButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const conversationId = parseInt(btn.dataset.conversationId)
        
        try {
          await conversationService.toggleArchive(conversationId)
          const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
          setState({ ...state, conversations: updatedConversations })
          rerender()
        } catch (error) {
          alert('Erreur lors de l\'archivage')
        }
      })
    })

    const deleteGroupButtons = container.querySelectorAll('.delete-group-btn')
    deleteGroupButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const conversationId = parseInt(btn.dataset.conversationId)
        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.')) {
          try {
            await conversationService.deleteGroup(conversationId, state.currentUser.id)
            const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
            setState({ 
              ...state, 
              conversations: updatedConversations,
              selectedConversationId: state.selectedConversationId === conversationId ? null : state.selectedConversationId
            })
            rerender()
          } catch (error) {
            alert(error.message || 'Erreur lors de la suppression du groupe')
          }
        }
      })
    })
  }

  await render()
}

const filterConversations = async (conversations, filter, searchQuery) => {
  let filtered = conversations

  switch (filter) {
    case 'pinned':
      filtered = conversations.filter(c => c.isPinned && !c.isArchived)
      break
    case 'archived':
      filtered = conversations.filter(c => c.isArchived)
      break
    case 'all':
    default:
      filtered = conversations.filter(c => !c.isArchived)
      break
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = await Promise.all(
      filtered.map(async (conv) => {
        if (conv.type === 'direct') {
          const otherUserId = conv.participants.find(id => id !== state.currentUser.id)
          const otherUser = await userService.getUserById(otherUserId)
          const userName = otherUser?.name?.toLowerCase() || ''
          return userName.includes(query) ? conv : null
        } else {
          const groupName = conv.name?.toLowerCase() || ''
          return groupName.includes(query) ? conv : null
        }
      })
    )
    filtered = filtered.filter(conv => conv !== null)
  }

  return filtered.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
  })
}

const getFilterLabel = (filter) => {
  switch (filter) {
    case 'pinned':
      return 'épinglée'
    case 'archived':
      return 'archivée'
    default:
      return ''
  }
}