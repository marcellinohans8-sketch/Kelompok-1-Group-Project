const localUrl = "http://localhost:3015";
const productionUrl = "https://marcellino10.online";
const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const baseUrl =
  import.meta.env.VITE_API_URL || (isLocalBrowser ? localUrl : productionUrl);
export default baseUrl;
