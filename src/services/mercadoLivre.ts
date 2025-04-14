import axios from 'axios';
import * as cheerio from 'cheerio';

interface MercadoLivreProduct {
    name: string;
    normalPrice: string | null;
    promoPrice: string;
    imageUrl: string;
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

export async function extractMercadoLivreInfo(url: string): Promise<MercadoLivreProduct> {
    try {
        // Converter a URL para usar o proxy
        const proxyUrl = url.replace('https://www.mercadolivre.com.br', '/api');
        console.log('Fazendo requisição para:', proxyUrl);

        const response = await axios.get(proxyUrl);
        const $ = cheerio.load(response.data);
        console.log('HTML carregado com sucesso');

        // Extrair o nome do produto
        const name = $('.ui-pdp-title').text().trim();
        console.log('Nome extraído:', name);

        // Extrair preços
        let normalPrice = null;
        let promoPrice = '';

        // Tentar encontrar o preço riscado (normal)
        const strikedPriceElement = $('.andes-money-amount.ui-pdp-price__part.ui-pdp-price__original-value');
        if (strikedPriceElement.length > 0) {
            const strikedPrice = strikedPriceElement.find('.andes-money-amount__fraction').text().trim();
            const strikedCents = strikedPriceElement.find('.andes-money-amount__cents').text().trim();
            normalPrice = formatPrice(`${strikedPrice},${strikedCents || '00'}`);
            console.log('Preço normal encontrado:', normalPrice);
        }

        // Extrair o preço atual/promocional
        const currentPriceElement = $('.ui-pdp-price__second-line .andes-money-amount');
        const currentPrice = currentPriceElement.find('.andes-money-amount__fraction').first().text().trim();
        const currentCents = currentPriceElement.find('.andes-money-amount__cents').first().text().trim();
        promoPrice = formatPrice(`${currentPrice},${currentCents || '00'}`);
        console.log('Preço promocional encontrado:', promoPrice);

        // Se não encontrou preço riscado, o preço normal é igual ao promocional
        if (!normalPrice) {
            normalPrice = promoPrice;
        }

        // Extrair URL da imagem
        const imageUrl = $('.ui-pdp-gallery__figure img').first().attr('src') ||
            $('figure.ui-pdp-gallery__figure img').first().attr('src') ||
            $('.ui-pdp-image').first().attr('src') ||
            '';

        console.log('Informações extraídas:', { name, normalPrice, promoPrice, imageUrl });

        if (!name || !promoPrice) {
            throw new Error('Não foi possível extrair as informações necessárias');
        }

        return {
            name,
            normalPrice,
            promoPrice,
            imageUrl
        };
    } catch (error: any) {
        console.error('Erro ao extrair informações:', error);
        throw new Error('Não foi possível extrair as informações necessárias');
    }
}

function formatPrice(price: string): string {
    if (!price) return 'R$ 0,00';
    // Remove tudo que não for número ou vírgula
    const cleanPrice = price.replace(/[^\d,]/g, '');
    // Converte para número
    const numericPrice = parseFloat(cleanPrice.replace(',', '.'));
    return `R$ ${numericPrice.toFixed(2).replace('.', ',')}`;
} 