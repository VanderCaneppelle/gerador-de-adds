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

        // Tenta diferentes proxies CORS em ordem
        const proxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ];

        let html = '';
        let error = null;

        // Tenta cada proxy até conseguir
        for (const proxy of proxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(cleanUrl), {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                html = await response.text();
                if (html) break; // Se conseguiu o HTML, sai do loop
            } catch (e) {
                error = e;
                console.log(`Erro com proxy ${proxy}:`, e);
                continue; // Tenta o próximo proxy
            }
        }

        if (!html) {
            throw error || new Error('Não foi possível acessar a página do produto');
        }

        const $ = cheerio.load(html);

        // Extrair o nome do produto
        const name = $('.ui-pdp-title').text().trim();
        if (!name) {
            throw new Error('Não foi possível encontrar o nome do produto');
        }

        // Tentar encontrar o preço riscado (normal)
        let normalPrice = '';
        const priceInteger = $('.andes-money-amount__fraction').first().text().trim();
        const priceCents = $('.andes-money-amount__cents').first().text().trim();

        // Encontrar o preço promocional
        const promoPriceElement = $('.ui-pdp-price__second-line .andes-money-amount');
        let promoPrice = '';

        if (promoPriceElement.length > 0) {
            const promoInteger = promoPriceElement.find('.andes-money-amount__fraction').first().text().trim();
            const promoCents = promoPriceElement.find('.andes-money-amount__cents').first().text().trim();
            promoPrice = formatPrice(`${promoInteger},${promoCents || '00'}`);
            normalPrice = formatPrice(`${priceInteger},${priceCents || '00'}`);
        } else {
            // Se não houver preço promocional, o preço normal é o preço atual
            normalPrice = formatPrice(`${priceInteger},${priceCents || '00'}`);
            promoPrice = normalPrice;
        }

        // Encontrar a URL da imagem principal
        const imageUrl = $('.ui-pdp-gallery__figure img').first().attr('data-zoom') ||
            $('.ui-pdp-gallery__figure img').first().attr('src') ||
            $('.ui-pdp-image').first().attr('src') ||
            $('img[data-zoom]').first().attr('src') || '';

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
    // Converte para número
    const numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
} 