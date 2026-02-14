import { MercadoPagoConfig, Preference } from 'mercadopago';

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN is not defined in .env');
}

export const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const mpPreference = new Preference(mpClient);
