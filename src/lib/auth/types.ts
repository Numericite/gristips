// Authentication-related types

export interface AuthenticatedPageProps {
  session: {
    user: {
      id: string;
      email: string;
      name: string;
      isPublicAgent: boolean;
      organizational_unit?: string;
    };
  };
}

export interface SessionValidationResult {
  valid: boolean;
  session: {
    user: {
      id: string;
      email: string;
      name: string;
      isPublicAgent: boolean;
      organizational_unit?: string;
    };
    expires: string;
  } | null;
  reason: string | null;
  warning?: string;
}

export interface ProConnectUserInfo {
  sub: string;
  email: string;
  given_name: string;
  usual_name: string;
  organizational_unit?: string;
  belonging_population: string[];
}

export interface ProConnectProfile {
  sub: string;
  email: string;
  given_name: string;
  usual_name: string;
  organizational_unit?: string;
  belonging_population?: string[] | string;
}
