from rest_framework import serializers
from .models import User,Branch,Member, Marriage,Event

class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'linked_member', 'managed_branch']
        read_only_fields = ['id', 'username', 'role']
class BranchSerializer(serializers.ModelSerializer):
    founder_name = serializers.CharField(source = 'founder.full_name', read_only = True)
    class Meta:
        model = Branch
        fields = ['id', 'name', 'description', 'founder', 'founder_name']

class MarriageSerializer(serializers.ModelSerializer):
    husband_name = serializers.CharField(source = 'husband.full_name', read_only = True)
    wife_name = serializers.CharField(source = 'wife.full_name', read_only = True)
    
    class Meta:
        model = Marriage
        fields = '__all__'
    
    def validate(self, attrs):
        husband = attrs.get('husband')
        wife = attrs.get('wife')
        if husband and wife and husband.id == wife.id:
            raise serializers.ValidationError(
                "Chồng và vợ không thể là cùng một người."
            )
        return attrs

class MemberSerializer(serializers.ModelSerializer):
    branch_name  = serializers.CharField(source = 'branch.name',read_only  = True)
    father_name = serializers.CharField(source = 'father.full_name',read_only = True)
    mother_name = serializers.CharField(source = 'mother.full_name',read_only = True)
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
    
    def validate_branch(self, value):
        """Kiểm tra nếu người tạo là EDITOR thì chỉ được gán vào Chi mình quản lý."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request and request.user.role == 'EDITOR':
                if not value or value.id != request.user.managed_branch_id:
                    raise serializers.ValidationError(
                        "Trưởng chi (Editor) chỉ được phép thêm/sửa thành viên thuộc Chi mình quản lý.")
        
        return value
    
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'