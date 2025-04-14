import { useState, useEffect } from 'react'
import './App.css'
import { extractMercadoLivreInfo } from './services/mercadoLivre'
import { formatProductMessage, downloadImage, openWhatsApp } from './services/whatsapp'
import { Login } from './components/Login'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [url, setUrl] = useState('')
  const [productName, setProductName] = useState('')
  const [normalPrice, setNormalPrice] = useState('')
  const [promoPrice, setPromoPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImageUrl, setLocalImageUrl] = useState('')
  const [customLink, setCustomLink] = useState('')
  const [fileName, setFileName] = useState('produto.jpg')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  useEffect(() => {
    // Quando a URL da imagem mudar, tenta baixá-la
    if (imageUrl) {
      downloadImage(imageUrl).then(blob => {
        if (blob) {
          // Revoga a URL anterior se existir
          if (localImageUrl) {
            URL.revokeObjectURL(localImageUrl);
          }
          // Cria uma nova URL local para o blob
          const newLocalUrl = URL.createObjectURL(blob);
          console.log('Nova URL local criada:', newLocalUrl);
          setLocalImageUrl(newLocalUrl);
        } else {
          console.error('Falha ao baixar imagem - blob nulo');
          setError('Erro ao baixar a imagem do produto');
        }
      }).catch(error => {
        console.error('Erro ao processar imagem:', error);
        setError('Erro ao processar a imagem do produto');
      });
    }

    // Cleanup: revoga a URL quando o componente for desmontado ou a URL mudar
    return () => {
      if (localImageUrl) {
        URL.revokeObjectURL(localImageUrl);
      }
    };
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

  const handleCopyMessage = () => {
    const message = formatProductMessage(
      productName,
      normalPrice,
      promoPrice,
      customLink || url,
      couponCode
    )
    navigator.clipboard.writeText(message)
      .then(() => {
        alert('Mensagem copiada!\n\nPróximos passos:\n1. Baixe a imagem usando o botão "Baixar Imagem"\n2. Cole a mensagem (Ctrl+V) no WhatsApp\n3. Anexe a imagem que você baixou')
      })
      .catch(() => {
        setError('Erro ao copiar mensagem')
      })
  }

  const handleOpenWhatsApp = () => {
    openWhatsApp();
  }

  const handleRefresh = () => {
    // Limpa todos os campos
    setUrl('')
    setProductName('')
    setNormalPrice('')
    setPromoPrice('')
    setImageUrl('')
    setLocalImageUrl('')
    setCustomLink('')
    setFileName('produto.jpg')
    setCouponCode('')
    setError(null)

    // Foca no campo de URL
    const urlInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (urlInput) {
      urlInput.focus();
    }
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="container">
      <button onClick={handleLogout} className="logout-button">
        Sair
      </button>
      <button onClick={handleRefresh} className="refresh-button">
        Novo Produto
      </button>
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
        <label>Cupom de Desconto (opcional)</label>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Digite o código do cupom"
        />
        <span className="form-help">Se preenchido, será incluído na mensagem</span>
      </div>

      {localImageUrl && (
        <div className="image-preview">
          <img
            src={localImageUrl}
            alt="Preview do produto"
            onError={(e) => {
              console.error('Erro ao carregar imagem');
              setError('Erro ao exibir a imagem do produto');
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="form-group image-name-input">
            <label>Nome do arquivo para download</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
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
              disabled={!productName || !promoPrice}
            >
              Copiar Mensagem
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="share-button"
            >
              Abrir WhatsApp
            </button>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default App
