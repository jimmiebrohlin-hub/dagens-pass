export const APP_BASE_URL = "https://vardagsstyrka.lovable.app";

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

export function buildJoinUrl(inviteCode: string) {
  const code = encodeURIComponent(normalizeInviteCode(inviteCode));
  return `${APP_BASE_URL}/join/${code}`;
}

export function rememberPendingInvite(inviteCode: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem("pending_invite_code", normalizeInviteCode(inviteCode));
}

export function clearPendingInvite() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem("pending_invite_code");
}
