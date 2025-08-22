# Requirements Document

## Introduction

Cette fonctionnalité permet l'authentification des utilisateurs via ProConnect, le service d'authentification de l'État français. Elle inclut la vérification du statut d'agent public et la redirection appropriée vers une interface d'administration ou une page d'erreur selon les droits d'accès.

## Requirements

### Requirement 1

**User Story:** En tant qu'agent public, je veux me connecter via ProConnect, afin d'accéder à l'interface d'administration de l'application.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur le bouton ProConnect THEN le système SHALL rediriger vers le service d'authentification ProConnect
2. WHEN l'authentification ProConnect est réussie THEN le système SHALL récupérer les informations utilisateur via l'endpoint `/userinfo`
3. WHEN l'endpoint `/userinfo` retourne un JWT THEN le système SHALL décoder automatiquement le JWT pour extraire les informations utilisateur
4. WHEN l'authentification ProConnect est réussie THEN le système SHALL considérer l'utilisateur comme agent public (temporairement)
5. WHEN l'utilisateur est authentifié THEN le système SHALL rediriger vers la page d'administration
6. WHEN l'utilisateur accède à la page d'administration THEN le système SHALL afficher un titre "Administration" et les informations de l'utilisateur connecté

### Requirement 2

**User Story:** En tant qu'utilisateur non-agent public, je veux être informé que je n'ai pas accès au service, afin de comprendre pourquoi l'accès m'est refusé.

#### Acceptance Criteria

1. WHEN l'authentification ProConnect est réussie AND l'utilisateur n'est pas un agent public THEN le système SHALL rediriger vers une page d'erreur
2. WHEN l'utilisateur accède à la page d'erreur THEN le système SHALL afficher un message explicite indiquant qu'il n'a pas accès au service
3. WHEN l'utilisateur est sur la page d'erreur THEN le système SHALL proposer un lien de retour à l'accueil

### Requirement 3

**User Story:** En tant que développeur, je veux une base de données PostgreSQL configurée, afin de stocker les informations des utilisateurs et leurs sessions.

#### Acceptance Criteria

1. WHEN l'environnement de développement est lancé THEN le système SHALL démarrer une instance PostgreSQL via Docker Compose
2. WHEN l'application se connecte à la base THEN le système SHALL utiliser les variables d'environnement pour la configuration
3. WHEN un utilisateur se connecte THEN le système SHALL stocker les informations de session dans la base de données

### Requirement 4

**User Story:** En tant que développeur, je veux intégrer le composant react-dsfr ProConnectButton, afin d'avoir une interface utilisateur conforme aux standards de l'État.

#### Acceptance Criteria

1. WHEN la page d'accueil est affichée THEN le système SHALL présenter le bouton ProConnect avec le design react-dsfr
2. WHEN le composant ProConnectButton est rendu THEN le système SHALL respecter les guidelines visuelles du DSFR
3. WHEN l'utilisateur interagit avec le bouton THEN le système SHALL déclencher le processus d'authentification ProConnect

### Requirement 5

**User Story:** En tant qu'administrateur système, je veux que les variables d'environnement soient correctement configurées, afin que l'application fonctionne en développement et en production.

#### Acceptance Criteria

1. WHEN l'application démarre THEN le système SHALL valider la présence des variables d'environnement requises
2. WHEN les variables ProConnect sont manquantes THEN le système SHALL afficher une erreur explicite
3. WHEN les variables de base de données sont manquantes THEN le système SHALL afficher une erreur de connexion claire

### Requirement 6

**User Story:** En tant qu'utilisateur authentifié, je veux que ma session soit sécurisée, afin que mes données soient protégées.

#### Acceptance Criteria

1. WHEN un utilisateur se connecte THEN le système SHALL créer une session sécurisée avec expiration
2. WHEN la session expire THEN le système SHALL rediriger automatiquement vers la page de connexion
3. WHEN un utilisateur se déconnecte THEN le système SHALL invalider complètement la session

### Requirement 7

**User Story:** En tant que développeur, je veux que le système gère correctement les spécificités techniques de ProConnect, afin d'assurer une intégration robuste.

#### Acceptance Criteria

1. WHEN le système récupère les clés JWKS THEN il SHALL utiliser l'endpoint `/api/v2/jwks` (pas `/certs`)
2. WHEN le système appelle l'endpoint `/userinfo` THEN il SHALL gérer les réponses JWT et JSON automatiquement
3. WHEN un utilisateur existant se connecte avec ProConnect THEN le système SHALL lier automatiquement le compte OAuth
4. WHEN le système affiche des composants DSFR THEN il SHALL éviter les erreurs d'hydratation HTML
5. WHEN les informations `belonging_population` ne sont pas disponibles THEN le système SHALL utiliser `isPublicAgent = true` par défaut
6. WHEN le système configure les endpoints ProConnect THEN il SHALL utiliser l'issuer correct avec `/api/v2`
