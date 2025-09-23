from django.test import TestCase, Client
from unittest.mock import patch, MagicMock
from backend.ccm.canvas_api.canvas_create_user_handler import CanvasCreateUserHandler
from rest_framework import status
from canvasapi.exceptions import BadRequest

class CreateUserHandlerTests(TestCase):
    
    @staticmethod
    def create_invitation_response_scenarios():
        return {
            "new_users_success": [
                {"email": "logic40@mailinator.com", "userCreated": True, "invited": True},
                {"email": "logic41@mailinator.com", "userCreated": True, "invited": True}
            ],
            "new_and_existing_user_success": [
                {"email": "logic41@mailinator.com", "userCreated": False},
                {"email": "kotha30@mailinator.com", "userCreated": True, "invited": True}
            ],
            "new_users_creation_all_failure_response": {
                "statusCode": 500,
                "data": [
                    {
                        "email": "bulk1_user@mailinator.com",
                        "userCreated": {
                            "canvasStatusCode": 500,
                            "message": "New User creation Failed",
                            "failedInput": "bulk1_user+mailinator.com"
                        }
                    },
                    {
                        "email": "bulk2_user@mailinator.com",
                        "userCreated": {
                            "canvasStatusCode": 500,
                            "message": "New User creation Failed",
                            "failedInput": "bulk2_user+mailinator.com"
                        }
                    }
                ]
            },
            "invitation_failure_for_all_users_created": {
                "statusCode": 403,
                "data": [
                    {
                        "email": "kotha13@mailinator.com",
                        "userCreated": True,
                        "invited": {
                            "statusCode": 403,
                            "messages": ["API Authentication - Authentication failed; Invalid api key or password."]
                        }
                    },
                    {
                        "email": "kotha14@mailinator.com",
                        "userCreated": True,
                        "invited": {
                            "statusCode": 403,
                            "messages": ["API Authentication - Authentication failed; Invalid api key or password."]
                        }
                    }
                ]
            },
            "mixed_user_creation_and_invitation_outcomes_response": {
                "statusCode": 502,
                "data": [
                    {
                        "email": "bulk1_user@mailinator.com",
                        "userCreated": {
                            "canvasStatusCode": 500,
                            "message": "Invalid access token.",
                            "failedInput": "bulk1_user+mailinator.com"
                        }
                    },
                    {
                        "email": "bulk2_user@mailinator.com",
                        "userCreated": False
                    },
                    {
                        "email": "bulk4_user@mailinator.com",
                        "userCreated": True,
                        "invited": {
                            "statusCode": 403,
                            "messages": ["API Authentication - Authentication failed; Invalid api key or password."]
                        }
                    }
    ]
}
        }
    def setUp(self):
        self.client = Client()
        self.url = '/api/admin/createExternalUsers'  # Adjust to actual route if different
        self.valid_payload = {
            "users": [
                {"email": "logic40@mailinator.com", "givenName": "Logic", "surname": "Forty"},
                {"email": "logic41@mailinator.com", "givenName": "Logic", "surname": "FortyOne"}
            ]
        }
        # Create and log in a test user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.login(username='testuser', password='testpass')

    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.create_users')
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.is_external_users_invitation_success')
    def test_multiple_new_users_success(self, mock_invite_success, mock_create_users):
        # Mock user creation results
        mock_create_users.return_value = [
            {"email": "logic40@mailinator.com", "id": 1, "name": "Logic Forty", "login_id": "logic40+mailinator.com"},
            {"email": "logic41@mailinator.com", "id": 2, "name": "Logic FortyOne", "login_id": "logic41+mailinator.com"}
        ]
        # Mock invitation success
        mock_invite_success.return_value = True

        response = self.client.post(self.url, self.valid_payload, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)
        expected = self.create_invitation_response_scenarios()["new_users_success"]
        self.assertEqual(response.data, expected)

    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.create_users')
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.is_external_users_invitation_success')
    def test_new_and_existing_user_success(self, mock_invite_success, mock_create_users):
        # Mock user creation results: one fails (existing user), one succeeds
        from backend.ccm.canvas_api.canvas_create_user_handler import HTTPAPIError
        bad_request_msg = '{"errors":{"user":{"pseudonyms":[{"attribute":"pseudonyms","message":"is invalid","type":"invalid"}]},"pseudonym":{"unique_id":[{"attribute":"unique_id","message":"ID already in use for this account and authentication provider","type":"taken"}]},"observee":{},"pairing_code":{},"recaptcha":null}}'
        mock_create_users.return_value = [
            HTTPAPIError("logic41+mailinator.com", BadRequest(bad_request_msg)),
            {"email": "kotha30@mailinator.com", "id": 2, "name": "Kotha Thirty", "login_id": "kotha30+mailinator.com"}
        ]
        # Mock invitation success for the successfully created user
        mock_invite_success.return_value = True

        payload = {
            "users": [
                {"email": "logic41@mailinator.com", "givenName": "Logic", "surname": "FortyOne"},
                {"email": "kotha30@mailinator.com", "givenName": "Kotha", "surname": "Thirty"}
            ]
        }
        response = self.client.post(self.url, payload, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        print(response.data)
        self.assertEqual(len(response.data), 2)
        expected = self.create_invitation_response_scenarios()["new_and_existing_user_success"]
        self.assertEqual(response.data, expected)

    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.create_users')
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.is_external_users_invitation_success')
    def test_new_user_creating_all_failure(self, mock_invite_success, mock_create_users):
        from backend.ccm.canvas_api.canvas_create_user_handler import HTTPAPIError
        # Simulate all user creation failing with a generic exception
        mock_create_users.return_value = [
            HTTPAPIError("bulk1_user+mailinator.com", Exception("New User creation Failed")),
            HTTPAPIError("bulk2_user+mailinator.com", Exception("New User creation Failed"))
        ]
        mock_invite_success.return_value = False

        payload = {
            "users": [
                {"email": "bulk1_user@mailinator.com", "givenName": "Bulk1", "surname": "User"},
                {"email": "bulk2_user@mailinator.com", "givenName": "Bulk2", "surname": "User"}
            ]
        }
        response = self.client.post(self.url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 500)
        self.assertIsInstance(response.data, dict)
        expected = self.create_invitation_response_scenarios()["new_users_creation_all_failure_response"]
        self.assertEqual(response.data, expected)
    
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.create_users')
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.is_external_users_invitation_success')
    def test_invitation_failure_for_all_users_created(self, mock_invite_success, mock_create_users):
        # Mock user creation results: all succeed
        mock_create_users.return_value = [
            {"email": "kotha13@mailinator.com", "id": 1, "name": "Kotha Thirteen", "login_id": "kotha13+mailinator.com"},
            {"email": "kotha14@mailinator.com", "id": 2, "name": "Kotha Fourteen", "login_id": "kotha14+mailinator.com"}
        ]
        # Mock invitation failure for all users
        mock_invite_success.return_value = {
            "statusCode": 403,
            "messages": ["API Authentication - Authentication failed; Invalid api key or password."]
        }

        payload = {
            "users": [
                {"email": "kotha13@mailinator.com", "givenName": "Kotha", "surname": "Thirteen"},
                {"email": "kotha14@mailinator.com", "givenName": "Kotha", "surname": "Fourteen"}
            ]
        }
        response = self.client.post(self.url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertIsInstance(response.data, dict)
        expected = self.create_invitation_response_scenarios()["invitation_failure_for_all_users_created"]
        self.assertEqual(response.data, expected)
    
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.create_users')
    @patch('backend.ccm.canvas_api.canvas_create_user_handler.CanvasCreateUserHandler.is_external_users_invitation_success')
    def test_mixed_user_creation_and_invitation_outcomes(self, mock_invite_success, mock_create_users):
        from backend.ccm.canvas_api.canvas_create_user_handler import HTTPAPIError
        # Simulate user creation results: one fails with exception, one fails as already exists, one succeeds
        already_created_user_err_msg = '{"errors":{"user":{"pseudonyms":[{"attribute":"pseudonyms","message":"is invalid","type":"invalid"}]},"pseudonym":{"unique_id":[{"attribute":"unique_id","message":"ID already in use for this account and authentication provider","type":"taken"}]},"observee":{},"pairing_code":{},"recaptcha":null}}'

        mock_create_users.return_value = [
            HTTPAPIError("bulk1_user+mailinator.com", Exception("Invalid access token.")),
            HTTPAPIError("logic41+mailinator.com", BadRequest(already_created_user_err_msg)),
            {"email": "bulk4_user@mailinator.com", "id": 4, "name": "Bulk Four", "login_id": "bulk4_user+mailinator.com"}
        ]
        # Mock invitation failure for the successfully created user
        mock_invite_success.return_value = {
            "statusCode": 403,
            "messages": ["API Authentication - Authentication failed; Invalid api key or password."]
        }

        payload = {
            "users": [
                {"email": "bulk1_user@mailinator.com", "givenName": "Bulk1", "surname": "User"},
                {"email": "bulk2_user@mailinator.com", "givenName": "Bulk2", "surname": "User"},
                {"email": "bulk4_user@mailinator.com", "givenName": "Bulk4", "surname": "User"}
            ]
        }
        response = self.client.post(self.url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 502)
        self.assertIsInstance(response.data, dict)
        expected = self.create_invitation_response_scenarios()["mixed_user_creation_and_invitation_outcomes_response"]
        self.assertEqual(response.data, expected)


