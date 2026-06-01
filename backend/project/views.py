from django.http import JsonResponse
from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver


def _extract_urls(patterns, prefix=""):
    """Recursively extract URL pattern strings and names.

    Returns a list of dicts with keys: path, name.
    """
    out = []
    for p in patterns:
        if isinstance(p, URLPattern):
            out.append({
                "path": prefix + str(p.pattern),
                "name": p.name,
            })
        elif isinstance(p, URLResolver):
            new_prefix = prefix + str(p.pattern)
            out.extend(_extract_urls(p.url_patterns, new_prefix))
    return out


def api_index(request):
    """Return a JSON list of registered endpoints under 'api/'.

    This inspects the project's URL resolver and returns all routes whose
    path starts with 'api/'. It is a simple discovery endpoint for developers
    to see which API endpoints are registered.
    """
    resolver = get_resolver()
    all_patterns = _extract_urls(resolver.url_patterns)

    # Keep only the API routes (those that start with 'api/')
    api_routes = [p for p in all_patterns if p["path"].startswith("api/")]

    return JsonResponse({"endpoints": api_routes})
