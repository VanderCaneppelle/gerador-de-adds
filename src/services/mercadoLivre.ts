import * as cheerio from 'cheerio';

export interface MercadoLivreProduct {
    name: string;
    normalPrice: string | null;
    promoPrice: string;
    imageUrl: string;
    url: string;
    discountPercent?: string;
}

export async function extractMercadoLivreInfo(url: string): Promise<MercadoLivreProduct> {
    try {
        console.log('Tentando acessar URL:', url)

        // Tenta diferentes serviços de proxy em ordem
        const proxyUrls = [
            `http://localhost:4000/proxy?url=${encodeURIComponent(url)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ]

        let html = ''

        // Tenta cada proxy até um funcionar
        for (const proxyUrl of proxyUrls) {
            try {
                console.log('Tentando proxy:', proxyUrl)
                const response = await fetch(proxyUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                })

                if (response.ok) {
                    html = await response.text()
                    if (html.length > 1000) { // Verifica se recebeu uma resposta válida
                        break
                    }
                }
            } catch (err) {
                console.log('Erro no proxy:', proxyUrl, err)
                continue
            }
        }

        if (!html) {
            throw new Error('Não foi possível acessar a página do produto através dos proxies disponíveis')
        }

        const $ = cheerio.load(html)

        // Nome do produto
        const name = $('.ui-pdp-title').first().text().trim()
        if (!name) {
            throw new Error('Não foi possível encontrar o nome do produto')
        }
        console.log('Nome encontrado:', name)

        // Preços
        let normalPrice = ''
        let promoPrice = ''

        // Procura o preço original primeiro (preço riscado)
        const originalPriceElement = $('.ui-pdp-price__part.ui-pdp-price__original-value.andes-money-amount--previous').first()
        if (originalPriceElement.length > 0) {
            const fraction = originalPriceElement.find('.andes-money-amount__fraction').text().trim()
            const cents = originalPriceElement.find('.andes-money-amount__cents').text().trim()
            normalPrice = formatPrice(`${fraction},${cents || '00'}`)
            console.log('Preço original encontrado:', normalPrice)
        }

        // Encontrar o preço atual/promocional
        const promoPriceContainer = $('.ui-pdp-price__second-line .andes-money-amount')
        if (promoPriceContainer.length > 0) {
            const fraction = promoPriceContainer.find('.andes-money-amount__fraction').first().text().trim()
            const cents = promoPriceContainer.find('.andes-money-amount__cents').first().text().trim()
            promoPrice = formatPrice(`${fraction},${cents || '00'}`)
            console.log('Preço promocional encontrado:', promoPrice)
        }

        // Se não encontrou preço promocional mas tem preço normal
        if (!promoPrice && normalPrice) {
            promoPrice = normalPrice
            normalPrice = ''
        }

        // Se ainda não encontrou nenhum preço, tenta outros seletores
        if (!promoPrice) {
            const priceText = $('.ui-pdp-price__second-line .price-tag-amount').first().text().trim()
            if (priceText) {
                promoPrice = formatPrice(priceText)
                console.log('Preço alternativo encontrado:', promoPrice)
            }
        }

        // Imagem do produto
        const imageUrl = $('.ui-pdp-gallery__figure img').first().attr('src')
        if (!imageUrl) {
            throw new Error('Não foi possível encontrar a imagem do produto!')
        }
        console.log('URL da imagem encontrada:', imageUrl)

        // Percentual de desconto
        let discountPercent = '';
        const discountElement = $('.andes-money-amount__discount').first();
        if (discountElement.length > 0) {
            discountPercent = discountElement.text().trim();
            console.log('Percentual de desconto encontrado:', discountPercent);
        }

        return {
            name,
            normalPrice,
            promoPrice,
            imageUrl,
            url: url,
            discountPercent
        }

    } catch (error) {
        console.error('Erro ao extrair informações:', error)
        throw error
    }
}

function formatPrice(price: string): string {
    if (!price) return 'R$ 0,00';

    // Remove tudo que não for número ou vírgula
    const cleanPrice = price.replace(/[^\d,]/g, '');

    // Se não houver vírgula, assume que são centavos
    if (!cleanPrice.includes(',')) {
        const numericPrice = parseInt(cleanPrice, 10) / 100;
        return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
    }

    // Converte para número
    const numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
} 