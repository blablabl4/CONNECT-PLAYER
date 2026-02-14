const { Resend } = require('resend');

const resend = new Resend('re_aMWdez4V_FWmeoQoHKVPhVkqWJwRDYcfr');

async function sendTest() {
    console.log('Sending test emails...');

    // Email 1: Credential delivery
    const credentialHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
        <tr><td align="center" style="padding:40px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#141414;border-radius:16px;overflow:hidden;border:1px solid #222;">
                <tr><td style="background:linear-gradient(135deg,#d4a04a 0%,#b8860b 100%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#000;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🎬 Connect Player</h1>
                    <p style="margin:8px 0 0;color:rgba(0,0,0,0.7);font-size:14px;">Entrega automática de credenciais</p>
                </td></tr>
                <tr><td style="padding:40px;">
                    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:600;">Olá, Isaque! 👋</h2>
                    <p style="margin:0 0 24px;color:#999;font-size:15px;line-height:1.6;">Sua compra foi confirmada com sucesso! Aqui estão seus dados de acesso para <strong style="color:#d4a04a;">Netflix Premium (4 Telas)</strong>.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #333;overflow:hidden;">
                        <tr><td style="padding:24px;">
                            <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email / Login</p>
                            <p style="margin:0 0 20px;color:#fff;font-size:16px;font-weight:600;word-break:break-all;">usuario@netflix.com</p>
                            <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Senha</p>
                            <p style="margin:0;color:#d4a04a;font-size:18px;font-weight:700;letter-spacing:0.5px;">SenhaSegura123!</p>
                        </td></tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                        <tr><td style="background-color:rgba(212,160,74,0.1);border-radius:8px;padding:16px;border-left:3px solid #d4a04a;">
                            <p style="margin:0;color:#d4a04a;font-size:13px;line-height:1.5;">⚠️ <strong>Importante:</strong> Não compartilhe esses dados com terceiros. Se notar qualquer acesso não autorizado, entre em contato conosco imediatamente.</p>
                        </td></tr>
                    </table>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #222;text-align:center;">
                    <p style="margin:0;color:#555;font-size:12px;">© 2026 Connect Player — Todos os direitos reservados.</p>
                    <p style="margin:8px 0 0;color:#444;font-size:11px;">Este email foi enviado automaticamente. Em caso de dúvidas, responda este email.</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body></html>`;

    // Email 2: Order confirmation
    const confirmHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
        <tr><td align="center" style="padding:40px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#141414;border-radius:16px;overflow:hidden;border:1px solid #222;">
                <tr><td style="background:linear-gradient(135deg,#d4a04a 0%,#b8860b 100%);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#000;font-size:24px;font-weight:700;">🎬 Connect Player</h1>
                </td></tr>
                <tr><td style="padding:40px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <span style="display:inline-block;width:56px;height:56px;background:rgba(34,197,94,0.15);border-radius:50%;line-height:56px;font-size:28px;">✅</span>
                    </div>
                    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:600;text-align:center;">Pagamento Confirmado!</h2>
                    <p style="margin:0 0 24px;color:#999;font-size:15px;line-height:1.6;text-align:center;">Olá Isaque, recebemos seu pagamento.</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #333;">
                        <tr><td style="padding:20px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr><td style="color:#888;font-size:13px;padding-bottom:12px;">Produto</td><td style="color:#fff;font-size:14px;font-weight:600;text-align:right;padding-bottom:12px;">Netflix Premium (4 Telas)</td></tr>
                                <tr><td style="color:#888;font-size:13px;padding-bottom:12px;">Valor</td><td style="color:#d4a04a;font-size:14px;font-weight:700;text-align:right;padding-bottom:12px;">R$ 19.99</td></tr>
                                <tr><td style="color:#888;font-size:13px;">Pedido</td><td style="color:#666;font-size:12px;text-align:right;font-family:monospace;">abc12345...</td></tr>
                            </table>
                        </td></tr>
                    </table>
                    <p style="margin:24px 0 0;color:#666;font-size:13px;text-align:center;line-height:1.5;">Seus dados de acesso serão enviados em um email separado em instantes.</p>
                </td></tr>
                <tr><td style="padding:24px 40px;border-top:1px solid #222;text-align:center;">
                    <p style="margin:0;color:#555;font-size:12px;">© 2026 Connect Player</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body></html>`;

    try {
        const r1 = await resend.emails.send({
            from: 'Connect Player <noreply@connectplayer.com.br>',
            to: 'isaquedasilvarocha@gmail.com',
            subject: '[TESTE] Seus dados de acesso - Netflix Premium',
            html: credentialHtml,
        });
        console.log('Credential email sent:', r1);

        const r2 = await resend.emails.send({
            from: 'Connect Player <noreply@connectplayer.com.br>',
            to: 'isaquedasilvarocha@gmail.com',
            subject: '[TESTE] Pedido confirmado - Connect Player',
            html: confirmHtml,
        });
        console.log('Confirmation email sent:', r2);

        console.log('✅ Both test emails sent!');
    } catch (err) {
        console.error('Error:', err);
    }
}

sendTest();
