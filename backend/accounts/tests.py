from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User, Rol

class AccountsAPITest(APITestCase):
    def setUp(self):
        self.rol = Rol.objects.create(name='Test')
        self.user = User.objects.create_user(username='testuser', password='testpass', rut='44.444.444-4', rol=self.rol)
        self.client.force_authenticate(user=self.user)

    def test_list_roles(self):
        url = reverse('role-list')
        response = self.client.get(url)
        self.assertIn(response.status_code, (200, 204))

    def test_list_users(self):
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertIn(response.status_code, (200, 204))
