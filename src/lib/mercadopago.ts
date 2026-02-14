import { MercadoPagoConfig, Preference } from 'mercadopago';

// Lazy initialization — don't throw during build time
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

export const mpClient = new MercadoPagoConfig({
    accessToken,
});

export const mpPreference = new Preference(mpClient);
