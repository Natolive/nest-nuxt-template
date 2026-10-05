import { APP_NAME } from '@socle/shared';
import { BrevoMailer } from '@src/mail/infrastructure/brevo-mailer.js';

describe('BrevoMailer', () => {
  const mail = {
    to: { email: 'lea@exemple.fr', name: 'Léa' },
    subject: 'Bienvenue',
    html: '<p>Salut</p>',
  };
  const fetch = vi.fn();

  beforeEach(() => {
    fetch.mockReset().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('MAIL_FROM', 'noreply@exemple.fr');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('only logs the email without an API key', async () => {
    vi.stubEnv('BREVO_API_KEY', '');
    await new BrevoMailer().send(mail);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends through the Brevo API', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test');
    await new BrevoMailer().send(mail);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers).toMatchObject({ 'api-key': 'xkeysib-test' });
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: APP_NAME, email: 'noreply@exemple.fr' },
      to: [mail.to],
      subject: mail.subject,
      htmlContent: mail.html,
    });
  });

  it('fails with the reason given by Brevo', async () => {
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test');
    fetch.mockResolvedValue(new Response('sender not valid', { status: 400 }));
    await expect(new BrevoMailer().send(mail)).rejects.toThrow("Brevo a refusé l'email (400) : sender not valid");
  });
});
