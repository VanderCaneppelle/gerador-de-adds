export const downloadImage = async (imageUrl: string) => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
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
    couponCode?: string
) => {
    let message = `*${name}*\n\n`;

    if (normalPrice) {
        message += `De: ~${normalPrice}~\n`;
    }

    message += `Por: *${promoPrice}*\n\n`;

    if (couponCode) {
        message += `CUPOM DE DESCONTO: *${couponCode}*\n\n`;
    }

    message += url;

    return message;
}; 