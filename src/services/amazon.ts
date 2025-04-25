import * as cheerio from 'cheerio'

interface AmazonProduct {
    name: string
    normalPrice: string
    promoPrice: string
    imageUrl: string
    url: string
}

interface ScraperResponse {
    name: string
    pricing: string
    list_price: string
    images: string[]
}

const SCRAPER_API_KEY = 'd327ad8b0da0f2e19110fcfc8ca43c37'

export async function extractAmazonInfo(code: string): Promise<AmazonProduct> {
    try {
        // Monta a URL da Amazon
        const amazonUrl = `https://www.amazon.com.br/dp/${code}`

        // Monta a URL do ScraperAPI com output_format=json e autoparse=true
        const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(amazonUrl)}&output_format=json&autoparse=true`
        console.log('Acessando URL via ScraperAPI:', amazonUrl)

        const response = await fetch(scraperUrl)

        if (!response.ok) {
            throw new Error(`Erro ao acessar a página: ${response.status}`)
        }

        const data = await response.json() as ScraperResponse

        if (!data || !data.name) {
            throw new Error('Dados do produto não encontrados')
        }

        return {
            name: data.name,
            normalPrice: data.list_price || 'Preço não disponível',
            promoPrice: data.pricing || 'Preço não disponível',
            imageUrl: data.images?.[0] || '',
            url: amazonUrl
        }
    } catch (error: any) {
        console.error('Erro ao extrair informações:', error)
        throw new Error(`Falha ao extrair informações do produto: ${error.message}`)
    }
} 