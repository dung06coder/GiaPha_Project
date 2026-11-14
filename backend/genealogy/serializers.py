from rest_framework import serializers
from .models import User

class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'linked_member', 'managed_branch']