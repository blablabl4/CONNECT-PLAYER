require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

async function testMercadoPago() {
    console.log('--- Iniciando Teste do Mercado Pago ---');

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('ERRO: MERCADO_PAGO_ACCESS_TOKEN não encontrado no .env');
        return;
    }

    console.log('Token encontrado. Tentando criar preferência de teste...');

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'test-item-01',
                        title: 'Produto de Teste (Script)',
                        quantity: 1,
                        unit_price: 10.0,
                        currency_id: 'BRL',
                    },
                ],
                payer: {
                    email: 'test_user_123@test.com',
                },
            },
        });

        console.log('--- SUCESSO! ---');
        console.log('Preferência criada com ID:', result.id);
        console.log('Link de Pagamento (Sandbox):', result.sandbox_init_point);
        console.log('Link de Pagamento (Produção):', result.init_point);
        console.log('------------------');
    } catch (error) {
        console.error('--- ERRO AO CRIAR PREFERÊNCIA ---');
        console.error(error);
    }
}

testMercadoPago();
