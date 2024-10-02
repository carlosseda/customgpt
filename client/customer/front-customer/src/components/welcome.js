import { store } from '../redux/store.js'

class Welcome extends HTMLElement {

  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.data = []
    this.unsubscribe = null
  }

  connectedCallback () {
    this.unsubscribe = store.subscribe(() => {

      const currentState = store.getState()

      if (currentState.chat.assistant) {
        this.shadow.querySelector('.welcome').classList.remove('active')
      }
    })

    this.loadData().then(() => this.render())
  }

  async loadData () {
    const url = `${import.meta.env.VITE_API_URL}/api/customer/welcome`

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

        .welcome{
          display: none;
        }

        .welcome.active{
          align-items: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          justify-content: center;
          width: 100%;
        }

        .welcome-logo{
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

        .welcome-logo svg{
          color: hsl(0, 0%, 0%);
          height: 2.5rem;
          width: 2.5rem;
        }

        .welcome-title h1{
          color: hsl(0, 0%, 100%);
          font-family: "SoehneBuch", sans-serif;
          font-size: 1.5rem;
          margin: 0;
        }
      </style>
    
      <section class="welcome active">
        <div class="welcome-logo">
          <img src="${import.meta.env.VITE_API_URL}/api/customer/images/image/${this.data.images.md.logo.filename}" alt="${this.data.images.md.logo.alt}" title="${this.data.images.md.logo.title}">
        </div>
        <div class="welcome-title">
          <h1>${this.data.welcomeMessage}</h1>
        </div>
      </section>
    `
  }
}

customElements.define('welcome-component', Welcome)