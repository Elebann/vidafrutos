from django.db import models
from django.utils import timezone

class OrderState(models.Model):
    state = models.CharField(max_length=50)

    def __str__(self):
        return self.state

class Order(models.Model):
    customer = models.ForeignKey('clients.Customer', on_delete=models.PROTECT)
    state = models.ForeignKey(OrderState, on_delete=models.PROTECT)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Pedido #{self.id} - {self.customer}"

class OrderDetail(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.IntegerField(default=0)

    def __str__(self):
        return f"#{self.order_id} - {self.product.name} x{self.quantity}"

class History(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='history')
    change_date = models.DateTimeField(auto_now_add=True)
    affected_field = models.CharField(max_length=100)
    prev_value = models.TextField()
    new_value = models.TextField()

    def __str__(self):
        return f"Pedido #{self.order_id} - {self.affected_field}"


class DeliveryEvidence(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='evidence')
    public_id = models.CharField(max_length=500)
    extension = models.CharField(max_length=10)
    bytes = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='uploaded_evidence')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_archived = models.BooleanField(default=False)
    evidence_type = models.IntegerField(null=True) # 1: Entrega - 2: Confirmación de pago

    def __str__(self):
        return f"Evidencia #{self.order_id} - {self.public_id}"