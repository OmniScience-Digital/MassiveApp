export const baseUrlLocal = "http://localhost:5001/api/v1";

export const securebaseUrltest =
  "https://p7t7et21s5.execute-api.us-east-2.amazonaws.com/api/v1";

export const securebaseUrlprod =
  "https://unb298qh1g.execute-api.us-east-2.amazonaws.com/api/v1";

export const getBaseUrl = () => {
  if (typeof window === "undefined") return securebaseUrlprod;

  const hostname = window.location.hostname;

  if (hostname === "localhost") return baseUrlLocal;

  if (hostname.includes("test")) return securebaseUrltest;

  // MAIN / PROD fallback
  return securebaseUrlprod;
};

//fetch(`${getBaseUrl()}/telegramshiftroute`, ...)