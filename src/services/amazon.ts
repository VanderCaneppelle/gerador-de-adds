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

function formatPriceFromParts(whole: string, fraction: string): string {
    const cleanWhole = whole.replace(/[^\d]/g, '').trim()
    const cleanFraction = fraction.replace(/[^\d]/g, '').trim()

    if (!cleanWhole) return 'R$ 0,00'

    return `R$ ${cleanWhole},${cleanFraction.padEnd(2, '0')}`
}

export async function extractAmazonInfo(productCode: string): Promise<AmazonProduct> {
    try {
        const url = `https://www.amazon.com.br/dp/${productCode}`
        console.log('Tentando acessar URL:', url)

        // Tenta diferentes serviços de proxy em ordem
        const proxyUrls = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ]

        let html = ''
        let proxyError = null

        // Tenta cada proxy até um funcionar
        for (const proxyUrl of proxyUrls) {
            try {
                console.log('Tentando proxy:', proxyUrl)
                const response = await fetch(proxyUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3'
                    }
                })

                if (response.ok) {
                    html = await response.text()
                    if (html.length > 1000) { // Verifica se recebeu uma resposta válida
                        break
                    }
                }
            } catch (err) {
                proxyError = err
                console.log('Erro no proxy:', proxyUrl, err)
                continue
            }
        }

        if (!html) {
            throw new Error('Não foi possível acessar a página do produto através dos proxies disponíveis')
        }

        const $ = cheerio.load(html)

        // Nome do produto
        const name = $('#productTitle').text().trim()
        console.log('Nome encontrado:', name)

        if (!name) {
            throw new Error('Não foi possível encontrar o nome do produto')
        }

        // Preços
        let normalPrice = ''
        let promoPrice = ''

        // Procura o preço promocional primeiro (44,90)
        const priceContainer = $('.priceToPay').first()
        if (priceContainer.length > 0) {
            const priceWhole = priceContainer.find('.a-price-whole').first().text().trim()
            const priceFraction = priceContainer.find('.a-price-fraction').first().text().trim()

            if (priceWhole && priceFraction) {
                promoPrice = formatPriceFromParts(priceWhole, priceFraction)
                console.log('Preço promocional encontrado:', promoPrice)
            }
        }

        // Se não encontrou no priceToPay, tenta no a-price
        if (!promoPrice) {
            const priceWhole = $('.a-price-whole').first().text().trim()
            const priceFraction = $('.a-price-fraction').first().text().trim()

            if (priceWhole && priceFraction) {
                promoPrice = formatPriceFromParts(priceWhole, priceFraction)
                console.log('Preço promocional alternativo encontrado:', promoPrice)
            }
        }

        // Tenta diferentes estratégias para encontrar o preço original
        const priceStrategies = [
            // Estratégia 1: Usando o seletor do corePriceDisplay com basisPrice
            () => {
                const element = $('#corePriceDisplay_desktop_feature_div .basisPrice .a-offscreen').first()
                return element.length > 0 ? element.text().trim() : null
            },
            // Estratégia 2: Usando o seletor específico da div[2]
            () => {
                const element = $('#corePriceDisplay_desktop_feature_div > div:nth-child(2) span.a-price-whole').first()
                const fraction = $('#corePriceDisplay_desktop_feature_div > div:nth-child(2) span.a-price-fraction').first()
                if (element.length > 0 && fraction.length > 0) {
                    return `R$ ${element.text().trim()},${fraction.text().trim()}`
                }
                return null
            },
            // Estratégia 3: Usando o seletor da basisPrice geral
            () => {
                const element = $('.basisPrice span.a-price-whole').first()
                const fraction = $('.basisPrice span.a-price-fraction').first()
                if (element.length > 0 && fraction.length > 0) {
                    return `R$ ${element.text().trim()},${fraction.text().trim()}`
                }
                return null
            },
            // Estratégia 4: Usando o seletor de preço riscado
            () => {
                const element = $('span[data-a-strike="true"] span.a-price-whole').first()
                const fraction = $('span[data-a-strike="true"] span.a-price-fraction').first()
                if (element.length > 0 && fraction.length > 0) {
                    return `R$ ${element.text().trim()},${fraction.text().trim()}`
                }
                return null
            }
        ]

        // Tenta cada estratégia até encontrar um preço
        for (const strategy of priceStrategies) {
            const priceText = strategy()
            if (priceText) {
                // Remove "R$" e espaços, depois separa em parte inteira e decimal
                const cleanPrice = priceText.replace('R$', '').trim()
                const [whole, fraction] = cleanPrice.split(',')
                if (whole && fraction) {
                    normalPrice = formatPriceFromParts(whole, fraction)
                    console.log('Preço original encontrado:', normalPrice)
                    break
                }
            }
        }

        // Se não encontrou preço promocional mas tem preço normal
        if (!promoPrice && normalPrice) {
            promoPrice = normalPrice
            normalPrice = ''
        }

        // Imagem do produto
        const imageSelectors = [
            '#landingImage',
            '#imgBlkFront',
            '.a-dynamic-image',
            'img[data-old-hires]',
            '#main-image',
            '#product-image'
        ]

        let imageUrl = ''
        for (const selector of imageSelectors) {
            const imgElement = $(selector).first()
            imageUrl = imgElement.attr('src') || imgElement.attr('data-old-hires') || ''
            if (imageUrl) {
                console.log('Imagem encontrada:', imageUrl, 'usando selector:', selector)
                break
            }
        }

        if (!imageUrl) {
            throw new Error('Não foi possível encontrar a imagem do produto')
        }

        if (!promoPrice) {
            throw new Error('Não foi possível encontrar o preço do produto')
        }

        console.log('Informações extraídas com sucesso:', { name, normalPrice, promoPrice, imageUrl })

        return {
            name,
            normalPrice,
            promoPrice,
            imageUrl
        }
    } catch (error) {
        console.error('Erro detalhado ao extrair informações:', error)
        if (error instanceof Error) {
            throw new Error(`Erro ao extrair informações: ${error.message}`)
        } else {
            throw new Error('Erro ao extrair informações. Verifique se o código do produto está correto.')
        }
    }
} 