import { MailpitMailer } from '@src/mail/infrastructure/mailpit-mailer.js';

describe('MailpitMailer', () => {
  const mail = {
    to: { email: 'lea@exemple.fr', name: 'Léa' },
    subject: 'Bienvenue',
    html: '<p>Salut</p>',
  };
  const fetch = vi.fn();

  beforeEach(() => {
    fetch.mockReset().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    vi.stubEnv('MAILPIT_URL', 'http://mailpit:8025');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('hands the email to Mailpit', async () => {
    await new MailpitMailer().send(mail);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('http://mailpit:8025/api/v1/send');
    expect(JSON.parse(init.body)).toMatchObject({
      To: [{ Name: 'Léa', Email: 'lea@exemple.fr' }],
      Subject: mail.subject,
      HTML: mail.html,
    });
  });

  it('fails with the reason given by Mailpit', async () => {
    fetch.mockResolvedValue(new Response('bad request', { status: 400 }));
    await expect(new MailpitMailer().send(mail)).rejects.toThrow("Mailpit a refusé l'email (400) : bad request");
  });
});
