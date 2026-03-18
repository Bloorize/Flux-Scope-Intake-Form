import { currentUser } from "@clerk/nextjs/server";

const parseCsv = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const getCurrentUserEmail = async () => {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
};

export const isSuperAdminUser = async (userId: string | null) => {
  if (!userId) {
    return false;
  }

  const adminIds = parseCsv(process.env.SUPER_ADMIN_USER_IDS);
  if (adminIds.includes(userId.toLowerCase())) {
    return true;
  }

  const adminEmails = parseCsv(process.env.SUPER_ADMIN_EMAILS);
  if (adminEmails.length === 0) {
    return false;
  }

  const email = await getCurrentUserEmail();
  return email ? adminEmails.includes(email) : false;
};
