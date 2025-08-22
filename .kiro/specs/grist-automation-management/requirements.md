# Requirements Document

## Introduction

This feature enables authenticated public agents to create and manage Grist document automations through the administration interface. The primary automation type is table copying between Grist documents, allowing users to configure source documents, target documents, column selection, and automation parameters. The system requires users to configure their Grist API key to access their documents and create automations that will be stored in the database for future execution by external automation services.

## Requirements

### Requirement 1

**User Story:** As a public agent, I want to configure my Grist API key in my account settings, so that I can access my Grist documents and create automations.

#### Acceptance Criteria

1. WHEN a user accesses the administration interface THEN the system SHALL display an API key configuration section
2. WHEN a user enters their Grist API key THEN the system SHALL validate the key by making a test API call to Grist
3. WHEN the API key is valid THEN the system SHALL store it securely in the user's profile
4. WHEN the API key is invalid THEN the system SHALL display an error message and prevent saving
5. IF a user has not configured an API key THEN the system SHALL prevent access to automation creation features

### Requirement 2

**User Story:** As a public agent with a configured API key, I want to create a new table copy automation, so that I can automatically synchronize data between my Grist documents.

#### Acceptance Criteria

1. WHEN a user clicks "Create New Automation" THEN the system SHALL display an automation creation form
2. WHEN the form loads THEN the system SHALL fetch and display available Grist documents using the user's API key
3. WHEN a user selects a source document THEN the system SHALL fetch and display available tables in that document
4. WHEN a user selects a source table THEN the system SHALL fetch and display available columns in that table
5. WHEN a user selects a target document THEN the system SHALL fetch and display available tables in that document
6. WHEN a user selects a target table THEN the system SHALL validate that the target table structure is compatible
7. WHEN a user submits the automation configuration THEN the system SHALL save the automation metadata to the database

### Requirement 3

**User Story:** As a public agent, I want to configure which columns to copy in my table automation, so that I can control exactly what data is synchronized.

#### Acceptance Criteria

1. WHEN a source table is selected THEN the system SHALL display all available columns with checkboxes
2. WHEN the form loads THEN the system SHALL select all columns by default
3. WHEN a user unchecks a column THEN the system SHALL exclude it from the automation configuration
4. WHEN a user selects columns THEN the system SHALL validate that at least one column is selected
5. WHEN incompatible column types exist THEN the system SHALL display warnings to the user

### Requirement 4

**User Story:** As a public agent, I want to view and manage my existing automations, so that I can monitor and modify my configured synchronizations.

#### Acceptance Criteria

1. WHEN a user accesses the automation management page THEN the system SHALL display a list of their existing automations
2. WHEN displaying automations THEN the system SHALL show source document, source table, target document, target table, and status
3. WHEN a user clicks on an automation THEN the system SHALL display detailed configuration information
4. WHEN a user clicks "Edit" on an automation THEN the system SHALL allow modification of the automation configuration
5. WHEN a user clicks "Delete" on an automation THEN the system SHALL prompt for confirmation and remove the automation from the database

### Requirement 5

**User Story:** As a public agent, I want the system to validate my automation configuration, so that I can ensure my automations will work correctly when executed.

#### Acceptance Criteria

1. WHEN a user configures an automation THEN the system SHALL validate that source and target documents are accessible
2. WHEN a user selects tables THEN the system SHALL validate that both source and target tables exist
3. WHEN a user selects columns THEN the system SHALL validate that selected columns exist in the source table
4. WHEN column types are incompatible THEN the system SHALL display warnings but allow the configuration
5. IF any validation fails THEN the system SHALL prevent saving the automation and display specific error messages

### Requirement 6

**User Story:** As a public agent, I want my automation configurations to be stored securely, so that external automation services can execute them reliably.

#### Acceptance Criteria

1. WHEN an automation is saved THEN the system SHALL store all configuration metadata in the database
2. WHEN storing automations THEN the system SHALL associate them with the authenticated user
3. WHEN storing API keys THEN the system SHALL encrypt sensitive information
4. WHEN automation data is retrieved THEN the system SHALL ensure users can only access their own automations
5. WHEN the database schema is designed THEN it SHALL support future automation types beyond table copying
