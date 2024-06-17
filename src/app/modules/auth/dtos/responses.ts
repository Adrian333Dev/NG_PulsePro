export interface ISignUpInput {}

export interface ISignUpRes {}

export interface ISignInInput {}

export interface ISignInRes {
  accessToken: string;
  refreshToken: string;
}
