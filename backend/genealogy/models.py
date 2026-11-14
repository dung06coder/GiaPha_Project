from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class Branch(models.Model):
    name = models.CharField(max_length= 150 ,verbose_name= "Tên Chi/Phái")
    description = models.TextField(null=True, blank=True, verbose_name="Mô tả chi")
    founder = models.ForeignKey(
        'Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='founded_branches',
        verbose_name="Thủy tổ Chi/Phái"
    )

    class Meta:
        db_table = 'branches'
        verbose_name = 'Chi/Phái'
        verbose_name_plural = 'Các Chi/Phái'

    def __str__(self):
        return self.name

class Member(models.Model):
    class GenderChoices(models.TextChoices):
        MALE = 'MALE', 'Nam'
        FEMALE = 'FEMALE', 'Nữ'
        OTHER = 'OTHER', 'Khác'

    full_name = models.CharField(max_length=150, verbose_name="Họ và tên khai sinh")
    alias_name = models.CharField(
        max_length=150, null=True, blank=True, verbose_name="Tên tự/hiệu/thụy"
    )
    gender = models.CharField(
        max_length=10,
        choices=GenderChoices.choices,
        default=GenderChoices.MALE,
        verbose_name="Giới tính"
    )
    generation = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Đời thứ"
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        verbose_name="Thuộc Chi/Phái"
    )
    father = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children_from_father',
        verbose_name="Cha"
    )
    mother = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children_from_mother',
        verbose_name="Mẹ"
    )
    is_adopted = models.BooleanField(default=False, verbose_name="Con nuôi")
    birth_order = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Con thứ mấy"
    )
    birth_date_solar = models.DateField(
        null=True, blank=True, verbose_name="Ngày sinh Dương lịch"
    )
    is_alive = models.BooleanField(default=True, verbose_name="Còn sống")
    death_date_lunar_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
        verbose_name="Ngày mất Âm lịch (1-30)"
    )
    death_date_lunar_month = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        verbose_name="Tháng mất Âm lịch (1-12)"
    )
    death_date_solar = models.DateField(
        null=True, blank=True, verbose_name="Ngày mất Dương lịch"
    )
    avatar_url = models.CharField(
        max_length=500, null=True, blank=True, verbose_name="Ảnh đại diện (URL)"
    )
    burial_info = models.TextField(
        null=True, blank=True, verbose_name="Thông tin mộ phần / Tọa độ GPS"
    )
    biography = models.TextField(
        null=True, blank=True, verbose_name="Tiểu sử / Công đức"
    )

    class Meta:
        db_table = 'members'
        verbose_name = 'Thành viên'
        verbose_name_plural = 'Danh sách Thành viên'
        indexes = [
            models.Index(fields=['generation']),
            models.Index(fields=['branch']),
            models.Index(fields=['father']),
            models.Index(fields=['mother']),
        ]

    def __str__(self):
        return f"{self.full_name} (Đời {self.generation})"
    
class Marriage(models.Model):
    class StatusChoices(models.TextChoices):
        MARRIED = 'MARRIED', 'Đang kết hôn'
        DIVORCED = 'DIVORCED', 'Đã ly hôn'
        WIDOWED = 'WIDOWED', 'Góa'

    husband = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='marriages_as_husband',
        verbose_name="Chồng"
    )
    wife = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='marriages_as_wife',
        verbose_name="Vợ"
    )
    marriage_order = models.PositiveSmallIntegerField(
        default=1, verbose_name="Thứ tự hôn nhân (vợ cả, vợ hai...)"
    )
    marriage_date = models.DateField(
        null=True, blank=True, verbose_name="Ngày kết hôn"
    )
    status = models.CharField(
        max_length=15,
        choices=StatusChoices.choices,
        default=StatusChoices.MARRIED,
        verbose_name="Trạng thái hôn nhân"
    )

    class Meta:
        db_table = 'marriages'
        verbose_name = 'Quan hệ Hôn nhân'
        verbose_name_plural = 'Danh sách Hôn nhân'
        unique_together = ('husband', 'wife')

    def __str__(self):
        return f"{self.husband.full_name} - {self.wife.full_name} (Thứ tự: {self.marriage_order})"

class Event(models.Model):
    class EventTypeChoices(models.TextChoices):
        DEATH_ANNIVERSARY = 'DEATH_ANNIVERSARY', 'Giỗ chạp'
        CLAN_MEETING = 'CLAN_MEETING', 'Họp họ thường niên'
        SCHOLARSHIP = 'SCHOLARSHIP', 'Khuyến học'
        LONGEVITY = 'LONGEVITY', 'Mừng thọ'
        OTHER = 'OTHER', 'Sự kiện khác'

    title = models.CharField(max_length=200, verbose_name="Tiêu đề sự kiện")
    event_type = models.CharField(
        max_length=30,
        choices=EventTypeChoices.choices,
        default=EventTypeChoices.OTHER,
        verbose_name="Loại sự kiện"
    )
    lunar_day = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
        verbose_name="Ngày Âm lịch"
    )
    lunar_month = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        verbose_name="Tháng Âm lịch"
    )
    solar_date = models.DateField(
        null=True, blank=True, verbose_name="Ngày Dương lịch"
    )
    related_member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events',
        verbose_name="Thành viên liên quan"
    )
    description = models.TextField(
        null=True, blank=True, verbose_name="Mô tả chi tiết"
    )

    class Meta:
        db_table = 'events'
        verbose_name = 'Sự kiện & Giỗ chạp'
        verbose_name_plural = 'Danh sách Sự kiện & Giỗ chạp'

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"
    

class User(AbstractUser):
    class RoleChoices(models.TextChoices):
        ADMIN = 'ADMIN', 'Hội đồng Gia tộc (Admin)'
        EDITOR = 'EDITOR', 'Trưởng chi / Biên tập viên (Editor)'
        MEMBER = 'MEMBER', 'Thành viên dòng họ (Member)'

    role = models.CharField(
        max_length=15,
        choices=RoleChoices.choices,
        default=RoleChoices.MEMBER,
        verbose_name="Vai trò"
    )
    linked_member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_accounts',
        verbose_name="Hồ sơ thành viên liên kết"
    )
    managed_branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managers',
        verbose_name="Chi/Phái được phân công quản lý"
    )

    class Meta:
        db_table = 'users'
        verbose_name = 'Tài khoản'
        verbose_name_plural = 'Danh sách Tài khoản'

    def __str__(self):
        return f"{self.username} ({self.role})"
