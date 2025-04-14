import { useState } from 'react'
import { extractMercadoLivreInfo } from './services/mercadoLivre'
import './App.css'

interface MercadoLivreProduct {
  name: string;
  normalPrice: string;
  promoPrice: string;
  imageUrl: string;
}

function App() {
  const [url, setUrl] = useState('')
  const [productName, setProductName] = useState('')
  const [normalPrice, setNormalPrice] = useState('')
  const [promoPrice, setPromoPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [debug, setDebug] = useState('')
  const [productInfo, setProductInfo] = useState<MercadoLivreProduct | null>(null)

  const handleUrlSubmit = async () => {
    if (!url) {
      setError('Por favor, insira uma URL válida')
      return
    }

    setIsLoading(true)
    setError('')
    setStatus('Processando link...')
    setDebug('')

    try {
      setStatus('Extraindo informações...')
      setError('')
      const info = await extractMercadoLivreInfo(url)
      setProductInfo({
        name: info.name,
        normalPrice: info.normalPrice,
        promoPrice: info.promoPrice,
        imageUrl: info.imageUrl
      })
      setProductName(info.name)
      setNormalPrice(info.normalPrice)
      setPromoPrice(info.promoPrice)
      setImageUrl(info.imageUrl)
      setStatus('Informações extraídas com sucesso!')
    } catch (err) {
      setError('Erro ao extrair informações. Verifique se a URL é válida.')
      setProductInfo(null)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareWhatsApp = () => {
    const linkToShare = customLink || url;
    const message = `*${productName}*\n\n💰 Preço Normal: ${normalPrice}\n🔥 Preço Promocional: ${promoPrice}\n\n${linkToShare}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="container">
      <h1>Gerador de Anúncio ML</h1>

      <div className="form-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole aqui a URL do produto do Mercado Livre"
          className="input"
        />
        <span className="form-help">
          Exemplo: https://www.mercadolivre.com.br/produto...
        </span>
      </div>

      <button onClick={handleUrlSubmit} className="button">
        Extrair Informações
      </button>

      {status && <div className="status-message">{status}</div>}
      {error && <div className="error-message">{error}</div>}
      {debug && <div className="debug-message">{debug}</div>}

      {productInfo && (
        <div className="product-info">
          <h2>Informações do Produto</h2>
          <pre>{JSON.stringify(productInfo, null, 2)}</pre>
        </div>
      )}

      <div className="form-group">
        <label>Nome do Produto</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Nome do produto"
        />
      </div>

      <div className="form-group">
        <label>Preço Normal</label>
        <input
          type="text"
          value={normalPrice}
          onChange={(e) => setNormalPrice(e.target.value)}
          placeholder="R$ 0,00"
        />
      </div>

      <div className="form-group">
        <label>Preço Promocional</label>
        <input
          type="text"
          value={promoPrice}
          onChange={(e) => setPromoPrice(e.target.value)}
          placeholder="R$ 0,00"
        />
      </div>

      <div className="form-group">
        <label>Link Personalizado (opcional)</label>
        <input
          type="text"
          value={customLink}
          onChange={(e) => setCustomLink(e.target.value)}
          placeholder="Cole aqui o link que aparecerá no WhatsApp"
        />
        <span className="form-help">
          Se não preencher, será usado o link original do produto
        </span>
      </div>

      {imageUrl && (
        <div className="image-preview">
          <img src={imageUrl} alt="Preview do produto" />
        </div>
      )}

      <button
        onClick={handleShareWhatsApp}
        disabled={!productName || !normalPrice || !promoPrice}
        className="share-button"
      >
        Compartilhar no WhatsApp
      </button>
    </div>
  )
}

export default App
