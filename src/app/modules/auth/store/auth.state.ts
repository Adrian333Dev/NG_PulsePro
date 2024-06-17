import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';

import { IUser } from '@app/shared/models';

export interface IAuthState {
  initialized: boolean;
  isGuest: boolean;
  user?: IUser;
}

export class AuthStateActionSetUser {
  static readonly type = '[Auth] Set User';
  constructor(public user?: IUser) {}
}

export class AuthStateActionLogout {
  static readonly type = '[Auth] Logout';
}

@State<IAuthState>({
  name: 'auth',
  defaults: {
    initialized: false,
    user: undefined,
    isGuest: true,
  },
})
@Injectable()
export class AuthState {
  @Action(AuthStateActionSetUser)
  setUser(ctx: StateContext<IAuthState>, { user }: AuthStateActionSetUser) {
    const state = ctx.getState();
    const validUser = !!user?.userId;

    ctx.setState({
      ...state,
      user: validUser ? user : undefined,
      isGuest: !validUser,
      initialized: true,
    });
  }

  @Action(AuthStateActionLogout)
  logout(ctx: StateContext<IAuthState>) {
    ctx.setState({
      user: undefined,
      isGuest: true,
      initialized: true,
    });
  }
}
