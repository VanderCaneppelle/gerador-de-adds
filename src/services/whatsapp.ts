export const downloadImage = async (imageUrl: string): Promise<Blob | null> => {
    try {
        // Função auxiliar para verificar se o blob é uma imagem válida
        const isValidImageBlob = (blob: Blob) => {
            return blob.type.startsWith('image/');
        };

        // Função para tentar baixar com diferentes métodos
        const tryFetch = async (url: string, options = {}) => {
            const response = await fetch(url, options);
            if (!response.ok) return null;
            const blob = await response.blob();
            return isValidImageBlob(blob) ? blob : null;
        };

        // Tenta baixar diretamente
        const directBlob = await tryFetch(imageUrl, {
            headers: {
                'Accept': 'image/webp,image/jpeg,image/png,image/*;q=0.8',
                'Referer': 'https://www.mercadolivre.com.br/'
            }
        });
        if (directBlob) return directBlob;

        // Tenta com o primeiro proxy
        const corsProxy = 'https://corsproxy.io/?';
        const proxyBlob = await tryFetch(corsProxy + encodeURIComponent(imageUrl), {
            headers: {
                'Accept': 'image/webp,image/jpeg,image/png,image/*;q=0.8',
                'Referer': 'https://www.mercadolivre.com.br/'
            }
        });
        if (proxyBlob) return proxyBlob;

        // Tenta com o segundo proxy
        const backupProxy = 'https://api.allorigins.win/raw?url=';
        const backupBlob = await tryFetch(backupProxy + encodeURIComponent(imageUrl), {
            headers: {
                'Accept': 'image/webp,image/jpeg,image/png,image/*;q=0.8'
            }
        });
        if (backupBlob) return backupBlob;

        throw new Error('Não foi possível baixar a imagem com nenhum dos métodos');
    } catch (error) {
        console.error('Erro ao baixar imagem:', error);
        return null;
    }
};

export const openWhatsApp = () => {
    try {
        // Tenta abrir o WhatsApp desktop/mobile usando o protocolo whatsapp://
        window.location.href = 'whatsapp://send';
    } catch (error) {
        // Fallback para WhatsApp Web se o app não estiver instalado
        window.open('https://web.whatsapp.com', '_blank');
    }
};

export const formatProductMessage = (
    name: string,
    normalPrice: string | null,
    promoPrice: string,
    url: string,
    couponCode?: string,
    additionalMessage?: string
) => {
    let message = `*${name}*\n\n`;

    if (normalPrice) {
        message += `De: ~${normalPrice}~\n`;
    }

    message += `Por: *${promoPrice}* 🔥🔥\n\n`;

    if (couponCode) {
        message += `CUPOM DE DESCONTO: *${couponCode}*\n\n`;
    }

    if (additionalMessage) {
        message += `${additionalMessage}\n\n`;
    }

    message += url;

    return message;
}; 