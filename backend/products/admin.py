from django.contrib import admin

from products.models import Category, PackagedStock, RawStock, Product

# Register your models here.
admin.site.register([
    Category,
    PackagedStock,
    Product,
    RawStock
])