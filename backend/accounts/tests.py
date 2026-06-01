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

    def test_create_user(self):
        url = reverse('user-list')
        payload = {
            'username': 'newuser',
            'rut': '55.555.555-5',
            'password': 'securepass123',
            'rol': self.rol.id,
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 201)

        created = User.objects.get(rut='55.555.555-5')
        self.assertEqual(created.username, 'newuser')
        self.assertEqual(created.rol_id, self.rol.id)
        self.assertTrue(created.check_password('securepass123'))
