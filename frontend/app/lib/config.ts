// Single source of truth for the API base URL. Previously every page read
// process.env.NEXT_PUBLIC_API_BASE_URL directly, which meant a typo'd env
// var name would silently break one page while the rest kept working.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
