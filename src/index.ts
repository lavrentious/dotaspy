import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/heroes/:slug": (req) => {
      const file = Bun.file(`./public/heroes/${req.params.slug}`);
      return new Response(file);
    },

    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
