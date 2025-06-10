import { state, setState } from '../utils/state.js'
import { contactsService } from '../services/api.js'
import { avatarService } from '../services/avatarService.js'

export const createContactList = async (container, rerender) => {
  const contacts = await contactsService.getAll()
  setState({ ...state, contacts })

  // Application du filtre ET de la recherche
  let filteredContacts = filterContacts(contacts, state.currentFilter)
  
  // Application de la recherche si un terme est présent
  if (state.searchTerm && state.searchTerm.trim() !== '') {
    const searchTerm = state.searchTerm.toLowerCase()
    filteredContacts = filteredContacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.phone.includes(searchTerm)
    )
  }

  const render = () => {
    if (filteredContacts.length === 0) {
      const message = state.searchTerm && state.searchTerm.trim() !== '' 
        ? `Aucun contact trouvé pour "${state.searchTerm}"`
        : `Aucun contact ${getFilterLabel(state.currentFilter)}`
      
      container.innerHTML = `
        <div class="p-4 text-center text-whatsapp-text-secondary">
          <p>${message}</p>
        </div>
      `
      return
    }

    container.innerHTML = filteredContacts.map(contact => {
      const avatarSrc = contact.avatar.startsWith('/avatars/') 
        ? avatarService.getAvatar(contact.id)
        : contact.avatar

      return `
        <div class="contact-item p-4 border-b border-whatsapp-bg-dark  cursor-pointer transition-colors ${state.selectedContactId === contact.id ? 'bg-whatsapp-bg-dark' : ''}" 
             data-contact-id="${contact.id}">
          <div class="flex items-center gap-3">
            <img src="${avatarSrc}" alt="${contact.name}" class="w-12 h-12 rounded-full object-cover border border-whatsapp-bg-dark">
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-whatsapp-text-light truncate">${highlightSearchTerm(contact.name, state.searchTerm)}</h3>
                <div class="flex items-center gap-2">
                  ${contact.isFavorite ? '<span class="text-yellow-400 text-sm"><i class="fa-solid fa-heart text-red-500"></i></span>' : ''}
                  ${contact.isArchived ? '<span class="text-whatsapp-text-secondary text-sm"><i class="fa-solid fa-box-archive text-2xl"></i></span>' : ''}
                  <span class="text-xs text-whatsapp-text-secondary">${contact.lastMessageTime}</span>
                </div>
              </div>
              <div class="flex items-center justify-between mt-1">
                <p class="text-sm text-whatsapp-text-secondary truncate">${contact.lastMessage}</p>
                ${contact.unreadCount > 0 ? `<span class="bg-whatsapp-green text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">${contact.unreadCount}</span>` : ''}
              </div>
            </div>
          </div>
          
          <!-- Actions (visibles au hover) -->
          <div class="contact-actions mt-2 hidden">
            <div class="flex gap-2">
              <button class="favorite-btn text-xs px-2 py-1 rounded ${contact.isFavorite ? 'bg-yellow-500 text-white' : 'bg-whatsapp-bg-chat text-whatsapp-text-secondary'}" 
                      data-contact-id="${contact.id}">
                ${contact.isFavorite ? 'Retirer favori' : 'Favori'}
              </button>
              <button class="archive-btn text-xs px-2 py-1 rounded ${contact.isArchived ? 'bg-blue-500 text-white' : 'bg-whatsapp-bg-chat text-whatsapp-text-secondary'}" 
                      data-contact-id="${contact.id}">
                ${contact.isArchived ? 'Désarchiver' : 'Archiver'}
              </button>
              <button class="edit-avatar-btn text-xs px-2 py-1 rounded bg-whatsapp-green text-white" 
                      data-contact-id="${contact.id}">
                Photo
              </button>
              <button class="delete-btn text-xs px-2 py-1 rounded bg-red-500 text-white" 
                      data-contact-id="${contact.id}">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')

    setupContactListEvents(rerender)
  }

  const setupContactListEvents = (rerender) => {
    const contactItems = container.querySelectorAll('.contact-item')
    contactItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const contactId = parseInt(item.dataset.contactId)
          setState({ ...state, selectedContactId: contactId })
          rerender()
        }
      })

      item.addEventListener('mouseenter', () => {
        const actions = item.querySelector('.contact-actions')
        if (actions) {
          actions.classList.remove('hidden')
        }
      })

      item.addEventListener('mouseleave', () => {
        const actions = item.querySelector('.contact-actions')
        if (actions) {
          actions.classList.add('hidden')
        }
      })
    })

    const favoriteButtons = container.querySelectorAll('.favorite-btn')
    favoriteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const contactId = parseInt(btn.dataset.contactId)
        const contact = state.contacts.find(c => c.id === contactId)
        
        await contactsService.update(contactId, {
          ...contact,
          isFavorite: !contact.isFavorite
        })

        const updatedContacts = await contactsService.getAll()
        setState({ ...state, contacts: updatedContacts })
        rerender()
      })
    })

    const archiveButtons = container.querySelectorAll('.archive-btn')
    archiveButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const contactId = parseInt(btn.dataset.contactId)
        const contact = state.contacts.find(c => c.id === contactId)
        
        await contactsService.update(contactId, {
          ...contact,
          isArchived: !contact.isArchived
        })

        const updatedContacts = await contactsService.getAll()
        setState({ ...state, contacts: updatedContacts })
        rerender()
      })
    })

    const editAvatarButtons = container.querySelectorAll('.edit-avatar-btn')
    editAvatarButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const contactId = parseInt(btn.dataset.contactId)
        
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = 'image/*'
        
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0]
          if (file) {
            const validation = avatarService.validateImageFile(file)
            
            if (!validation.isValid) {
              alert(validation.errors.join('\n'))
              return
            }
            
            try {
              const avatarPath = await avatarService.saveAvatar(file, contactId)
              
              const contact = state.contacts.find(c => c.id === contactId)
              await contactsService.update(contactId, {
                ...contact,
                avatar: avatarPath
              })
              
              const updatedContacts = await contactsService.getAll()
              setState({ ...state, contacts: updatedContacts })
              rerender()
            } catch (error) {
              console.error('Erreur lors de la mise à jour de l\'avatar:', error)
              alert('Erreur lors de la mise à jour de la photo de profil')
            }
          }
        })
        
        fileInput.click()
      })
    })

    const deleteButtons = container.querySelectorAll('.delete-btn')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const contactId = parseInt(btn.dataset.contactId)
        
        if (confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
          avatarService.deleteAvatar(contactId)
          
          await contactsService.delete(contactId)
          
          const updatedContacts = await contactsService.getAll()
          setState({ 
            ...state, 
            contacts: updatedContacts,
            selectedContactId: state.selectedContactId === contactId ? null : state.selectedContactId
          })
          rerender()
        }
      })
    })
  }

  render()
}

const filterContacts = (contacts, filter) => {
  switch (filter) {
    case 'favorites':
      return contacts.filter(c => c.isFavorite && !c.isArchived)
    case 'archived':
      return contacts.filter(c => c.isArchived)
    case 'all':
    default:
      return contacts.filter(c => !c.isArchived)
  }
}

const getFilterLabel = (filter) => {
  switch (filter) {
    case 'favorites':
      return 'favori'
    case 'archived':
      return 'archivé'
    default:
      return ''
  }
}

// Fonction pour surligner le terme recherché dans le nom
const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return text
  }
  
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<span class="bg-yellow-400 text-black">$1</span>')
}