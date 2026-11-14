from rest_framework import serializers
from .models import User,Branch,Member, Marriage

class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'linked_member', 'managed_branch']
        
class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class MarriageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marriage
        fields = '__all__'

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'

    def to_representation(self, instance):
        # 1. Gọi hàm gốc để lấy toàn bộ dữ liệu mặc định từ Database
        data = super().to_representation(instance)
        
        # 2. Lấy thông tin request (người đang gọi API là ai)
        request = self.context.get('request')
        
        # 3. Nếu là Guest (không có thẻ JWT) và thành viên này còn sống
        is_guest = not request or not request.user.is_authenticated
        
        if is_guest and instance.is_alive:
            # Ghi đè thành None để ẩn thông tin nhạy cảm
            data['birth_date_solar'] = None
            data['burial_info'] = None
            data['biography'] = "Thông tin tiểu sử bị ẩn đối với người còn sống để bảo mật."
            
        return data