import * as cheerio from 'cheerio'

interface AmazonProduct {
    name: string
    normalPrice: string
    promoPrice: string
    imageUrl: string
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

export async function extractAmazonInfo(productCode: string): Promise<AmazonProduct> {
    try {
        const url = `https://www.amazon.com.br/dp/${productCode}`
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

        const response = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error('Não foi possível acessar a página do produto')
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Nome do produto
        const name = $('#productTitle').text().trim() ||
            $('.product-title-word-break').text().trim()

        // Preços
        let normalPrice = ''
        let promoPrice = ''

        // Procura o preço original (riscado)
        const originalPriceText = $('.basisPrice .a-text-price').first().text().trim() ||
            $('.a-text-price[data-a-strike="true"]').first().text().trim() ||
            $('span[data-a-strike="true"]').first().text().trim() ||
            $('.a-text-strike').first().text().trim()

        if (originalPriceText) {
            normalPrice = formatPrice(originalPriceText)
        }

        // Procura o preço promocional
        const currentPrice = $('.priceToPay .a-offscreen').first().text().trim() ||
            $('.a-price .a-offscreen').first().text().trim() ||
            $('#priceblock_ourprice').text().trim() ||
            $('#priceblock_dealprice').text().trim()

        if (currentPrice) {
            promoPrice = formatPrice(currentPrice)
        } else if (normalPrice) {
            // Se não encontrou preço promocional mas tem preço normal, usa o normal
            promoPrice = normalPrice
            normalPrice = ''
        }

        // Imagem do produto
        const imageUrl = $('#landingImage').attr('src') ||
            $('#imgBlkFront').attr('src') ||
            $('.a-dynamic-image').first().attr('src') ||
            $('img[data-old-hires]').attr('data-old-hires') ||
            ''

        if (!name || !promoPrice || !imageUrl) {
            throw new Error('Não foi possível extrair todas as informações necessárias')
        }

        return {
            name,
            normalPrice,
            promoPrice,
            imageUrl
        }
    } catch (error) {
        console.error('Erro ao extrair informações da Amazon:', error)
        throw new Error('Erro ao extrair informações. Verifique se o código do produto está correto.')
    }
} 