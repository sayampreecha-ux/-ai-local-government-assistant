import { randomBytes } from "node:crypto";

for (const name of ["SESSION_SECRET", "ADMIN_SESSION_SECRET", "IP_HASH_SECRET"]) {
  console.log(`${name}=${randomBytes(32).toString("hex")}`);
}
