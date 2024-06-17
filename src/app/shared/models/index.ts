export enum UserRole {
  ADMIN,
  HR_MANAGER,
  DEPARTMENT_MANAGER,
  EMPLOYEE,
}

export interface IUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  org: IOrg;
}

export interface IOrg {
  orgId: number;
  name: string;
  employees: IUser[];
}
