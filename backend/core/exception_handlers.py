import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    # Let DRF handle exceptions it already knows about cleanly
    # (validation errors, permission errors, etc.) -- we only step in
    # for the ones DRF would otherwise crash on.
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # This is an unexpected error -- log the full details server-side
    # for debugging, but never expose them to the client.
    view_name = context.get('view', 'unknown_view')
    logger.exception(f"Unhandled exception in {view_name}: {exc}")

    return Response(
        {"error": "Something went wrong on our end. Please try again in a moment."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )