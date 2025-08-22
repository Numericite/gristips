# Implementation Plan

- [x] 1. Extend database schema for automation management

  - Add gristApiKey and gristApiKeyHash fields to User model
  - Create Automation model with all required fields and relationships
  - Generate and apply Prisma migration
  - _Requirements: 1.3, 6.1, 6.2, 6.3_

- [x] 2. Implement Grist API client service

  - Create GristApiClient class with HTTP client configuration
  - Implement validateApiKey method with proper error handling
  - Implement getDocuments method to fetch user's Grist documents
  - Implement getTables method to fetch tables for a document
  - Implement getTableSchema method to fetch column information
  - Add proper TypeScript interfaces for Grist API responses
  - _Requirements: 1.2, 2.2, 2.3, 2.4, 5.1, 5.2_

- [x] 3. Create API key management backend endpoints

  - Implement GET /api/admin/grist-api-key endpoint to check if user has API key
  - Implement POST /api/admin/grist-api-key endpoint to save and validate API key
  - Add API key encryption/decryption utilities
  - Add proper error handling and validation
  - Write unit tests for API key endpoints
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.3_

- [x] 4. Create Grist data fetching API endpoints

  - Implement GET /api/admin/grist/documents endpoint
  - Implement GET /api/admin/grist/tables endpoint with document parameter
  - Add proper authentication and session validation
  - Add error handling for Grist API failures
  - Write unit tests for Grist data endpoints
  - _Requirements: 2.2, 2.3, 2.4, 5.1, 5.2_

- [x] 5. Implement automation CRUD API endpoints

  - Create GET /api/admin/automations endpoint to list user's automations
  - Create POST /api/admin/automations endpoint to create new automation
  - Create PUT /api/admin/automations/[id] endpoint to update automation
  - Create DELETE /api/admin/automations/[id] endpoint to delete automation
  - Add validation for automation configuration data
  - Write unit tests for automation CRUD operations
  - _Requirements: 2.7, 4.1, 4.4, 4.5, 5.3, 5.4, 5.5, 6.4_

- [x] 6. Create API key configuration component

  - Build GristApiKeyConfig React component with DSFR styling
  - Implement API key input form with secure handling
  - Add API key validation with loading states and error messages
  - Integrate with backend API key endpoints
  - Add proper form validation and user feedback
  - Write unit tests for API key configuration component
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Build automation creation form component

  - Create AutomationCreationForm component with multi-step form
  - Implement document selection dropdown with dynamic loading
  - Implement table selection dropdown based on selected document
  - Create column selection interface with checkboxes and default selection
  - Add form validation and error handling
  - Write unit tests for automation creation form
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4_

- [x] 8. Create automation management list component

  - Build AutomationList component to display user's automations
  - Implement automation item display with source/target information
  - Add edit, delete, and status toggle actions
  - Implement confirmation dialogs for destructive actions
  - Add proper loading states and error handling
  - Write unit tests for automation list component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Integrate automation management into admin interface

  - Add navigation items for automation management in admin layout
  - Create main automation management page combining all components
  - Implement routing between API key setup and automation management
  - Add conditional rendering based on API key configuration status
  - Ensure proper authentication and public agent verification
  - _Requirements: 1.1, 1.5, 2.1_

- [x] 10. Add comprehensive validation and error handling

  - Implement client-side validation for all forms
  - Add server-side validation for all API endpoints
  - Create user-friendly error messages for common failure scenarios
  - Add proper handling for Grist API rate limits and network errors
  - Implement validation warnings for column type mismatches
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Write integration tests for complete automation workflow

  - Create integration tests for API key setup flow
  - Test complete automation creation workflow from start to finish
  - Test automation management operations (edit, delete, status toggle)
  - Test error scenarios and recovery flows
  - Test authentication and authorization for all endpoints
  - _Requirements: All requirements validation_

- [ ] 12. Add security measures and audit logging
  - Implement proper API key encryption in database
  - Add audit logging for API key changes and automation operations
  - Ensure proper session validation on all endpoints
  - Add CSRF protection for state-changing operations
  - Verify user isolation for all automation data access
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
