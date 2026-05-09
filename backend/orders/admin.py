from django.contrib import admin

from orders.models import History, Order, OrderDetail, OrderState

# Register your models here.
admin.site.register([
    History,
    Order,
    OrderDetail,
    OrderState
])