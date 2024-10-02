import { store } from '../redux/store.js'
import { setAssistant, setThread } from '../redux/chat-slice.js'

class WelcomeAssistants extends HTMLElement {

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = []
  }

  connectedCallback () {
    this.loadData().then(() => this.render())
  }

  async loadData () {
    const url = `${import.meta.env.VITE_API_URL}/api/customer/assistants`

    try {
      const response = await fetch(url)
      this.data = await response.json()

    } catch (error) {
      console.log(error)
    }
  }

  render () {

    this.shadow.innerHTML =
    /*html*/`
      <style>

        *{
          box-sizing: border-box;
        }

        img{
          object-fit: cover;
          width: 100%;
        }

        .assistants{
          display: none;
        }

        .assistants.active{
          align-items: center;
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          padding: 2rem;
        }

        .assistant{
          background-color: hsl(220, 4%, 20%);
          border: 1px solid hsl(147, 72%, 46%);
          border-radius: 0.3rem;
          display: grid;
          gap: 1rem;
          grid-template-columns: 50px 1fr;
          grid-template-rows: auto auto;
          grid-template-areas: 
            "logo title"
            "description description";
          padding: 1rem;
        }

        .assistant:hover{
          background-color: hsl(220, 4%, 13%);
          border: 1px solid hsla(210, 3%, 13%, 0.50);
          cursor: pointer;
        }

        .assistant-icon{
          align-items: center;
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          display: flex;
          grid-area: logo;
          height: 50px;
          justify-content: center;
          overflow: hidden;
          width: 50px;
        }

        .assistant-icon svg{
          width: 1.2rem;
        }

        .assistant-name{
          align-self: center;
          flex: 1;
          grid-area: title;
        }

        .assistant-name span{
          color: hsl(0, 0%, 100%);
          font-family: 'SoehneBuch', sans-serif; 
          font-size: 1.3rem;
          font-weight: 600;
        }

        .assistant-description{
          grid-area: description;
        }

        .assistant-description span{
          color: hsl(0, 0%, 100%);
          font-family: 'SoehneBuch', sans-serif;
          font-size: 1rem;
        }
      </style>

      <section class="assistants active"></section>
    `

    const assistants = this.shadow.querySelector('.assistants')

    this.data.forEach(assistant => {
      const assistantElement = document.createElement('div')
      assistantElement.classList.add('assistant')
      assistantElement.dataset.assistantId = assistant._id

      const assistantIcon = document.createElement('div')
      assistantIcon.classList.add('assistant-icon')

      const assistantImage = document.createElement('img')
      assistantImage.src = `${import.meta.env.VITE_API_URL}/api/customer/images/image/${assistant.images.md.assistantAvatar.filename}`
      assistantImage.alt = assistant.images.md.assistantAvatar.alt
      assistantImage.title = assistant.images.md.assistantAvatar.title
      assistantIcon.appendChild(assistantImage)

      const assistantName = document.createElement('div')
      assistantName.classList.add('assistant-name')
      const name = document.createElement('span')
      name.textContent = assistant.name
      assistantName.appendChild(name)

      const assistantDescription = document.createElement('div')
      assistantDescription.classList.add('assistant-description')
      const description = document.createElement('span')
      description.textContent = assistant.shortDescription
      assistantDescription.appendChild(description)

      assistantElement.appendChild(assistantIcon)
      assistantElement.appendChild(assistantName)
      assistantElement.appendChild(assistantDescription)
      assistants.appendChild(assistantElement)
    });

    this.shadow.querySelector('.assistants').addEventListener('click', (event) => {

      if (event.target.closest('.assistant')){

        const assistantElement = event.target.closest('.assistant')

        this.data.forEach(assistant => {
          if (assistant._id === assistantElement.dataset.assistantId) {
            store.dispatch(setAssistant(assistant))
          }
        })

        store.dispatch(setThread(null))
        this.shadow.querySelector('.assistants').classList.remove('active')      
      }
    })
  }
}

customElements.define('welcome-assistants-component', WelcomeAssistants)