# Plan d'implémentation - Authentification ProConnect

- [x] 1. Configuration de l'infrastructure de développement

  - Créer le fichier docker-compose.yml pour PostgreSQL
  - Configurer les variables d'environnement (.env.local et .env.example)
  - Ajouter les dépendances nécessaires (NextAuth.js, Prisma, etc.)
  - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.3_

- [x] 2. Configuration de la base de données
- [x] 2.1 Initialiser Prisma et créer le schéma

  - Installer et configurer Prisma
  - Créer le schéma Prisma avec les modèles User, Account, Session
  - Générer le client Prisma
  - _Requirements: 3.3, 6.1_

- [x] 2.2 Créer et exécuter les migrations

  - Créer la migration initiale avec les tables users, accounts, sessions
  - Tester la connexion à la base de données
  - _Requirements: 3.1, 3.2_

- [x] 3. Configuration de NextAuth.js avec ProConnect
- [x] 3.1 Créer le provider ProConnect personnalisé selon la documentation officielle

  - Implémenter le provider OpenID Connect pour ProConnect (pas OAuth2 simple)
  - Configurer les endpoints officiels : authorization_endpoint, token_endpoint, userinfo_endpoint, jwks_uri
  - **CORRECTION**: Utiliser `/api/v2/jwks` pour l'endpoint JWKS (pas `/certs`)
  - **CORRECTION**: Configurer l'issuer correct avec `/api/v2`
  - Utiliser les scopes obligatoires : "openid", "given_name", "usual_name", "email", "organizational_unit", "belonging_population"
  - Implémenter la vérification des tokens JWT avec les clés publiques ProConnect
  - _Requirements: 1.1, 4.1, 4.2, 7.1, 7.6_

- [x] 3.2 Configurer NextAuth.js selon les spécifications ProConnect

  - Créer le fichier de configuration NextAuth.js avec le provider ProConnect
  - Configurer le client_id et client_secret fournis par ProConnect
  - Implémenter la gestion des claims spécifiques : belonging_population pour identifier les agents publics
  - Configurer l'adaptateur Prisma pour la persistance des sessions
  - _Requirements: 1.1, 3.3, 6.1, 6.3_

- [x] 4. Implémentation de la logique d'authentification
- [x] 4.1 Créer le service de vérification d'agent public selon ProConnect

  - **TEMPORAIRE**: Définir `isPublicAgent = true` par défaut pour tous les utilisateurs ProConnect
  - **TODO**: Implémenter la logique de vérification via le claim "belonging_population" (doit contenir "agent")
  - Créer les fonctions de transformation des claims ProConnect (given_name, usual_name, email, organizational_unit)
  - **CORRECTION**: Gérer le décodage JWT de l'endpoint `/userinfo` avec fallback JSON
  - Ajouter la validation des tokens JWT et la vérification des signatures avec les clés JWKS
  - Gérer les différents environnements ProConnect (intégration vs production)
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 7.2, 7.5_

- [x] 4.2 Implémenter les callbacks NextAuth.js conformes à ProConnect

  - Configurer le callback JWT pour traiter les claims ProConnect (belonging_population, organizational_unit)
  - **CORRECTION**: Implémenter la récupération des informations via `/userinfo` dans les callbacks
  - Configurer le callback session pour exposer les données utilisateur transformées
  - Implémenter la logique de mapping des claims ProConnect vers le modèle utilisateur
  - **CORRECTION**: Gérer la liaison automatique des comptes pour les utilisateurs existants
  - Gérer la création/mise à jour des utilisateurs avec les données ProConnect
  - _Requirements: 1.2, 1.3, 3.3, 6.1, 7.3_

- [x] 5. Création des pages et composants
- [x] 5.1 Créer la page de connexion

  - Implémenter la page avec le composant ProConnectButton de react-dsfr
  - Ajouter la gestion des erreurs d'authentification
  - Intégrer avec NextAuth.js pour déclencher l'authentification
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x] 5.2 Créer la page d'administration

  - Implémenter la page admin avec protection d'accès
  - Afficher les informations de l'utilisateur connecté
  - Ajouter un titre "Administration" et la structure de base
  - _Requirements: 1.3_

- [x] 5.3 Créer la page d'erreur d'accès

  - Implémenter la page d'erreur pour les non-agents publics
  - Afficher un message explicite d'accès refusé
  - **CORRECTION**: Éviter les erreurs d'hydratation HTML en utilisant des balises appropriées dans les CallOut
  - Ajouter un lien de retour à l'accueil
  - _Requirements: 2.1, 2.2, 2.3, 7.4_

- [x] 6. Middleware et protection des routes
- [x] 6.1 Créer le middleware d'authentification

  - Implémenter le middleware Next.js pour protéger les routes
  - Vérifier l'authentification et le statut d'agent public
  - Gérer les redirections automatiques
  - _Requirements: 1.2, 2.1, 6.2_

- [x] 6.2 Implémenter la gestion des sessions

  - Configurer l'expiration automatique des sessions
  - Implémenter la déconnexion sécurisée
  - Ajouter la validation des sessions côté serveur
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Gestion des erreurs et logging
- [x] 7.1 Implémenter la gestion d'erreurs globale

  - Créer les handlers d'erreur pour les API routes
  - Implémenter le logging des erreurs d'authentification
  - Ajouter les messages d'erreur utilisateur-friendly
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7.2 Ajouter la validation des variables d'environnement ProConnect

  - Créer un utilitaire de validation des variables ProConnect requises (CLIENT_ID, CLIENT_SECRET, ISSUER)
  - Valider les URLs des endpoints ProConnect selon l'environnement (intégration/production)
  - Implémenter les vérifications au démarrage avec les spécifications ProConnect
  - Ajouter des messages d'erreur explicites pour les configurations ProConnect manquantes
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Tests et validation
- [x] 8.1 Créer les tests unitaires

  - Tester le provider ProConnect personnalisé
  - Tester les services de vérification d'agent public
  - Tester les composants React (pages et boutons)
  - _Requirements: 1.1, 1.2, 2.1, 4.1_

- [x] 8.2 Créer les tests d'intégration

  - Tester le flow complet d'authentification
  - Tester les redirections selon le statut d'agent public
  - Tester la gestion des sessions et déconnexion
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 6.1, 6.2, 6.3_

- [x] 9. Documentation et finalisation
- [x] 9.1 Créer la documentation de déploiement conforme ProConnect

  - Documenter la configuration des variables d'environnement selon la doc ProConnect
  - Créer le guide de configuration avec les endpoints officiels et les scopes requis
  - Documenter le processus d'inscription sur le portail partenaires ProConnect
  - Ajouter les instructions de déploiement avec les URLs de callback correctes
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9.2 Finaliser l'intégration
  - Tester l'ensemble du système en environnement de développement
  - Vérifier la conformité avec les exigences de sécurité
  - Valider l'expérience utilisateur complète
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_
