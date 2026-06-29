from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer
from clients.models import Customer
from clients.serializers import CustomerSerializer
from products.models import Product
from products.serializers import ProductSerializer

from .models import DeliveryEvidence, History, Order, OrderDetail, OrderState

ALLOWED_EVIDENCE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "heic", "pdf"}
MAX_EVIDENCE_BYTES = 10485760 # 10 MB (10 * 1024 * 1024)


class OrderStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderState
        fields = ['id', 'state']
        read_only_fields = ['id']


class OrderStateWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderState
        fields = ['state']


class OrderDetailNestedSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderDetail
        fields = ['id', 'product', 'quantity', 'price']
        read_only_fields = ['id']


class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    state = OrderStateSerializer(read_only=True)
    details = OrderDetailNestedSerializer(source='orderdetail_set', many=True, read_only=True)
    date = serializers.DateField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'state', 'date', 'details']
        read_only_fields = ['id', 'date']


class OrderWriteSerializer(serializers.ModelSerializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    state = serializers.PrimaryKeyRelatedField(queryset=OrderState.objects.all())
    date = serializers.DateField(required=False)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'state', 'date']
        read_only_fields = ['id']


class OrderDetailSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderDetail
        fields = ['id', 'order', 'product', 'quantity', 'price']
        read_only_fields = ['id']


class OrderWithDetailsSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    state = OrderStateSerializer(read_only=True)
    details = OrderDetailNestedSerializer(source='orderdetail_set', many=True, read_only=True)
    date = serializers.DateField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'state', 'date', 'details']
        read_only_fields = ['id', 'date']


class OrderDetailWriteSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    # todo: validar que la cantidad no sea mayor al stock disponible del producto y que cantidad > 0

    class Meta:
        model = OrderDetail
        fields = ['id', 'order', 'product', 'quantity', 'price']
        read_only_fields = ['id']
        extra_kwargs = {
            'price': {'required': False, 'default': 0},
        }


class HistorySerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = History
        fields = ['id', 'order', 'user', 'change_date', 'affected_field', 'prev_value', 'new_value']
        read_only_fields = ['id', 'change_date']


class HistoryOrderSerializer(serializers.ModelSerializer):
    date = serializers.DateField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'date']
        read_only_fields = fields


class HistoryListSerializer(serializers.ModelSerializer):
    order = HistoryOrderSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = History
        fields = ['id', 'order', 'user', 'change_date', 'affected_field', 'prev_value', 'new_value']
        read_only_fields = fields


class HistoryWriteSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = History
        fields = ['id', 'order', 'user', 'affected_field', 'prev_value', 'new_value']
        read_only_fields = ['id']


class DeliveryEvidenceSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryEvidence
        fields = [
            'id',
            'order_id',
            'public_id',
            'extension',
            'bytes',
            'uploaded_by',
            'uploaded_at',
            'is_archived',
            'url',
            'evidence_type'
        ]
        read_only_fields = fields

    def get_url(self, obj: DeliveryEvidence) -> str:
        request = self.context.get('request')
        cloud_name = request and getattr(request, 'cloud_name', None)
        if not cloud_name:
            from django.conf import settings
            cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
        if not cloud_name:
            return ''
        return f"https://res.cloudinary.com/{cloud_name}/image/upload/{obj.public_id}.{obj.extension}"


class DeliveryEvidenceWriteSerializer(serializers.Serializer):
    public_id = serializers.CharField(max_length=500)
    extension = serializers.CharField(max_length=10)
    bytes = serializers.IntegerField(min_value=1)
    evidence_type = serializers.IntegerField()

    def validate_extension(self, value: str) -> str:
        normalized = value.lower().lstrip('.')
        if normalized not in ALLOWED_EVIDENCE_EXTENSIONS:
            raise serializers.ValidationError(
                f"Extensión no permitida. Permitidas: {', '.join(sorted(ALLOWED_EVIDENCE_EXTENSIONS))}."
            )
        return normalized

    def validate_bytes(self, value: int) -> int:
        if value > MAX_EVIDENCE_BYTES:
            raise serializers.ValidationError(
                f"El archivo excede el tamaño máximo permitido de {MAX_EVIDENCE_BYTES // (1024 * 1024)} MB."
            )
        return value
