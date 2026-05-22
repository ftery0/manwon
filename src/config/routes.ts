export const ROUTES = {
  HOME: "/",
  MAP: "/map",
  ROUTE: "/route",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
