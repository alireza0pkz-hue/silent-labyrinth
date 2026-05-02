function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Panel"'
    }
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const protectedPaths = ["/admin.html", "/api/admin/"];

  const needsAuth = protectedPaths.some((path) => url.pathname.startsWith(path));

  if (!needsAuth) {
    return next();
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authHeader.split(" ")[1];
  const decoded = atob(encoded);
  const [username, password] = decoded.split(":");

  if (
    username !== env.ADMIN_USER ||
    password !== env.ADMIN_PASS
  ) {
    return unauthorized();
  }

  return next();
}
