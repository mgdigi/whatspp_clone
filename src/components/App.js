import { createContactList } from './ContactList.js'
import { createChatWindow } from './ChatWindow.js'
import { createContactForm } from './ContactForm.js'
import { state, setState } from '../utils/state.js'
import { createLoginForm } from './LoginForm.js'
import { createConversationList } from './ConversationList.js'
import { authService } from '../services/authService.js'
import { conversationService } from '../services/conversationService.js'
import { userService } from '../services/userService.js' 
import { createGroupForm } from './GroupeForm.js'
import { renderMainInterface, setupEventListeners } from '../views/app.view.js'

export const createApp = (container) => {
  const isAuthenticated = authService.isAuthenticated()
  
  setState({
    selectedContactId: null,
    showContactForm: false,
    showGroupForm: false,
    contacts: [],
    messages: [],
    filteredContacts: [],
    currentFilter: 'all',
    searchTerm: '',
    showLoginForm: !isAuthenticated, 
    currentUser: isAuthenticated ? authService.getCurrentUser() : null,
    users: [],
    avatars: [],
    showChatWindow: isAuthenticated, 
    selectedConversationId: null,
    conversations: [],
    searchQuery: '',
    showConversationList: false,
  })

  const loadUserData = async () => {
    if (isAuthenticated && state.currentUser) {
      try {
        const users = await userService.getAllUsers() 
        const conversations = await conversationService.getUserConversations(state.currentUser.id)
        
        setState({
          ...state,
          users,
          conversations,
        })
        
        render()
      } catch (error) {
        console.error('Erreur chargement données utilisateur:', error)
      }
    }
  }

  const render = () => {
    if (state.showLoginForm) {
      createLoginForm(container, render)
      return 
    }
    
    renderMainInterfaceLogic()
  }

  const renderMainInterfaceLogic = () => {
    renderMainInterface(container, () => setupEventListenersLogic(render))

    const conversationListElement = container.querySelector('#conversation-list')
    const contactListElement = container.querySelector('#contact-list')
    const chatWindowElement = container.querySelector('#chat-window')
    const searchInput = container.querySelector('#search-input')

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim()
        setState({ ...state, searchTerm })
        
        if (state.showConversationList) {
          createConversationList(conversationListElement, render)
        } else {
          createContactList(contactListElement, render)
        }
      })
    }

    if (state.showConversationList) {
      createConversationList(conversationListElement, render)
    } else {
      createContactList(contactListElement, render)
    }
    
    createChatWindow(chatWindowElement, render)

    if (state.showContactForm) {
      const modalElement = container.querySelector('#contact-form-modal')
      createContactForm(modalElement, render)
    }

    if(state.showGroupForm) {
      const modalElement = container.querySelector('#group-form-modal')
      createGroupForm(modalElement, render)
    }
  }

  const setupEventListenersLogic = (render) => {
    setupEventListeners(container, render, authService, setState, state)
  }

  window.onLoginSuccess = (user) => {
    setState({
      ...state,
      showLoginForm: false,
      currentUser: user,
      showChatWindow: true
    })
    loadUserData() 
  }

  window.selectConversation = (conversationId) => {
    setState({
      ...state,
      selectedConversationId: conversationId,
      selectedContactId: null 
    })
    render()
  }

  if (isAuthenticated) {
    loadUserData()
  } else {
    render()
  }
}