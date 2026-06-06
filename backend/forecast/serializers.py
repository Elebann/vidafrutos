from rest_framework import serializers


class ProductionPlanRowSerializer(serializers.Serializer):
    date = serializers.CharField()
    expectedSales = serializers.IntegerField()
    suggestedProduction = serializers.IntegerField()
    confidence = serializers.FloatField()
    risk = serializers.CharField()


class ForecastSerializer(serializers.Serializer):
    productId = serializers.IntegerField()
    productName = serializers.CharField(allow_blank=True)
    expectedSales = serializers.IntegerField()
    suggestedProduction = serializers.IntegerField()
    confidence = serializers.FloatField()
    risk = serializers.CharField()
    availableStock = serializers.IntegerField()
    allocatedStock = serializers.IntegerField()
    minimumStock = serializers.IntegerField()
    productionPlan = serializers.ListField(child=ProductionPlanRowSerializer(), required=False)


class ForecastMetricSerializer(serializers.Serializer):
    class_name = serializers.CharField(source="class")
    accuracy = serializers.FloatField()
    recall = serializers.FloatField()
    precision = serializers.FloatField()
    f1_score = serializers.FloatField()
    support = serializers.IntegerField()


class ForecastStatusSerializer(serializers.Serializer):
    trained = serializers.BooleanField()
    last_trained_at = serializers.FloatField(allow_null=True)
    last_trained_iso = serializers.CharField(allow_null=True, allow_blank=True)
    n_rows = serializers.IntegerField()
    n_products = serializers.IntegerField()
    n_estimators = serializers.IntegerField()
    max_depth = serializers.IntegerField()
    test_mae = serializers.FloatField()
    test_r2 = serializers.FloatField()
    test_mape = serializers.FloatField()
    lookback_days = serializers.IntegerField()
    top_features = serializers.ListField(child=serializers.DictField())
    classification_metrics = serializers.ListField(child=ForecastMetricSerializer(), required=False)


class ConfusionMatrixSerializer(serializers.Serializer):
    labels = serializers.ListField(child=serializers.CharField())
    edges = serializers.ListField(child=serializers.FloatField(), required=False)
    matrix = serializers.ListField(child=serializers.ListField(child=serializers.IntegerField()))


class ConfidenceRowSerializer(serializers.Serializer):
    date = serializers.CharField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField(allow_blank=True)
    actual = serializers.IntegerField()
    predicted = serializers.IntegerField()
    lower = serializers.IntegerField()
    upper = serializers.IntegerField()
    confidence = serializers.FloatField()
    actual_class = serializers.CharField()
    predicted_class = serializers.CharField()
    inside_interval = serializers.BooleanField()


class ForecastDiagnosticsSerializer(serializers.Serializer):
    summary = ForecastStatusSerializer()
    confusion_matrix = ConfusionMatrixSerializer()
    confidence_table = serializers.ListField(child=ConfidenceRowSerializer())
    message = serializers.CharField(required=False, allow_blank=True)
