from django.db import models

class RawStockMovement(models.Model):
    MOVEMENT_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'), # o Consumo
        ('AJUSTE', 'Ajuste'),
        ('MERMA', 'Merma')
    ]

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='raw_movements'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
    )
    movement_type = models.CharField(
        max_length=50,
        choices=MOVEMENT_CHOICES
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        help_text="Cantidad en kilos"
    )
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.movement_type} - {self.product} ({self.quantity} kg)"