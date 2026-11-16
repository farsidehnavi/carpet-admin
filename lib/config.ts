import "server-only";

/** Settings from .env.local (read when needed, so a missing value never breaks the build). */
export const config = {
  get apiUrl() {
    return (process.env.API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  },
  get imageServerUrl() {
    const url = process.env.IMAGE_SERVER_URL ?? "http://localhost:3001/";
    return url.endsWith("/") ? url : `${url}/`;
  },
  /** Backend field names for the Farsi name / description. */
  get nameFaField() {
    return process.env.NAME_FA_FIELD || "name_fa";
  },
  get descriptionFaField() {
    return process.env.DESCRIPTION_FA_FIELD || "description_fa";
  },
  get parentId() {
    return process.env.PRODUCT_PARENT_ID?.trim() || null;
  },
  get adminPassword() {
    return process.env.ADMIN_PASSWORD ?? "";
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET ?? "";
  },
};
