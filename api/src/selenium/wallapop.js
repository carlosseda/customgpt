const { ChromaClient } = require('chromadb')
const { Builder, By, until } = require('selenium-webdriver')
const OpenAIService = require('../services/openai-service')
const chrome = require('selenium-webdriver/chrome')
const https = require('https')
const fs = require('fs')
const path = require('path')

module.exports = class Wallapop {
  constructor () {
    const chromeOptions = new chrome.Options()

    chromeOptions.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    chromeOptions.addArguments('--disable-search-engine-choice-screen')
    chromeOptions.setUserPreferences({
      profile: {
        default_content_settings: {
          images: 2
        },
        managed_default_content_settings: {
          images: 2
        }
      }
    })

    this.driver = new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build()

    this.urls = []
    this.categories = null
  }

  async setCategories (categories) {
    this.categories = categories
  }

  async scrapping () {
    try {
      const url = 'https://es.wallapop.com/app/search?category_ids=24200&object_type_ids=10088&latitude=39.57825&longitude=2.63204&filters_source=quick_filters&keywords=gameboy'
      await this.driver.get(url)

      await this.driver.executeScript("document.body.style.zoom='25%'")

      await this.driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), 10000)
      const acceptButton = await this.driver.findElement(By.id('onetrust-accept-btn-handler'))
      await acceptButton.click()

      await this.driver.sleep(1500)

      for (let i = 0; i < 3; i++) {
        await this.driver.actions().move({ x: 100, y: 100 }).click().perform()
        await this.driver.sleep(500)
      }

      try {
        await this.driver.executeScript('arguments[0].scrollIntoView(true);', await this.driver.wait(until.elementLocated(By.css('#btn-load-more.hydrated')), 10000))
        const loadMoreButton = await this.driver.findElement(By.css('#btn-load-more.hydrated'))
        await loadMoreButton.click()
        await this.driver.sleep(3000)
      } catch (err) {
        console.log('No se encontró el botón "Ver más productos".', err)
      }

      while (this.urls.length < 3) {
        await this.driver.wait(until.elementsLocated(By.css('.ItemCardList__item')), 10000)
        const elements = await this.driver.findElements(By.css('.ItemCardList__item'))

        for (const element of elements) {
          const url = await element.getAttribute('href')
          this.urls.push(url)

          if (this.urls.length >= 3) {
            break
          }
        }

        await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight);')
        await this.driver.sleep(3000)
      }

      await this.extractDetailsFromUrls()
    } catch (error) {
      console.error('Error al obtener los anuncios:', error)
    } finally {
      await this.driver.quit()
    }
  }

  async extractDetailsFromUrls () {
    const openai = new OpenAIService()

    const dirPath = path.resolve(__dirname, './../storage/scrapping/wallapop')

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    } else {
      fs.rmdirSync(dirPath, { recursive: true })
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const allDetails = []

    for (const url of this.urls) {
      await this.driver.get(url)

      let price = null
      let title = null
      let state = null
      let description = null
      let category = null
      let keywords = null

      try {
        await this.driver.wait(until.elementLocated(By.css('.item-detail-price_ItemDetailPrice--standard__TxPXr')), 10000)
        price = await this.driver.findElement(By.css('.item-detail-price_ItemDetailPrice--standard__TxPXr')).getText()
      } catch (e) {
        console.log(`No se encontró el precio para ${url}`)
      }

      try {
        title = await this.driver.findElement(By.css('h1.item-detail_ItemDetail__title__wcPRl.mt-2')).getText()
      } catch (e) {
        console.log(`No se encontró el título para ${url}`)
      }

      try {
        state = await this.driver.findElement(By.css('.item-detail-additional-specifications_ItemDetailAdditionalSpecifications__characteristics__Ut9iT')).getText()
      } catch (e) {
        console.log(`No se encontró el estado para ${url}`)
      }

      try {
        description = await this.driver.findElement(By.css('section.item-detail_ItemDetail__description__7rXXT.py-4')).getText()
      } catch (e) {
        console.log(`No se encontró la descripción para ${url}`)
      }

      try {
        const elements = await this.driver.findElements(By.css('img[slot="carousel-content"]'))
        const images = await Promise.all(elements.map(async (element) => {
          return await element.getAttribute('src')
        }))

        for (const image of images) {
          const imageUrl = `${image.split('=')[0]}=W1024`
          try {
            const buffer = await new Promise((resolve, reject) => {
              https.get(imageUrl, (res) => {
                const chunks = []

                res.on('data', (chunk) => {
                  chunks.push(chunk)
                })

                res.on('end', () => {
                  resolve(Buffer.concat(chunks))
                })

                res.on('error', (err) => {
                  reject(err)
                })
              })
            })

            if (!fs.existsSync(`${dirPath}/images/${url.split('-').pop()}`)) {
              fs.mkdirSync(`${dirPath}/images/${url.split('-').pop()}`, { recursive: true })
            }

            fs.writeFile(`${dirPath}/images/${url.split('-').pop()}/${image.split('/').pop().split('?')[0]}`, buffer, () => {
              console.log(`Imagen guardada para ${url}`)
            })
          } catch (err) {
            console.log(err)
          }
        }
      } catch (e) {
        console.log(`No se encontró el precio para ${url}`)
      }

      try {
        const text = `${title}, ${description}`
        const object = await openai.extractKeywordsAndCategory(text, this.categories)
        keywords = object.keywords
        category = object.category
      } catch (e) {
        console.log(`No se encontró la categoría para ${url}`)
      }

      allDetails.push({
        url,
        price: parseFloat(price.split(' ')[0]),
        title,
        state: state.includes(' · ') ? state.split(' · ').pop() : state,
        description,
        category,
        keywords
      })

      console.log(`Detalles extraídos para ${url}`)
    }

    const ids = []
    const metadatas = []
    const documents = []

    allDetails.forEach((detail) => {
      const id = detail.url.split('/').pop()
      const text = `${detail.title}. ${detail.description}`

      ids.push(id)
      metadatas.push({ price: detail.price, state: detail.state, url: detail.url, category: detail.category, text })
      documents.push(detail.keywords.join(' '))
    })

    try {
      const client = new ChromaClient()
      let chromadbCollection = await client.getCollection({ name: 'wallapop' })

      if (chromadbCollection) {
        await client.deleteCollection(chromadbCollection)
        chromadbCollection = await client.createCollection({ name: 'wallapop' })
      } else {
        chromadbCollection = await client.createCollection({ name: 'wallapop' })
      }

      await chromadbCollection.add({
        ids,
        metadatas,
        documents
      })

      if (!fs.existsSync(`${dirPath}/json`)) {
        await fs.mkdirSync(`${dirPath}/json`, { recursive: true })
      }

      fs.writeFile(`${dirPath}/json/wallapop.json`, JSON.stringify(allDetails, null, 2), (err) => {
        if (err) {
          console.error('Error al guardar los detalles en el archivo JSON:', err)
        } else {
          console.log('Detalles guardados en wallapop.json')
        }
      })
    } catch (err) {
      console.log(err)
    }
  }
}
