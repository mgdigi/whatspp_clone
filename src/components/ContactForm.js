import { state, setState } from '../utils/state.js'
import { contactsService } from '../services/api.js'

export const createContactForm = (container, rerender) => {
  container.innerHTML = `
    <div class="bg-whatsapp-bg-light rounded-lg p-6 w-full max-w-md mx-4">
      <h2 class="text-xl font-semibold text-whatsapp-text-light mb-4">Nouveau Contact</h2>
      
      <form id="contact-form" class="space-y-4">
        <div>
          <label for="contact-name" class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Nom *
          </label>
          <input
            type="text"
            id="contact-name"
            required
            class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            placeholder="Nom du contact"
          >
        </div>

        <div>
          <label for="contact-phone" class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Téléphone *
          </label>
          <input
            type="tel"
            id="contact-phone"
            required
            class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            placeholder="+221 78 011 82 23"
          >
        </div>

        <div>
          <label for="contact-avatar" class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Photo de profil
          </label>
          <div class="space-y-3">
            <!-- Prévisualisation de l'image -->
            <div id="avatar-preview" class="hidden">
              <img id="preview-image" src="" alt="Aperçu" class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-whatsapp-green">
            </div>
            
            <!-- Input file -->
            <input
              type="file"
              id="contact-avatar"
              accept="image/*"
              class="hidden"
            >
            
            <!-- Bouton personnalisé pour l'upload -->
            <button
              type="button"
              id="upload-btn"
              class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-3 py-2 border-2 border-dashed border-whatsapp-text-secondary hover:border-whatsapp-green transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Choisir une photo
            </button>
            
            <!-- Bouton pour supprimer l'image -->
            <button
              type="button"
              id="remove-avatar-btn"
              class="hidden w-full bg-red-500 text-white rounded-lg px-3 py-2 hover:bg-red-600 transition-colors"
            >
              Supprimer la photo
            </button>
          </div>
          <p class="text-xs text-whatsapp-text-secondary mt-1">
            Formats acceptés : JPG, PNG, GIF (max 5MB)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            id="contact-favorite"
            class="rounded text-whatsapp-green focus:ring-whatsapp-green"
          >
          <label for="contact-favorite" class="text-sm text-whatsapp-text-light">
            Ajouter aux favoris
          </label>
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="button"
            id="cancel-btn"
            class="flex-1 bg-whatsapp-bg-dark text-whatsapp-text-secondary py-2 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="flex-1 bg-whatsapp-green text-white py-2 rounded-lg hover:bg-whatsapp-dark-green transition-colors"
          >
            Créer
          </button>
        </div>
      </form>
    </div>
  `

  setupFormEvents(rerender)
}

const setupFormEvents = (rerender) => {
  const form = document.querySelector('#contact-form')
  const cancelBtn = document.querySelector('#cancel-btn')
  const avatarInput = document.querySelector('#contact-avatar')
  const uploadBtn = document.querySelector('#upload-btn')
  const removeAvatarBtn = document.querySelector('#remove-avatar-btn')
  const avatarPreview = document.querySelector('#avatar-preview')
  const previewImage = document.querySelector('#preview-image')

  let selectedFile = null

  if (uploadBtn && avatarInput) {
    uploadBtn.addEventListener('click', () => {
      avatarInput.click()
    })

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('La taille du fichier ne doit pas dépasser 5MB')
          return
        }

        if (!file.type.startsWith('image/')) {
          alert('Veuillez sélectionner un fichier image valide')
          return
        }

        selectedFile = file
        
        const reader = new FileReader()
        reader.onload = (e) => {
          previewImage.src = e.target.result
          avatarPreview.classList.remove('hidden')
          removeAvatarBtn.classList.remove('hidden')
          uploadBtn.textContent = 'Changer la photo'
        }
        reader.readAsDataURL(file)
      }
    })

    removeAvatarBtn.addEventListener('click', () => {
      selectedFile = null
      avatarInput.value = ''
      avatarPreview.classList.add('hidden')
      removeAvatarBtn.classList.add('hidden')
      uploadBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Choisir une photo
      `
    })
  }

  const closeForm = () => {
    setState({ ...state, showContactForm: false })
    rerender()
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeForm)
  }

  document.addEventListener('click', (e) => {
    if (e.target.id === 'contact-form-modal') {
      closeForm()
    }
  })

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const name = document.querySelector('#contact-name').value.trim()
      const phone = document.querySelector('#contact-phone').value.trim()
      const isFavorite = document.querySelector('#contact-favorite').checked

      if (!name || !phone) {
        alert('Veuillez remplir tous les champs obligatoires')
        return
      }

      try {
        const newContact = {
          name,
          phone,
          avatar: '/avatars/default.jpg', 
          isFavorite,
          isArchived: false,
          lastMessage: "Nouveau contact",
          lastMessageTime: "Maintenant",
          unreadCount: 0
        }

        const createdContact = await contactsService.create(newContact)
        
        let finalAvatarPath = '/avatars/default.jpg'
        if (selectedFile) {
          finalAvatarPath = await saveAvatarImage(selectedFile, createdContact.id)
          
          await contactsService.update(createdContact.id, {
            ...createdContact,
            avatar: finalAvatarPath
          })
        }
        
        const updatedContacts = await contactsService.getAll()
        setState({ 
          ...state, 
          contacts: updatedContacts,
          showContactForm: false 
        })
        
        rerender()
      } catch (error) {
        console.error('Erreur lors de la création du contact:', error)
        alert('Erreur lors de la création du contact')
      }
    })
  }
}

const saveAvatarImage = async (file, contactId) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          const size = 150
          canvas.width = size
          canvas.height = size
          
          const minDim = Math.min(img.width, img.height)
          const startX = (img.width - minDim) / 2
          const startY = (img.height - minDim) / 2
          
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size)
          
          canvas.toBlob((blob) => {
            
            const avatarPath = `/avatars/${contactId}.jpg`
            
            resolve(avatarPath)
          }, 'image/jpeg', 0.8)
        }
        
        img.src = e.target.result
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}