import axios from 'axios';

interface ProductInfo {
    name: string;
    normalPrice: string;
    promoPrice: string;
    imageUrl: string;
}

export const extractProductInfo = async (url: string): Promise<ProductInfo> => {
    try {
        // Aqui implementaremos a lógica para extrair os dados do produto
        // Por enquanto, retornamos dados de exemplo
        return {
            name: 'Produto de Exemplo',
            normalPrice: '99,90',
            promoPrice: '79,90',
            imageUrl: 'https://via.placeholder.com/300',
        };
    } catch (error) {
        throw new Error('Não foi possível extrair as informações do produto');
    }
}; 