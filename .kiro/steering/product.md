# Product Overview

Gristips is a French government automation platform for Grist documents, exclusively for public service agents. The application provides advanced automation capabilities like periodic synchronization between documents, automatic table copying with custom rules, and workflow management.

## Key Features

- **ProConnect Authentication**: Secure authentication via the French State's authentication service
- **DSFR Interface**: User interface compliant with the French State Design System
- **Public Agent Management**: Automatic verification of public agent status
- **Grist Automations**: Automation tools for Grist documents (upcoming)
- **Custom Workflows**: Configuration of complex workflows (upcoming)

## Target Users

- French public service agents only
- Authenticated via ProConnect (ex-AgentConnect)
- Must have verified public agent status (`belonging_population` includes "agent")

## Security Requirements

- HTTPS mandatory in production
- ProConnect OAuth2/OpenID Connect integration
- JWT token verification with jose library
- Session management with automatic expiration
- Public agent status verification for all protected resources
