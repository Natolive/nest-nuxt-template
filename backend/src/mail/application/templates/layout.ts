import { APP_NAME } from '@socle/shared';
import { html } from '../html.js';
import type { SafeHtml } from '../safe-html.js';

// Adresse du front, pour les liens des emails.
export const appUrl = (path: string) => `${process.env.APP_URL}${path}`;

// Couleurs de l'appli (primaire de frontend/app/app.config.ts), en dur : les clients mail ignorent les variables CSS.
const PRIMARY = '#4f46e5';
const NIGHT = '#1e1b4b';
const TEXT = '#404040';
const MUTED = '#525252';
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

// Bouton en tableau : seul rendu fiable partout, Outlook compris. Le lien est aussi donné en clair en dessous.
export const button = (label: string, href: string) =>
  html`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 8px">
  <tr><td style="border-radius:10px;background:${PRIMARY}">
    <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px">${label}</a>
  </td></tr>
</table>
<p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${MUTED}">Le bouton ne marche pas ? Copie ce lien dans ton navigateur :<br><a href="${href}" style="color:${PRIMARY};word-break:break-all">${href}</a></p>`;

// Précision en petit sous le bouton (validité du lien, que faire si ce n'est pas toi).
export const note = (text: string) =>
  html`<p style="margin:0;padding-top:24px;border-top:1px solid #e5e5e5;font-size:14px;line-height:1.6;color:${MUTED}">${text}</p>`;

export const paragraph = (text: string) => html`<p style="margin:0 0 16px">${text}</p>`;

// Cadre commun à tous les emails : nom de l'appli, titre, contenu, pied de page.
// `preheader` : aperçu affiché après l'objet dans la boîte de réception, invisible dans l'email.
export const layout = ({ title, preheader, content }: { title: string; preheader: string; content: SafeHtml }): string =>
  html`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
      <tr><td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tr><td style="background:${NIGHT};padding:24px 44px">
            <a href="${appUrl('/')}" style="font-family:${FONT};font-size:22px;font-weight:bold;color:#ffffff;text-decoration:none">${APP_NAME}</a>
          </td></tr>
          <tr><td style="padding:40px 44px 44px;font-family:${FONT};font-size:16px;line-height:1.6;color:${TEXT}">
            <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;letter-spacing:-0.02em;color:${NIGHT}">${title}</h1>
            ${content}
          </td></tr>
        </table>
        <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED}">
          ${APP_NAME}<br>
          <a href="${appUrl('/')}" style="color:${MUTED}">${appUrl('/')}</a>
        </p>
      </td></tr>
    </table>
  </body>
</html>`.value;
