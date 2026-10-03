import type { Role } from "@/constants/app";

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserBody {
  name?: string;
  email?: string;
  isActive?: boolean;
}

export interface ChangeRoleVars {
  id: string;
  role: Role;
}
