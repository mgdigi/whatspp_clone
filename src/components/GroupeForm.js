import { state, setState } from '../utils/state.js'
import { conversationService } from '../services/conversationService.js'
import { userService } from '../services/userService.js'
import { avatarService } from '../services/avatarService.js'

export const createGroupForm = async (container, rerender) => {
  const allUsers = await userService.getAllUsers()
  const otherUsers = allUsers.filter(user => user.id !== state.currentUser.id)

  container.innerHTML = `
    <div class="bg-whatsapp-bg-light rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
      <h2 class="text-xl font-semibold text-whatsapp-text-light mb-4">Créer un groupe</h2>
      
      <form id="group-form" class="space-y-4">
        <div>
          <label for="group-name" class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Nom du groupe *
          </label>
          <input
            type="text"
            id="group-name"
            required
            class="w-full bg-whatsapp-bg-dark text-whatsapp-text-light rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            placeholder="Nom du groupe"
          >
        </div>

        <div>
          <label for="group-avatar" class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Photo du groupe
          </label>
          <div class="space-y-3">
            <!-- Prévisualisation de l'image -->
            <div id="avatar-preview" class="hidden">
              <img id="preview-image" src="" alt="Aperçu" class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-whatsapp-green">
            </div>
            
            <input
              type="file"
              id="group-avatar"
              accept="image/*"
              class="hidden"
            >
            
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
            
            <button
              type="button"
              id="remove-avatar-btn"
              class="hidden w-full bg-red-500 text-white rounded-lg px-3 py-2 hover:bg-red-600 transition-colors"
            >
              Supprimer la photo
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-whatsapp-text-light mb-2">
            Participants * (minimum 2)
          </label>
          <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            ${otherUsers.map(user => `
              <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-whatsapp-bg-dark cursor-pointer">
                <input
                  type="checkbox"
                  name="participants"
                  value="${user.id}"
                  class="rounded text-whatsapp-green focus:ring-whatsapp-green"
                >
                <img src="${user.avatar || '/avatars/default.jpg'}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover">
                <div class="flex-1">
                  <p class="text-sm text-whatsapp-text-light">${user.name}</p>
                  <p class="text-xs text-whatsapp-text-secondary">${user.isOnline ? 'En ligne' : 'Hors ligne'}</p>
                </div>
              </label>
            `).join('')}
          </div>
          <p class="text-xs text-whatsapp-text-secondary mt-1">
            Sélectionnez au moins 2 participants pour créer un groupe
          </p>
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
            Créer le groupe
          </button>
        </div>
      </form>
    </div>
  `

  setupGroupFormEvents(rerender)
}

const setupGroupFormEvents = (rerender) => {
  const form = document.querySelector('#group-form')
  const cancelBtn = document.querySelector('#cancel-btn')
  const avatarInput = document.querySelector('#group-avatar')
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
        const validation = avatarService.validateImageFile(file)
        
        if (!validation.isValid) {
          alert(validation.errors.join('\n'))
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
    setState({ ...state, showGroupForm: false })
    rerender()
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeForm)
  }

  document.addEventListener('click', (e) => {
    if (e.target.id === 'group-form-modal') {
      closeForm()
    }
  })

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const name = document.querySelector('#group-name').value.trim()
      const selectedParticipants = Array.from(document.querySelectorAll('input[name="participants"]:checked'))
        .map(input => parseInt(input.value))

      if (!name) {
        alert('Veuillez saisir un nom pour le groupe')
        return
      }

      if (selectedParticipants.length < 2) {
        alert('Veuillez sélectionner au moins 2 participants')
        return
      }

      try {
        const allParticipants = [state.currentUser.id, ...selectedParticipants]
        
        let avatarPath = null
        if (selectedFile) {
          const tempId = Date.now()
          avatarPath = await avatarService.saveAvatar(selectedFile, `group-${tempId}`)
        }
        
        const newGroup = await conversationService.createGroup(
          name,
          allParticipants,
          state.currentUser.id,
          avatarPath
        )
        
        const updatedConversations = await conversationService.getUserConversations(state.currentUser.id)
        setState({ 
          ...state, 
          conversations: updatedConversations,
          showGroupForm: false,
          selectedConversationId: newGroup.id
        })
        
        rerender()
      } catch (error) {
        console.error('Erreur lors de la création du groupe:', error)
        alert('Erreur lors de la création du groupe')
      }
    })
  }
}