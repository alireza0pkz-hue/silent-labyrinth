export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const protectedPaths = [
    "/admin.html",
    "/api/admin/customers",
    "/api/admin/customer-create",
    "/api/admin/customer-delete"
  ];

  const needsAuth = protectedPaths.some(p => path === p);

  if (!needsAuth) {
    return next();
  }

  const username = env.ADMIN_USER || "admin";
  const password = env.ADMIN_PASS || "123456";

  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authHeader.replace("Basic ", "");
  const decoded = atob(encoded);
  const [user, pass] = decoded.split(":");

  if (user !== username || pass !== password) {
    return unauthorized();
  }

  return next();
}

function unauthorized() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Login"',
    },
  });
}
