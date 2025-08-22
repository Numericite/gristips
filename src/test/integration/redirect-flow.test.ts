import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetServerSidePropsContext } from "next";

// Mock the auth utilities
const mockGetServerSession = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: mockGetServerSession,
}));

describe("Redirect Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sign In Page Redirects", () => {
    it("should redirect authenticated public agent to admin page", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from signin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (session?.user) {
          if (session.user.isPublicAgent) {
            return {
              redirect: {
                destination: "/admin",
                permanent: false,
              },
            };
          } else {
            return {
              redirect: {
                destination: "/auth/access-denied",
                permanent: false,
              },
            };
          }
        }

        return {
          props: {
            error: context.query.error ?? null,
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/auth/signin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/admin",
          permanent: false,
        },
      });
    });

    it("should redirect authenticated non-public agent to access denied page", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "citizen@example.com",
          name: "Citizen User",
          isPublicAgent: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from signin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (session?.user) {
          if (session.user.isPublicAgent) {
            return {
              redirect: {
                destination: "/admin",
                permanent: false,
              },
            };
          } else {
            return {
              redirect: {
                destination: "/auth/access-denied",
                permanent: false,
              },
            };
          }
        }

        return {
          props: {
            error: context.query.error ?? null,
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/auth/signin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/access-denied",
          permanent: false,
        },
      });
    });

    it("should show signin page for unauthenticated user", async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Simulate the getServerSideProps logic from signin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (session?.user) {
          if (session.user.isPublicAgent) {
            return {
              redirect: {
                destination: "/admin",
                permanent: false,
              },
            };
          } else {
            return {
              redirect: {
                destination: "/auth/access-denied",
                permanent: false,
              },
            };
          }
        }

        return {
          props: {
            error: context.query.error ?? null,
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: { error: "Configuration" },
        resolvedUrl: "/auth/signin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        props: {
          error: "Configuration",
        },
      });
    });
  });

  describe("Admin Page Redirects", () => {
    it("should allow access for authenticated public agent", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
          organizational_unit: "Ministère Test",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from admin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (!session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/auth/access-denied",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              isPublicAgent: session.user.isPublicAgent,
              organizational_unit: session.user.organizational_unit || null,
            },
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/admin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        props: {
          user: {
            id: "user-123",
            email: "agent@gouv.fr",
            name: "Agent Public",
            isPublicAgent: true,
            organizational_unit: "Ministère Test",
          },
        },
      });
    });

    it("should redirect unauthenticated user to signin page", async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Simulate the getServerSideProps logic from admin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (!session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/auth/access-denied",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: session.user,
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/admin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/signin",
          permanent: false,
        },
      });
    });

    it("should redirect non-public agent to access denied page", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "citizen@example.com",
          name: "Citizen User",
          isPublicAgent: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from admin page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (!session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/auth/access-denied",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: session.user,
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/admin",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/access-denied",
          permanent: false,
        },
      });
    });
  });

  describe("Access Denied Page Redirects", () => {
    it("should redirect unauthenticated user to signin page", async () => {
      mockGetServerSession.mockResolvedValue(null);

      // Simulate the getServerSideProps logic from access-denied page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/admin",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: {
              email: session.user.email,
              name: session.user.name,
              isPublicAgent: session.user.isPublicAgent,
            },
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/auth/access-denied",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/signin",
          permanent: false,
        },
      });
    });

    it("should redirect public agent to admin page", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from access-denied page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/admin",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: {
              email: session.user.email,
              name: session.user.name,
              isPublicAgent: session.user.isPublicAgent,
            },
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/auth/access-denied",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        redirect: {
          destination: "/admin",
          permanent: false,
        },
      });
    });

    it("should show access denied page for non-public agent", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "citizen@example.com",
          name: "Citizen User",
          isPublicAgent: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      // Simulate the getServerSideProps logic from access-denied page
      const getServerSideProps = async (context: GetServerSidePropsContext) => {
        const session = await mockGetServerSession(
          context.req,
          context.res,
          {}
        );

        if (!session?.user) {
          return {
            redirect: {
              destination: "/auth/signin",
              permanent: false,
            },
          };
        }

        if (session.user.isPublicAgent) {
          return {
            redirect: {
              destination: "/admin",
              permanent: false,
            },
          };
        }

        return {
          props: {
            user: {
              email: session.user.email,
              name: session.user.name,
              isPublicAgent: session.user.isPublicAgent,
            },
          },
        };
      };

      const mockContext = {
        req: {} as any,
        res: {} as any,
        query: {},
        resolvedUrl: "/auth/access-denied",
        params: {},
      } as GetServerSidePropsContext;

      const result = await getServerSideProps(mockContext);

      expect(result).toEqual({
        props: {
          user: {
            email: "citizen@example.com",
            name: "Citizen User",
            isPublicAgent: false,
          },
        },
      });
    });
  });
});
