import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isPublicAgent: boolean;
      organizational_unit?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    given_name: string;
    usual_name: string;
    organizational_unit?: string;
    belonging_population: string[];
    isPublicAgent: boolean;
  }

  interface Profile {
    sub: string;
    email: string;
    given_name: string;
    usual_name: string;
    organizational_unit?: string;
    belonging_population: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPublicAgent: boolean;
    organizational_unit?: string;
    belonging_population: string[];
    given_name: string;
    usual_name: string;
  }
}
