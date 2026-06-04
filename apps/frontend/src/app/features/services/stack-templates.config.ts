/**
 * @fileoverview Stack Templates — vordefinierte Compose-Vorlagen für neue Stacks
 * @description Templates für häufige Deployments. Der Platzhalter {{name}} wird
 *   durch den vom User eingegebenen Namen ersetzt (z.B. "kunde1").
 *   Jedes Template liefert auch ws2k.json (NPM-Proxy) und .env.example (Secrets).
 * @module StackTemplates
 */

/** Vorlage für einen neuen Stack. */
export interface StackTemplate {
  /** Anzeigename im Template-Picker. */
  label: string;
  /** Kurzbeschreibung. */
  description: string;
  /** Emoji-Icon. */
  icon: string;
  /**
   * Präfix für den Stack-Namen.
   * Stack-Name wird: `${prefix}-${name}` (z.B. "wp-kunde1").
   */
  namePrefix: string;
  /** Platzhalter-Text im Name-Feld. */
  namePlaceholder: string;
  /**
   * Compose-YAML mit {{name}} als Platzhalter.
   * Wird beim Deploy durch den eingegebenen Namen ersetzt.
   */
  compose: string;
  /**
   * Inhalt der ws2k.json — NPM Proxy Host wird automatisch angelegt.
   * {{name}} wird ebenfalls ersetzt.
   */
  ws2k: string;
  /** .env.example mit CHANGE_ME_*-Platzhaltern für Auto-Generierung. */
  envExample: string;
}

/** Alle verfügbaren Stack-Templates. */
export const STACK_TEMPLATES: StackTemplate[] = [
  {
    label: 'WordPress Kunde',
    description: 'WordPress + MySQL — eigene Subdomain für jeden Kunden',
    icon: '📝',
    namePrefix: 'wp',
    namePlaceholder: 'z.B. kunde1 → wp-kunde1.dev2ksoftware.com',
    compose: `services:
  wp-{{name}}:
    image: wordpress:latest
    container_name: wp-{{name}}
    restart: unless-stopped
    environment:
      WORDPRESS_DB_HOST: wp-{{name}}-db:3306
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: \${DB_PASSWORD}
    volumes:
      - wp_{{name}}_data:/var/www/html
    networks:
      - npm_proxy
      - wp_{{name}}_internal
    depends_on:
      - wp-{{name}}-db

  wp-{{name}}-db:
    image: mysql:8.0
    container_name: wp-{{name}}-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: \${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD}
    volumes:
      - wp_{{name}}_db:/var/lib/mysql
    networks:
      - wp_{{name}}_internal
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 10

networks:
  npm_proxy:
    external: true
  wp_{{name}}_internal:
    driver: bridge

volumes:
  wp_{{name}}_data:
  wp_{{name}}_db:`,
    ws2k: `{
  "proxy": [
    { "subdomain": "wp-{{name}}", "container": "wp-{{name}}", "port": 80, "websockets": false }
  ]
}`,
    envExample: `# WordPress Datenbank-Passwörter (auto-generiert beim ersten Start)
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD
`,
  },
];

/**
 * Ersetzt {{name}} Platzhalter in einem Template-String.
 * @param {string} template - String mit {{name}} Platzhaltern.
 * @param {string} name - Eingesetzter Name.
 * @returns {string} String mit ersetzten Platzhaltern.
 */
export function applyTemplate(template: string, name: string): string {
  return template.replaceAll('{{name}}', name);
}
