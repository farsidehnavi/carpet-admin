# Catalog admin (Next.js)

Manage products (English + Farsi name/description, optional price, photos) using the same backend API the Telegram bot used.

## Run

```bash
cp .env.example .env.local     # then edit it: password, secret, API addresses
npm install
npm run build && npm run start      # http://localhost:3100  (change with PORT=4000 npm start)
```

`npm run dev` for development.

## Notes
- The browser only talks to this site. This site's server talks to your API and image server, so no CORS setup is needed.
- Put it behind https (nginx/Caddy) when it is on the internet.
- Backend needs: `GET /product/all`, `POST /product/add` (create/update), `DELETE /product/delete/:id`,
  `POST /product/img/`, `DELETE /product/img/:id/:file`, `DELETE /img/delete/:file`, `POST <image server>/upload/`,
  and the product fields `name_fa` and `description_fa` (names are configurable in `.env.local`).
# carpet-admin
