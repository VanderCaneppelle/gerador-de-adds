import { useState, useEffect } from 'react'
import { extractMercadoLivreInfo } from './services/mercadoLivre'
import { sendWhatsAppMessage, formatProductMessage, downloadImage } from './services/whatsapp'
import './App.css'

interface MercadoLivreProduct {
  name: string;
  normalPrice: string | null;
  promoPrice: string;
  imageUrl: string;
}

function App() {
  const [url, setUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [productName, setProductName] = useState('')
  const [normalPrice, setNormalPrice] = useState('')
  const [promoPrice, setPromoPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImageUrl, setLocalImageUrl] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [fileName, setFileName] = useState('produto.jpg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Quando a URL da imagem mudar, tenta baixá-la
    if (imageUrl) {
      downloadImage(imageUrl).then(localUrl => {
        if (localUrl) {
          setLocalImageUrl(localUrl);
        }
      });
    }
  }, [imageUrl]);

  const handleUrlSubmit = async () => {
    if (!url) {
      setError('Por favor, insira uma URL válida')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const info = await extractMercadoLivreInfo(url)
      setProductName(info.name)
      setNormalPrice(info.normalPrice || '')
      setPromoPrice(info.promoPrice)
      setImageUrl(info.imageUrl)
      // Define um nome padrão baseado no nome do produto
      setFileName(info.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30) + '.jpg')
      setError(null)
    } catch (err) {
      setError('Erro ao extrair informações. Verifique se a URL é válida.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (!phoneNumber) {
      setError('Por favor, insira um número de WhatsApp')
      return
    }

    try {
      const message = formatProductMessage(
        productName,
        normalPrice,
        promoPrice,
        customLink || url
      )
      sendWhatsAppMessage(phoneNumber, message)
      setError(null)
    } catch (err) {
      setError('Erro ao enviar mensagem: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const handleCopyMessage = () => {
    const message = formatProductMessage(
      productName,
      normalPrice,
      promoPrice,
      customLink || url
    )
    navigator.clipboard.writeText(message)
      .then(() => {
        alert('Mensagem copiada! Agora você pode colar no WhatsApp junto com a imagem.')
      })
      .catch(() => {
        setError('Erro ao copiar mensagem')
      })
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

      <button onClick={handleUrlSubmit} className="button" disabled={loading}>
        {loading ? 'Extraindo...' : 'Extrair Informações'}
      </button>

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

      <div className="form-group">
        <label>Número do WhatsApp (com DDD)</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Ex: 11999999999"
          required
        />
      </div>

      {localImageUrl && (
        <div className="image-preview">
          <img src={localImageUrl} alt="Preview do produto" />
          <div className="form-group image-name-input">
            <label>Nome do arquivo para download</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nome do arquivo (ex: produto.jpg)"
            />
          </div>
          <div className="image-actions">
            <a
              href={localImageUrl}
              download={fileName}
              className="download-button"
            >
              Baixar Imagem
            </a>
            <button
              onClick={handleCopyMessage}
              className="copy-button"
            >
              Copiar Mensagem
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleShare}
        disabled={!productName || !promoPrice}
        className="share-button"
      >
        Abrir WhatsApp
      </button>

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App
