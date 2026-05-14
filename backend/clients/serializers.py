from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__' # el rut quizá no sea tan necesario, además para proteger la información personal, de acuerdo a algunas leyes
        