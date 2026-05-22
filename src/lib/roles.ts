/** Stored account roles */
export type AccountRole = "admin" | "co-admin" | "user";

/** Effective platform role (computed) */
export type EffectiveRole = "admin" | "co-admin" | "editor" | "writer";

export interface RoleUser {
  role: AccountRole;
}

export function isAdminRole(role: AccountRole | undefined): boolean {
  return role === "admin" || role === "co-admin";
}

export function getEffectiveRole(
  user: RoleUser | null
): EffectiveRole {
  if (!user) return "writer";
  if (user.role === "admin") return "admin";
  if (user.role === "co-admin") return "co-admin";
  return "editor";
}

export function canDirectPublish(role: AccountRole | EffectiveRole | undefined): boolean {
  return role === "admin" || role === "co-admin";
}

export function canCreateMagazines(role: EffectiveRole | undefined): boolean {
  return role === "editor" || role === "admin" || role === "co-admin";
}

export function canSubmitForApproval(role: EffectiveRole | undefined): boolean {
  return role === "editor";
}

export function roleDisplayName(role: EffectiveRole | AccountRole): string {
  switch (role) {
    case "co-admin":
      return "Co-Admin";
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "writer":
      return "Writer";
    default:
      return "User";
  }
}
