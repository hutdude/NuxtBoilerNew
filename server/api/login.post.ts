import { z } from "zod";
import argon2 from "argon2";
import { getUserByEmail } from "../db/queries/users";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  const user = await getUserByEmail(email);
  if (!user) {
    throw createError({
      status: 401,
      message: "Bad credentials",
    });
  }

  const passwordValid = await argon2.verify(user.passwordHash, password);
  if (!passwordValid) {
    throw createError({
      status: 401,
      message: "Bad credentials",
    });
  }

  // set the user session in the cookie
  // this server util is auto-imported by the auth-utils module
  await setUserSession(event, {
    user: {
      name: user.name,
      ...(user.avatarUrl
        ? { avatar: { src: user.avatarUrl, alt: user.name } }
        : {}),
    },
  });

  await setStudioUserSession(event, {
    name: user.name,
    email: user.email,
    providerId: user.id,
    ...(user.avatarUrl ? { avatar: user.avatarUrl } : {}),
  });

  return {};
});
