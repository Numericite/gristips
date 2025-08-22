# Guide de Déploiement - Gristips

Ce guide détaille la configuration et le déploiement de Gristips avec l'authentification ProConnect conforme aux spécifications officielles.

## 📋 Prérequis

### Environnement technique

- **Node.js** 18.0.0 ou supérieur
- **PostgreSQL** 15 ou supérieur
- **Domaine** en `.gouv.fr` (obligatoire pour la production)
- **Certificat SSL/TLS** valide (HTTPS obligatoire en production)

### Compte ProConnect

- **Compte partenaire** sur le portail ProConnect
- **Application déclarée** avec les bonnes URLs de callback
- **Identifiants** CLIENT_ID et CLIENT_SECRET

## 🔧 Configuration ProConnect

### 1. Inscription sur le portail partenaires

1. **Accès au portail**

   - Rendez-vous sur [https://partenaires.proconnect.gouv.fr/](https://partenaires.proconnect.gouv.fr/)
   - Créez un compte avec votre adresse email professionnelle (obligatoirement en `.gouv.fr`)

2. **Validation du compte**
   - Validez votre email professionnel
   - Attendez la validation par l'équipe ProConnect (peut prendre quelques jours ouvrés)

### 2. Création d'une application

1. **Nouvelle application**

   - Dans votre espace partenaire, cliquez sur "Créer une application"
   - Renseignez les informations de votre service :
     - **Nom de l'application** : Gristips
     - **Description** : Plateforme d'automatisation Grist pour agents publics
     - **URL du service** : Votre domaine de production

2. **Configuration technique**
   - **Type d'application** : Application web
   - **Méthode d'authentification** : OpenID Connect (pas OAuth2 simple)
   - **Grant types** : `authorization_code`

### 3. Configuration des URLs de callback

#### Développement

```
http://localhost:3000/api/auth/callback/proconnect
```

#### Production

```
https://votre-domaine.gouv.fr/api/auth/callback/proconnect
```

⚠️ **Important** : Les URLs de callback doivent être exactement configurées dans votre application ProConnect. Toute différence causera des erreurs d'authentification.

### 4. Endpoints ProConnect officiels

#### Environnement d'intégration et production

```
PROCONNECT_ISSUER=https://auth.agentconnect.gouv.fr/api/v2
```

**Endpoints automatiquement découverts** :

- **Authorization** : `https://auth.agentconnect.gouv.fr/api/v2/authorize`
- **Token** : `https://auth.agentconnect.gouv.fr/api/v2/token`
- **UserInfo** : `https://auth.agentconnect.gouv.fr/api/v2/userinfo`
- **JWKS** : `https://auth.agentconnect.gouv.fr/api/v2/jwks`

> **Note** : AgentConnect utilise la même URL pour les environnements d'intégration et de production. La différenciation se fait au niveau des identifiants CLIENT_ID et CLIENT_SECRET.

### 5. Scopes requis

L'application utilise les scopes OpenID Connect suivants (conformes à la documentation ProConnect) :

```
openid given_name usual_name email organizational_unit belonging_population
```

**Détail des scopes** :

- `openid` : Scope obligatoire pour OpenID Connect
- `given_name` : Prénom de l'utilisateur
- `usual_name` : Nom de famille (ProConnect utilise `usual_name`, pas `family_name`)
- `email` : Adresse email professionnelle
- `organizational_unit` : Unité organisationnelle (ministère, direction, etc.)
- `belonging_population` : Population d'appartenance (contient "agent" pour les agents publics)

### 6. Récupération des identifiants

Une fois votre application approuvée :

1. **CLIENT_ID** : Identifiant unique de votre application (format UUID)
2. **CLIENT_SECRET** : Clé secrète de votre application (chaîne sécurisée)

⚠️ **Sécurité** : Ne jamais exposer le CLIENT_SECRET côté client ou dans les logs.

## 🌍 Configuration des variables d'environnement

### Variables ProConnect

#### Développement (`.env.local`)

```env
# ProConnect Configuration - Environnement d'intégration
PROCONNECT_CLIENT_ID=votre_client_id_integration
PROCONNECT_CLIENT_SECRET=votre_client_secret_integration
PROCONNECT_ISSUER=https://auth.agentconnect.gouv.fr/api/v2
```

#### Production (`.env.production`)

```env
# ProConnect Configuration - Environnement de production
PROCONNECT_CLIENT_ID=votre_client_id_production
PROCONNECT_CLIENT_SECRET=votre_client_secret_production
PROCONNECT_ISSUER=https://auth.agentconnect.gouv.fr/api/v2
```

### Variables NextAuth.js

#### Développement

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development_secret_change_in_production
```

#### Production

```env
# NextAuth Configuration
NEXTAUTH_URL=https://votre-domaine.gouv.fr
NEXTAUTH_SECRET=votre_secret_production_securise
```

**Génération du secret NextAuth** :

```bash
# Générer un secret sécurisé de 32 caractères
openssl rand -base64 32
```

### Variables de base de données

#### Développement (Docker local)

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/gristips_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=gristips_dev
```

#### Production

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@db-host:5432/gristips_prod
```

### Validation des variables

L'application valide automatiquement les variables d'environnement au démarrage. Les variables suivantes sont **obligatoires** :

**ProConnect** :

- `PROCONNECT_CLIENT_ID` : Ne doit pas contenir les valeurs par défaut
- `PROCONNECT_CLIENT_SECRET` : Ne doit pas contenir les valeurs par défaut
- `PROCONNECT_ISSUER` : Doit être une URL valide ProConnect

**NextAuth.js** :

- `NEXTAUTH_URL` : URL complète de l'application
- `NEXTAUTH_SECRET` : Secret de 32 caractères minimum

**Base de données** :

- `DATABASE_URL` : URL de connexion PostgreSQL valide

## 🚀 Déploiement

### 1. Préparation de l'environnement

#### Installation des dépendances

```bash
npm ci --production
```

#### Configuration de la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy
```

### 2. Build de l'application

```bash
# Build pour la production
npm run build
```

### 3. Vérification de la configuration

Avant le déploiement, vérifiez la configuration :

```bash
# Démarrer l'application en mode production
npm run start

# Accéder à la page de vérification
https://votre-domaine.gouv.fr/admin/config-check
```

Cette page vérifie :

- ✅ Variables d'environnement ProConnect
- ✅ Connectivité aux endpoints ProConnect
- ✅ Configuration de la base de données
- ✅ Validation des secrets et URLs

### 4. Configuration du serveur web

#### Nginx (recommandé)

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.gouv.fr;

    # Certificats SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name votre-domaine.gouv.fr;
    return 301 https://$server_name$request_uri;
}
```

#### Apache

```apache
<VirtualHost *:443>
    ServerName votre-domaine.gouv.fr

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Security Headers
    Header always set Strict-Transport-Security "max-age=63072000"
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Proxy to Next.js
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

<VirtualHost *:80>
    ServerName votre-domaine.gouv.fr
    Redirect permanent / https://votre-domaine.gouv.fr/
</VirtualHost>
```

### 5. Service systemd (Linux)

Créez un service systemd pour gérer l'application :

```ini
# /etc/systemd/system/gristips.service
[Unit]
Description=Gristips Application
After=network.target

[Service]
Type=simple
User=gristips
WorkingDirectory=/opt/gristips
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

# Variables d'environnement (ou utiliser EnvironmentFile)
Environment=NEXTAUTH_URL=https://votre-domaine.gouv.fr
Environment=DATABASE_URL=postgresql://user:pass@localhost:5432/gristips_prod

[Install]
WantedBy=multi-user.target
```

Activation du service :

```bash
sudo systemctl daemon-reload
sudo systemctl enable gristips
sudo systemctl start gristips
sudo systemctl status gristips
```

### 6. Configuration de la base de données PostgreSQL

#### Installation PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

#### Configuration de la base de données

```sql
-- Connexion en tant que postgres
sudo -u postgres psql

-- Créer la base de données et l'utilisateur
CREATE DATABASE gristips_prod;
CREATE USER gristips_user WITH ENCRYPTED PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE gristips_prod TO gristips_user;

-- Configuration des permissions
\c gristips_prod
GRANT ALL ON SCHEMA public TO gristips_user;
```

#### Configuration PostgreSQL (`postgresql.conf`)

```ini
# Connexions
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Mémoire
shared_buffers = 256MB
effective_cache_size = 1GB

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
```

## 🔒 Sécurité en production

### 1. Configuration HTTPS

**Obligatoire** : HTTPS doit être activé en production pour ProConnect.

- Utilisez des certificats valides (Let's Encrypt recommandé)
- Configurez HSTS (HTTP Strict Transport Security)
- Désactivez les protocoles SSL/TLS obsolètes

### 2. Configuration des cookies

NextAuth.js configure automatiquement les cookies sécurisés en production :

```javascript
// Configuration automatique en production
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true // Automatique en HTTPS
    }
  }
}
```

### 3. Variables d'environnement sécurisées

- **Ne jamais** commiter les fichiers `.env.production`
- Utiliser des gestionnaires de secrets (HashiCorp Vault, AWS Secrets Manager, etc.)
- Restreindre l'accès aux variables d'environnement sur le serveur

### 4. Monitoring et logs

#### Configuration des logs

```javascript
// next.config.ts
const nextConfig = {
  // Désactiver les logs détaillés en production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};
```

#### Monitoring recommandé

- **Uptime** : Surveillance de la disponibilité
- **Performance** : Temps de réponse et métriques
- **Erreurs** : Alertes sur les erreurs d'authentification
- **Sécurité** : Tentatives d'accès non autorisées

## 🧪 Tests de déploiement

### 1. Tests de connectivité ProConnect

```bash
# Test de l'endpoint de découverte
curl -s "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/.well-known/openid_configuration" | jq .

# Test des certificats JWKS
curl -s "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/protocol/openid-connect/certs" | jq .
```

### 2. Tests d'authentification

1. **Test de redirection**

   - Accédez à `https://votre-domaine.gouv.fr/admin`
   - Vérifiez la redirection vers ProConnect

2. **Test de callback**

   - Authentifiez-vous avec un compte agent public
   - Vérifiez la redirection vers `/admin`

3. **Test de refus d'accès**
   - Authentifiez-vous avec un compte non-agent public
   - Vérifiez la redirection vers `/auth/access-denied`

### 3. Tests de sécurité

```bash
# Test HTTPS
curl -I https://votre-domaine.gouv.fr

# Test des headers de sécurité
curl -I https://votre-domaine.gouv.fr | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"

# Test de redirection HTTP vers HTTPS
curl -I http://votre-domaine.gouv.fr
```

## 🔧 Maintenance

### 1. Mise à jour des dépendances

```bash
# Vérifier les mises à jour de sécurité
npm audit

# Mettre à jour les dépendances
npm update

# Rebuild après mise à jour
npm run build
```

### 2. Sauvegarde de la base de données

```bash
# Sauvegarde quotidienne
pg_dump -h localhost -U gristips_user gristips_prod > backup_$(date +%Y%m%d).sql

# Script de sauvegarde automatique
#!/bin/bash
BACKUP_DIR="/opt/backups/gristips"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U gristips_user gristips_prod | gzip > "$BACKUP_DIR/gristips_$DATE.sql.gz"

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "gristips_*.sql.gz" -mtime +30 -delete
```

### 3. Rotation des secrets

**Fréquence recommandée** : Tous les 6 mois

1. **NEXTAUTH_SECRET**

   ```bash
   # Générer un nouveau secret
   openssl rand -base64 32
   ```

2. **CLIENT_SECRET ProConnect**
   - Générer un nouveau secret dans le portail partenaires
   - Mettre à jour la variable d'environnement
   - Redémarrer l'application

### 4. Monitoring des logs

```bash
# Logs de l'application
journalctl -u gristips -f

# Logs d'erreur uniquement
journalctl -u gristips -p err

# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

## 📞 Support et dépannage

### Contacts utiles

- **Support ProConnect** : [support@proconnect.gouv.fr](mailto:support@proconnect.gouv.fr)
- **Documentation ProConnect** : [https://partenaires.proconnect.gouv.fr/documentation](https://partenaires.proconnect.gouv.fr/documentation)
- **DSFR** : [https://www.systeme-de-design.gouv.fr/](https://www.systeme-de-design.gouv.fr/)

### Problèmes courants

#### 1. Erreur "invalid_client"

- Vérifiez CLIENT_ID et CLIENT_SECRET
- Vérifiez l'URL de callback dans ProConnect
- Vérifiez l'environnement ProConnect (intégration vs production)

#### 2. Erreur "access_denied"

- L'utilisateur n'est pas un agent public
- Vérifiez le claim `belonging_population` dans les logs

#### 3. Erreur de certificat SSL

- Vérifiez la validité du certificat
- Vérifiez la configuration du serveur web
- Testez avec `curl -I https://votre-domaine.gouv.fr`

#### 4. Erreur de base de données

- Vérifiez la connectivité PostgreSQL
- Vérifiez les permissions de l'utilisateur
- Exécutez `npx prisma migrate deploy`

### Logs de débogage

En cas de problème, activez les logs détaillés :

```env
# .env.production
DEBUG=next-auth:*
NEXTAUTH_DEBUG=true
```

⚠️ **Attention** : Désactivez les logs de débogage après résolution du problème pour éviter l'exposition d'informations sensibles.

## ✅ Checklist de déploiement

### Avant le déploiement

- [ ] Application ProConnect créée et approuvée
- [ ] CLIENT_ID et CLIENT_SECRET récupérés
- [ ] URLs de callback configurées
- [ ] Domaine en `.gouv.fr` configuré
- [ ] Certificat SSL/TLS installé
- [ ] Base de données PostgreSQL configurée
- [ ] Variables d'environnement définies
- [ ] Tests en environnement de développement réussis

### Déploiement

- [ ] Code déployé sur le serveur
- [ ] Dépendances installées (`npm ci --production`)
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Migrations appliquées (`npx prisma migrate deploy`)
- [ ] Application buildée (`npm run build`)
- [ ] Service systemd configuré et démarré
- [ ] Serveur web (Nginx/Apache) configuré
- [ ] HTTPS activé et fonctionnel

### Après le déploiement

- [ ] Page de vérification de configuration accessible
- [ ] Test d'authentification avec compte agent public réussi
- [ ] Test de refus d'accès avec compte non-agent public réussi
- [ ] Headers de sécurité présents
- [ ] Logs de l'application fonctionnels
- [ ] Monitoring configuré
- [ ] Sauvegarde de la base de données configurée
- [ ] Documentation de maintenance créée

## 📈 Optimisations de performance

### 1. Configuration Next.js

```javascript
// next.config.ts
const nextConfig = {
  // Compression
  compress: true,

  // Optimisation des images
  images: {
    formats: ["image/webp", "image/avif"],
  },

  // Cache des pages statiques
  generateEtags: true,

  // Optimisation du bundle
  experimental: {
    optimizeCss: true,
  },
};
```

### 2. Configuration PostgreSQL

```ini
# postgresql.conf - Optimisations pour production
shared_buffers = 25% de la RAM
effective_cache_size = 75% de la RAM
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

### 3. Cache et CDN

- Configurez un CDN pour les assets statiques
- Utilisez Redis pour le cache de session (optionnel)
- Configurez le cache navigateur pour les ressources statiques

Cette documentation couvre tous les aspects du déploiement de Gristips avec ProConnect selon les spécifications officielles. Suivez chaque étape dans l'ordre pour un déploiement réussi et sécurisé.
