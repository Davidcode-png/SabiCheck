/** Cookie names shared by the client session store and the route proxy. */
export const ACCESS_TOKEN_COOKIE = "sabicheck_access";
export const REFRESH_TOKEN_COOKIE = "sabicheck_refresh";

/** Mirrors the backend refresh-token lifetime (5 days). */
export const REFRESH_TOKEN_MAX_AGE = 5 * 24 * 60 * 60;

/** Fired when a refresh attempt fails and the session is cleared. */
export const SESSION_EXPIRED_EVENT = "sabicheck:session-expired";
