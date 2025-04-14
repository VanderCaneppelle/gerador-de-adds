import axios from 'axios';
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
        const cleanUrl = url.split(/[#?]/)[0];

        // Usa um proxy CORS alternativo
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(corsProxy + encodeURIComponent(cleanUrl), {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3'
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