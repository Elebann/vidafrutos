from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import History, Order, OrderDetail
from .request_user import get_current_user

TRACKED_ORDER_FIELDS = ('state', 'customer', 'date')
TRACKED_DETAIL_FIELDS = ('product', 'quantity', 'price')


def _format_value(field, value):
    if value is None:
        return ''
    if field == 'state':
        return str(getattr(value, 'state', value))
    if field == 'customer':
        return str(value)
    if field == 'product':
        return str(value)
    return str(value)


def record_history(order, user, affected_field, prev_value, new_value):
    History.objects.create(
        order=order,
        user=user,
        affected_field=affected_field,
        prev_value=prev_value,
        new_value=new_value,
    )


@receiver(pre_save, sender=Order)
def capture_previous_order(sender, instance, **kwargs):
    if not instance.pk:
        instance._history_previous = None
        return
    try:
        previous = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        instance._history_previous = None
        return
    snapshot = {field: getattr(previous, field) for field in TRACKED_ORDER_FIELDS}
    instance._history_previous = previous
    instance._history_snapshot = snapshot


@receiver(post_save, sender=Order)
def track_order_changes(sender, instance, created, **kwargs):
    if created:
        return
    previous = getattr(instance, '_history_previous', None)
    snapshot = getattr(instance, '_history_snapshot', None)
    if previous is None or snapshot is None:
        return
    user = get_current_user()
    if user is None:
        return
    for field in TRACKED_ORDER_FIELDS:
        old_value = snapshot.get(field)
        new_value = getattr(instance, field)
        if old_value != new_value:
            record_history(
                order=instance,
                user=user,
                affected_field=field,
                prev_value=_format_value(field, old_value),
                new_value=_format_value(field, new_value),
            )


@receiver(post_save, sender=OrderDetail)
def track_order_detail_changes(sender, instance, created, **kwargs):
    user = get_current_user()
    if user is None:
        return
    if created:
        record_history(
            order=instance.order,
            user=user,
            affected_field='detail.added',
            prev_value='',
            new_value=_format_value('product', instance.product),
        )
        return
    try:
        previous = OrderDetail.objects.get(pk=instance.pk)
    except OrderDetail.DoesNotExist:
        return
    snapshot = {field: getattr(previous, field) for field in TRACKED_DETAIL_FIELDS}
    for field in TRACKED_DETAIL_FIELDS:
        old_value = snapshot.get(field)
        new_value = getattr(instance, field)
        if old_value != new_value:
            record_history(
                order=instance.order,
                user=user,
                affected_field=f'detail.{field}',
                prev_value=_format_value(field, old_value),
                new_value=_format_value(field, new_value),
            )


@receiver(post_delete, sender=OrderDetail)
def track_order_detail_deletion(sender, instance, **kwargs):
    user = get_current_user()
    if user is None:
        return
    record_history(
        order=instance.order,
        user=user,
        affected_field='detail.removed',
        prev_value=_format_value('product', instance.product),
        new_value='',
    )
