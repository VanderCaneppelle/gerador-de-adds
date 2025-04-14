export const sendWhatsAppMessage = (phone: string, message: string) => {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // Criar o link do WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Abrir em uma nova janela
    window.open(whatsappUrl, '_blank');
};

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

export const formatProductMessage = (
    name: string,
    normalPrice: string | null,
    promoPrice: string,
    url: string
) => {
    let message = `*${name}*\n\n`;

    if (normalPrice) {
        message += `De: ~${normalPrice}~\n`;
    }

    message += `Por: *${promoPrice}*\n\n`;
    message += url;

    return message;
}; 