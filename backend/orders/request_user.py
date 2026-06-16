from contextvars import ContextVar

_current_user: ContextVar = ContextVar("current_user", default=None)


def get_current_user():
    return _current_user.get()


def set_current_user(user):
    return _current_user.set(user)


def reset_current_user(token):
    _current_user.reset(token)


class HistoryTrackingMixin:
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            self._history_token = set_current_user(user)
        else:
            self._history_token = None

    def finalize_response(self, request, response, *args, **kwargs):
        if getattr(self, "_history_token", None) is not None:
            reset_current_user(self._history_token)
            self._history_token = None
        return super().finalize_response(request, response, *args, **kwargs)
