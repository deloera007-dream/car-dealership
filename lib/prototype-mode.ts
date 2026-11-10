export const prototypeMode = process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

export function isMarketplaceRoute(pathname: string) {
  return (
    /^\/cars(?:\/[^/]+)?$/.test(pathname) ||
    ["/sell", "/value", "/loans", "/account"].includes(pathname)
  );
}

export function isPrototypeRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/cars" ||
    /^\/cars\/demo-[a-z0-9-]+$/.test(pathname) ||
    ["/sell", "/value", "/loans", "/account"].includes(pathname)
  );
}
