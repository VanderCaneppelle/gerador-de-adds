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
        // Limpa a URL removendo parâmetros após # e ?
        const cleanUrl = url.split(/[#?]/)[0].trim();

        // Verifica se é uma URL válida do Mercado Livre
        if (!cleanUrl.includes('mercadolivre.com.br') && !cleanUrl.includes('mercadolibre.com')) {
            throw new Error('URL inválida. Por favor, insira uma URL do Mercado Livre.');
        }

        // Usa um proxy CORS confiável
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(corsProxy + encodeURIComponent(cleanUrl), {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao acessar a página: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extrair o nome do produto
        const name = $('.ui-pdp-title').text().trim();
        if (!name) {
            throw new Error('Não foi possível encontrar o nome do produto');
        }

        // Tentar encontrar o preço riscado (normal)
        let normalPrice = null;
        const normalPriceContainer = $('.andes-money-amount--previous');
        if (normalPriceContainer.length > 0) {
            const fraction = normalPriceContainer.find('.andes-money-amount__fraction').text().trim();
            const cents = normalPriceContainer.find('.andes-money-amount__cents').text().trim();
            normalPrice = formatPrice(`${fraction},${cents || '00'}`);
        }

        // Encontrar o preço atual/promocional
        let promoPrice;
        const promoPriceContainer = $('.ui-pdp-price__second-line .andes-money-amount');
        if (promoPriceContainer.length > 0) {
            const fraction = promoPriceContainer.find('.andes-money-amount__fraction').first().text().trim();
            const cents = promoPriceContainer.find('.andes-money-amount__cents').first().text().trim();
            promoPrice = formatPrice(`${fraction},${cents || '00'}`);
        } else {
            throw new Error('Não foi possível encontrar o preço do produto');
        }

        // Encontrar a URL da imagem principal
        const imageUrl = $('.ui-pdp-gallery__figure img').first().attr('data-zoom') ||
            $('.ui-pdp-gallery__figure img').first().attr('src') ||
            $('.ui-pdp-image').first().attr('src') ||
            $('img[data-zoom]').first().attr('src');

        if (!imageUrl) {
            throw new Error('Não foi possível encontrar a imagem do produto');
        }

        return {
            name,
            normalPrice,
            promoPrice,
            imageUrl,
            url: cleanUrl
        };
    } catch (error) {
        console.error('Erro ao extrair informações:', error);
        throw new Error('Não foi possível extrair as informações do produto. Verifique se a URL é válida.');
    }
};

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