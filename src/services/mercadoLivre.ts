import * as cheerio from 'cheerio';

export interface MercadoLivreProduct {
    name: string;
    normalPrice: string | null;
    promoPrice: string;
    imageUrl: string;
    url: string;
}

export const extractMercadoLivreInfo = async (url: string): Promise<MercadoLivreProduct> => {
    try {
        // Limpa a URL e extrai o ID do produto
        const cleanUrl = url.split(/[#?]/)[0].trim();
        const productId = extractProductId(cleanUrl);

        if (!productId) {
            throw new Error('URL inválida. Por favor, insira uma URL válida do Mercado Livre.');
        }

        // Usa a API pública do Mercado Livre
        const apiUrl = `https://api.mercadolibre.com/items/${productId}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Erro ao acessar API do Mercado Livre: ${response.status}`);
        }

        const data = await response.json();

        // Extrai as informações necessárias
        const name = data.title;
        const originalPrice = data.original_price || data.price;
        const currentPrice = data.price;

        // Pega a maior imagem disponível
        const imageUrl = data.pictures?.[0]?.secure_url || data.thumbnail;

        return {
            name,
            normalPrice: originalPrice ? formatPrice(originalPrice.toString()) : null,
            promoPrice: formatPrice(currentPrice.toString()),
            imageUrl,
            url: cleanUrl
        };
    } catch (error) {
        console.error('Erro ao extrair informações:', error);
        throw new Error('Não foi possível extrair as informações do produto. Verifique se a URL é válida.');
    }
};

function extractProductId(url: string): string | null {
    // Padrões possíveis de URLs do Mercado Livre
    const patterns = [
        /mercadolivre\.com\.br\/MLB-(\d+)/,
        /MLB-(\d+)/,
        /mercadolibre\.com\/MLB-(\d+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `MLB-${match[1]}`;
        }
    }

    return null;
}

function formatPrice(price: string): string {
    if (!price) return 'R$ 0,00';

    // Converte para número
    const numericPrice = parseFloat(price);

    // Formata o preço no padrão brasileiro
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericPrice);
} 