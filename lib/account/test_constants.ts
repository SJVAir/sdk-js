import { assertTestVariable } from "../testing.ts";

export const loginCredentials = {
  identifier: assertTestVariable("LOGIN_ID"),
  password: assertTestVariable("LOGIN_PASS"),
};
