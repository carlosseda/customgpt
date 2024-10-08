import isEqual from 'lodash-es/isEqual'
import { store } from '../redux/store.js'

class ImageViewer extends HTMLElement {
  constructor () {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.unsubscribe = null
    this.images = []
    this.index = null
  }

  connectedCallback () {
    this.unsubscribe = store.subscribe(() => {
      const currentState = store.getState()

      if (currentState.chat.images && !isEqual(this.images, currentState.chat.images)) {
        this.images = currentState.chat.images
        this.index = this.images.index

        this.render()
        this.shadow.querySelector('.image-viewer-content img').src = this.images.src[this.index]
        this.shadow.querySelector('.image-viewer').classList.add('active')
      }
    })

    this.render()
  }

  render () {
    this.shadow.innerHTML =
    /* html */`
      <style>

        .image-viewer{
          align-items: center;
          background-color: hsl(0, 0%, 0%, 0.8);
          display: flex;
          height: 100vh;
          justify-content: center;
          left: 0;
          opacity: 0;
          visibility: hidden;
          position: fixed;
          top: 0;
          transition: opacity 0.3s, visibility 0.3s;
          width: 100%;
          z-index: 5000;
        }

        .image-viewer.active{
          opacity: 1;
          visibility: visible;
        }

        .image-viewer-close:hover{
          background-color: hsl(0, 0%, 100%, 0.8);
        }

        .image-viewer-container{
          align-items: center;
          display: flex;
          height: 90%;
          justify-content: space-between;
          position: relative;
          width: 90%;
        }

        .image-viewer-content{
          align-items: center;
          display: flex;
          height: 100%;
          justify-content: center;
          width: max-content;
        }

        .image-viewer-content img{
          max-height: 100%;
          max-width: 100%;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .previous-button, .next-button{
          align-items: center;
          background-color: hsl(0, 0%, 100%);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          height: 40px;
          justify-content: center;
          width: 40px;
        }

        .previous-button svg, .next-button svg{
          fill: hsl(0, 0%, 0%);
          height: 24px;
          width: 24px;
        }

        .previous-button:hover, .next-button:hover{
          background-color: hsl(0, 0%, 100%, 0.8);
        }

        .previous-button{
          left: 10%;
        }

        .next-button{
          right: 10%;
        } 
      </style>
    
      <section class="image-viewer">
        <div class="image-viewer-container">
          <div class="button previous-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.41,7.41L14,6L8,12l6,6l1.41-1.41L11.83,12L15.41,8.41L15.41,7.41z" /></svg>
          </div>
          <div class="image-viewer-content">
            <img src="" />
          </div>
          <div class="button next-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.59,16.59L10,18l6-6l-6-6l-1.41,1.41L12.17,12L8.59,15.59L8.59,16.59z" /></svg>
          </div>
        </div>
      </section>
    `

    this.shadow.querySelector('.image-viewer').addEventListener('click', (event) => {

      const viewerContainer = this.shadow.querySelector('.image-viewer-content')
      const buttons = this.shadow.querySelectorAll('.button')

      if (!viewerContainer.contains(event.target) && !Array.from(buttons).some(button => button.contains(event.target))) {
        this.shadow.querySelector('.image-viewer').classList.remove('active')
        this.images = []
        this.index = null
      }

      if (event.target.closest('.previous-button')) {
        this.previousImage()
      }

      if (event.target.closest('.next-button')) {
        this.nextImage()
      }     
    })
  }

  previousImage () {
    if (this.index === 0) {
      this.index = this.images.src.length - 1
    } else {
      this.index--
    }

    this.shadow.querySelector('.image-viewer-content img').src = this.images.src[this.index]
  }

  nextImage () {
    if (this.index === this.images.src.length - 1) {
      this.index = 0
    } else {
      this.index++
    }

    this.shadow.querySelector('.image-viewer-content img').src = this.images.src[this.index]
  }
}

customElements.define('image-viewer-component', ImageViewer)