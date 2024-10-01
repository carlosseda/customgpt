import isEqual from 'lodash-es/isEqual'
import { store } from '../redux/store.js'
import { newPrompt } from '../redux/chat-slice.js'

class Examples extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = []
    this.unsubscribe = null
    this.assistant = null
  }

  connectedCallback () {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.chat.assistant && !isEqual(this.assistant, currentState.chat.assistant) && currentState.chat.assistant.examples.length > 0) {
        this.assistant = currentState.chat.assistant
        this.render()
        this.shadow.querySelector('.examples').classList.add('active')
      }

      if (currentState.chat.prompt) {
        this.shadow.querySelector('.examples').classList.remove('active')
      }
    })
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
      <style>
        :host{
          width: 100%;
        }

        img{
          object-fit: cover;
          width: 100%;
        }

        .examples{
          display: none;
        }

        .examples.active{
          align-items: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 90vh;
          justify-content: center;
          width: 100%;
        }

        .examples-logo{
          align-items: center;
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          display: flex; 
          height: 4rem;
          justify-content: center;
          overflow: hidden;
          position: relative;
          width: 4rem;
        }

        .examples-logo svg{
          color: hsl(0, 0%, 0%);
          height: 2.5rem;
          width: 2.5rem;
        }

        .examples-title h1{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 1.5rem;
          margin: 1rem 0;
        }

        .examples-description p{
          color: hsla(0, 0%, 100%);
          font-family: 'SoehneBuch', Arial;
          font-size: 1rem;
          margin: 0;
          text-align: center;
        }
        
        .examples-container{
          display: grid;
          grid-template-columns: repeat(4 , minmax(250px,1fr));
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 2rem 0;
        }

        .example{
          background-color: hsl(220, 4%, 20%);
          border: 1px solid hsl(147, 72%, 46%);
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          justify-content: center;
          padding: 1rem;
          position: relative;
        }

        .example:hover{
          background-color: hsl(220, 4%, 13%);
          border: 1px solid hsla(210, 3%, 13%, 0.50);
          cursor: pointer;
        }

        .example-title h2{
          color: hsla(0, 0%, 100%, 0.7);
          font-family: 'SoehneBuch', Arial;
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0;
        }

        .example .tooltiptext{
          background-color: black;
          border-radius: 0.5rem;
          color: #fff;
          font-family: 'SoehneBuch', sans-serif;
          font-size: 0.8rem;
          margin-top: -5rem;
          margin-left: 5rem;
          opacity: 0;
          padding: 0.5rem 0;
          pointer-events: none; 
          position: absolute;
          text-align: center;
          transition: opacity 0.3s;
          width: 150px;
          z-index: 1001;
        }

        .example .tooltiptext::after {
          border-color: rgb(0, 0, 0) transparent transparent transparent;
          border-style: solid;
          border-width: 5px;
          content: "";
          left: 45%;
          position: absolute;
          top: 100%;   
        }

        .example:hover .tooltiptext{
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 800px) {
          .examples{
            grid-template-columns: repeat(1, 1fr);
          }
        }
      </style>
    
      <section class="examples">
        <div class="examples-logo">
          <img src="${import.meta.env.VITE_API_URL}/api/customer/images/image/${this.assistant.images.md.assistantAvatar.filename}" alt="${this.assistant.images.md.assistantAvatar.alt}" title="${this.assistant.images.md.assistantAvatar.title}">
        </div>
        <div class="examples-title">
          <h1>Bienvenido al asistente de ${this.assistant.name}</h1>
        </div>
        <div class="examples-description">
          <p>${this.assistant.description}</p>
        </div>
        <div class="examples-container"></div>
      </section>
    `

    const examples = this.shadow.querySelector('.examples-container')

    this.assistant.examples.forEach(example => {
      const exampleElement = document.createElement('article')
      exampleElement.classList.add('example')
      exampleElement.dataset.prompt = example.prompt

      const exampleTitle = document.createElement('div')
      exampleTitle.classList.add('example-title')

      const exampleTitleH2 = document.createElement('h2')
      exampleTitleH2.textContent = example.title

      const exampleSendButtonTooltip = document.createElement('span')
      exampleSendButtonTooltip.classList.add('tooltiptext')
      exampleSendButtonTooltip.textContent = 'Haz click para enviar'

      exampleElement.appendChild(exampleSendButtonTooltip)
      exampleTitle.appendChild(exampleTitleH2)
      exampleElement.appendChild(exampleTitle)
      examples.appendChild(exampleElement)
    })

    examples.addEventListener('click', (event) => {
      if (event.target.closest('.example')) {
        const prompt = event.target.closest('.example').dataset.prompt
        store.dispatch(newPrompt(prompt))
      }
    })
  }
}

customElements.define('examples-component', Examples)
