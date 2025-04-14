import axios from 'axios';
import * as cheerio from 'cheerio';

interface MercadoLivreProduct {
    name: string;
    normalPrice: string;
    promoPrice: string;
    imageUrl: string;
    customLink?: string; // Link personalizado para o anúncio
}

const CLIENT_ID = import.meta.env.VITE_ML_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_ML_CLIENT_SECRET;

async function getAccessToken(): Promise<string> {
    try {
        // Criar form data conforme recomendação do ML
        const formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        formData.append('client_id', CLIENT_ID || '');
        formData.append('client_secret', CLIENT_SECRET || '');

        const response = await axios.post(
            'https://api.mercadolibre.com/oauth/token',
            formData,
            {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (!response.data.access_token) {
            throw new Error('Token não recebido');
        }

        return response.data.access_token;
    } catch (error: any) {
        console.error('Erro ao obter token:', error.response?.data || error);
        throw new Error('Falha ao obter token de acesso');
    }
}

export async function extractMercadoLivreInfo(url: string, customLink?: string): Promise<MercadoLivreProduct> {
    try {
        // Converter a URL original para usar o proxy
        const proxyUrl = url.replace('https://www.mercadolivre.com.br', '/ml-proxy');

        console.log('Fazendo requisição para:', proxyUrl);

        const response = await axios.get(proxyUrl);
        const $ = cheerio.load(response.data);

        // Extrair as informações usando diferentes seletores possíveis
        const name = $('h1.ui-pdp-title').text().trim();

        // Extrair preços
        let normalPrice = '';
        let promoPrice = '';

        // Procurar pelo preço riscado (preço normal)
        const strikedPrice = $('.ui-pdp-price__original-value .andes-money-amount__fraction').text().trim();
        const strikedCents = $('.ui-pdp-price__original-value .andes-money-amount__cents').text().trim();

        // Procurar pelo preço atual (promocional)
        const currentPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim();
        const currentCents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim();

        if (strikedPrice) {
            // Se tem preço riscado, esse é o preço normal
            normalPrice = `${strikedPrice},${strikedCents || '00'}`;
            promoPrice = `${currentPrice},${currentCents || '00'}`;
        } else {
            // Se não tem preço riscado, o preço normal é igual ao atual
            normalPrice = `${currentPrice},${currentCents || '00'}`;
            promoPrice = normalPrice;
        }

        // Tentar encontrar a imagem principal
        const imageUrl = $('.ui-pdp-gallery__figure img').first().attr('src') ||
            $('figure.ui-pdp-gallery__figure img').first().attr('src') ||
            $('.ui-pdp-image').first().attr('src') ||
            '';

        console.log('Informações extraídas:', { name, normalPrice, promoPrice, imageUrl });

        if (!name || !normalPrice) {
            throw new Error('Não foi possível extrair as informações necessárias');
        }

        return {
            name,
            normalPrice: formatPrice(normalPrice),
            promoPrice: formatPrice(promoPrice),
            imageUrl,
            customLink // Link personalizado para o WhatsApp
        };
    } catch (error: any) {
        console.error('Erro ao extrair informações:', error);
        throw new Error(`Erro ao extrair informações: ${error.message}`);
    }
}

function formatPrice(price: string): string {
    if (!price) return 'R$ 0,00';
    // Remove tudo que não for número ou vírgula
    const cleanPrice = price.replace(/[^\d,]/g, '');
    // Converte para número
    const numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    return `R$ ${numericPrice.toFixed(2)}`;
} 