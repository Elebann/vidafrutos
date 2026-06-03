from django.contrib import admin

from orders.models import DeliveryEvidence, History, Order, OrderDetail, OrderState

# Register your models here.
admin.site.register([
    History,
    Order,
    OrderDetail,
    OrderState,
])


@admin.register(DeliveryEvidence)
class DeliveryEvidenceAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'public_id', 'extension', 'bytes', 'uploaded_by', 'uploaded_at', 'is_archived')
    list_filter = ('extension', 'is_archived')
    search_fields = ('public_id', 'order__id')
    readonly_fields = ('order', 'public_id', 'extension', 'bytes', 'uploaded_by', 'uploaded_at')
    list_select_related = ('order', 'uploaded_by')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False