import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/heroes/:slug": (req) => new Response(Bun.file(`./public/heroes/${req.params.slug}`)),
    "/icons/:slug": (req) => new Response(Bun.file(`./public/icons/${req.params.slug}`)),

    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
