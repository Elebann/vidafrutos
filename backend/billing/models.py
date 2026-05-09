from django.db import models
from django.utils import timezone


class Invoice(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Efectivo'),
        ('CREDIT_CARD', 'Tarjeta de Crédito'),
        ('DEBIT_CARD', 'Tarjeta de Débito'),
        ('TRANSFER', 'Transferencia'),
    ]

    #cada pedido tiene una sola factura, pero un pedido tiene multiples productos
    order = models.OneToOneField('orders.Order', on_delete=models.PROTECT)
    user = models.ForeignKey('accounts.User', on_delete=models.PROTECT)
    date = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method= models.CharField(choices=PAYMENT_METHOD_CHOICES, max_length=50)