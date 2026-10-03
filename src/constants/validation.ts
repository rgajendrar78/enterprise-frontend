/** Mirrors the API's field rules. Change here and in the API together, or forms lie to users. */
export const VALIDATION = {
  EMAIL_MAX: 180,
  NAME_MIN: 2,
  NAME_MAX: 120,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
  SEARCH_MAX: 120,
} as const;

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const PASSWORD_MESSAGE = `Password must be ${VALIDATION.PASSWORD_MIN}-${VALIDATION.PASSWORD_MAX} characters and contain a letter and a number`;
