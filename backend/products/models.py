from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class RawStock(models.Model):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='raw_stock'
    )
    quantity_kilogram = models.DecimalField(max_digits=10, decimal_places=3)

    def __str__(self):
        return self.product.name

class PackagedStock(models.Model):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='packaged_stock'
    )
    available_stock = models.IntegerField()
    allocated_stock = models.IntegerField() # allocated = reservado
    minimum_stock = models.IntegerField()

    def __str__(self):
        return self.product.name