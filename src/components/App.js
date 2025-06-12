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
          conversations
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
    renderMainInterface()
  }

  const renderMainInterface = () => {
    container.innerHTML = `
      <div class="flex h-screen bg-whatsapp-bg-dark">
        <!-- Sidebar gauche avec icônes -->
        <div class="md:flex w-16 bg-whatsapp-bg-dark border-r border-whatsapp-bg-dark flex-col items-center justify-between">
          <div class="flex flex-col items-center mt-4">
            <button id="show-conversations-btn" class="bg-whatsapp-green text-white px-3 py-1 rounded-full text-sm hover:bg-whatsapp-dark-green transition-colors mt-4">
              <i class="fa-solid fa-message"></i>
            </button>
            <button id="show-contacts-btn" class="bg-whatsapp-bg-light text-whatsapp-text-secondary hover:text-white px-3 py-1 rounded-full text-sm mt-2">
             <i class="fa-solid fa-circle-notch"></i>
            </button>
            <button class="bg-whatsapp-bg-light text-whatsapp-text-secondary hover:text-white px-3 py-1 rounded-full text-sm mt-2">
              <i class="fa-solid fa-phone"></i>
            </button>
            <button class="bg-whatsapp-bg-light text-whatsapp-text-secondary hover:text-white px-3 py-1 rounded-full text-sm mt-2">
              <i class="fa-solid fa-users-viewfinder"></i>
            </button>
          </div>
          <div class="flex flex-col items-center gap-2 mb-4">
             
            <button id="logout-btn" class="bg-whatsapp-bg-light text-whatsapp-text-secondary hover:text-white px-3 py-1 rounded-full text-sm mt-2" title="Déconnexion">
              <i class="fa-solid fa-sign-out-alt text-xl"></i>
            </button>
            <button class="bg-whatsapp-bg-light text-whatsapp-text-secondary hover:text-white px-3 py-1 rounded-full text-sm mt-2">
              <i class="fa-solid fa-gear text-xl"></i>
            </button>
            <img src="../../public/avatars/default.jpeg" alt="" class="w-12 h-12 rounded-full object-cover border border-whatsapp-bg-dark">
          </div>
        </div>
       
        <!-- Panel des contacts/conversations -->
        <div class="w-full md:w-1/3 lg:w-1/4 bg-whatsapp-bg-light border-r border-whatsapp-bg-dark flex flex-col">
          <!-- Header -->
          <div class="p-4 bg-whatsapp-bg-light border-b border-whatsapp-bg-dark">
            <div class="flex items-center justify-between">
              <h1 class="text-xl font-semibold text-whatsapp-text-light">
                ${state.showConversationList ? 'Discussion' : 'Contacts'}
              </h1>
              <div class="flex items-center gap-2">
                <span class="text-sm text-whatsapp-text-secondary">
                  Bonjour, ${state.currentUser?.username || 'Utilisateur'}
                </span>
                <button id="add-section-btn" class="bg-whatsapp-green text-white px-3 py-1 rounded-full text-sm hover:bg-whatsapp-dark-green transition-colors">
                  +
                </button>
              </div>
            </div>
            <div>
              <input type="text" id="search-input" placeholder="${state.showConversationList ? 'Rechercher une conversation...' : 'Rechercher un contact...'}" value="${state.searchTerm || ''}" class="mt-2 w-full px-3 py-2 rounded bg-whatsapp-bg-dark text-whatsapp-text-light placeholder-whatsapp-text-secondary focus:outline-none focus:ring-2 focus:ring-whatsapp-green">
            </div>
            
            ${state.showConversationList ?  `
              <div class="mt-3 flex gap-2">
                <button id="filter-all" class="filter-btn px-3 py-1 rounded-full text-xs ${state.currentFilter === 'all' ? 'bg-whatsapp-green text-white' : 'bg-whatsapp-bg-dark text-whatsapp-text-secondary'}">
                  Tous
                </button>
                
                <button id="filter-archived" class="filter-btn px-3 py-1 rounded-full text-xs ${state.currentFilter === 'archived' ? 'bg-whatsapp-green text-white' : 'bg-whatsapp-bg-dark text-whatsapp-text-secondary'}">
                  Archivés
                </button>
              </div>
            ` : `<div class="mt-3 flex gap-2">
                <button id="filter-all" class="filter-btn px-3 py-1 rounded-full text-xs ${state.currentFilter === 'all' ? 'bg-whatsapp-green text-white' : 'bg-whatsapp-bg-dark text-whatsapp-text-secondary'}">
                  Tous
                </button>
                <button id="filter-favorites" class="filter-btn px-3 py-1 rounded-full text-xs ${state.currentFilter === 'favorites' ? 'bg-whatsapp-green text-white' : 'bg-whatsapp-bg-dark text-whatsapp-text-secondary'}">
                  Favoris
                </button>
                <button id="filter-archived" class="filter-btn px-3 py-1 rounded-full text-xs ${state.currentFilter === 'archived' ? 'bg-whatsapp-green text-white' : 'bg-whatsapp-bg-dark text-whatsapp-text-secondary'}">
                  Archivés
                </button>
              </div>`}
          </div>

          
          
          <div id="conversation-list" class="${state.showConversationList ? 'flex-1' : 'hidden'} overflow-y-auto custom-scrollbar">
            
          </div>

          
          <div id="contact-list" class="${state.showConversationList ? 'hidden' : 'flex-1'} overflow-y-auto custom-scrollbar">
          
          </div>
           
        </div>

        <!-- Zone de chat -->
        <div class="flex-1 flex flex-col">
          ${state.showContactForm ? '<div id="contact-form-modal" class="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"></div>' : ''}

          ${state.showGroupForm ? '<div id="group-form-modal" class="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"></div>' : ''}

          
          <div id="chat-window" class="flex-1 overflow-y-auto custom-scrollbar">
          </div>
        </div>
      </div>
    `

    

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

    setupEventListeners(render)
  }


  const setupEventListeners = (render) => {

    const showConversationsBtn = container.querySelector('#show-conversations-btn')
    const showContactsBtn = container.querySelector('#show-contacts-btn')
    
   

    // if(showAddContactBtn){
    //   showAddContactBtn.addEventListener('click', () => {
    //     console.log('clicked')
    //     setState({ ...state, showContactForm: true })
    //     render()
    //   })
    // }
    
    if (showConversationsBtn) {
      showConversationsBtn.addEventListener('click', (e) => {
        e.preventDefault()
        setState({ 
          ...state, 
          showConversationList: true,
          selectedContactId: null 
        })
        render()
      })
    }

    if (showContactsBtn) {
      showContactsBtn.addEventListener('click', () => {
        setState({ 
          ...state, 
          showConversationList: false,
          selectedConversationId: null 
        })
        render()
      })
    }

    

    const logoutBtn = container.querySelector('#logout-btn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authService.logout()
        
        setState({
          ...state,
          showLoginForm: true,
          currentUser: null,
          showChatWindow: false,
          selectedContactId: null,
          selectedConversationId: null,
          messages: [],
          conversations: []
        })
        
        render()
      })
    }

    const filterButtons = container.querySelectorAll('.filter-btn')
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filterId = e.target.id.replace('filter-', '')
        setState({ ...state, currentFilter: filterId })
        render()
      })
    })
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
