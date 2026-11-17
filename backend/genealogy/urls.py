from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserMeView, BranchViewSet, MemberViewSet, MarriageViewSet,TreeView

# 1. Đăng ký các ViewSet vào DefaultRouter
router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'marriages', MarriageViewSet, basename='marriage')


urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserMeView.as_view(), name='user_me'),
    path('', include(router.urls)),
    path('tree/', TreeView.as_view(), name='tree_data'),
]