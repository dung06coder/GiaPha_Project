from django.core.management.base import BaseCommand
from django.db import transaction
from genealogy.models import Branch, Member, Marriage, Event
from datetime import date

class Command(BaseCommand):
    help = 'Tạo dữ liệu gia phả mẫu 4 đời kèm trường hợp đa thê để test UI/API'
    
    def handle(self, *args, **options):
        self.stdout.write("Đang xóa dữ liệu cũ (nếu có)...")
        Event.objects.all().delete()
        Marriage.objects.all().delete()
        Branch.objects.all().delete()
        Member.objects.all().delete()

        with transaction.atomic():
            # --- ĐỜI 1: THỦY TỔ ---
            thuy_to = Member.objects.create(
                full_name="Nguyễn Văn Tổ",
                alias_name="Phúc Đức",
                gender=Member.GenderChoices.MALE,
                generation=1,
                is_alive=False,
                death_date_lunar_day=15,
                death_date_lunar_month=8,
                biography="Cụ Thủy tổ họ Nguyễn khai hoang lập ấp từ thế kỷ 18."
            )
            vo_thuy_to = Member.objects.create(
                full_name="Trần Thị Tổ",
                gender=Member.GenderChoices.FEMALE,
                generation=1,
                is_alive=False
            )
            Marriage.objects.create(husband=thuy_to, wife=vo_thuy_to, marriage_order=1, status=Marriage.StatusChoices.WIDOWED)
            
            # Gán Thủy Tổ vào Bảng Sự Kiện
            Event.objects.create(
                title="Giỗ Cụ Thủy Tổ",
                event_type=Event.EventTypeChoices.DEATH_ANNIVERSARY,
                lunar_day=15,
                lunar_month=8,
                related_member=thuy_to
            )

            # Tạo Chi 1 (Trưởng)
            chi_truong = Branch.objects.create(name="Chi Trưởng", founder=thuy_to, description="Chi lớn nhất do con cả kế thừa.")
            thuy_to.branch = chi_truong
            thuy_to.save()

            # --- ĐỜI 2: ĐA THÊ (1 ÔNG 2 BÀ) ---
            truong_nam_doi_2 = Member.objects.create(
                full_name="Nguyễn Văn Hai",
                gender=Member.GenderChoices.MALE,
                generation=2,
                branch=chi_truong,
                father=thuy_to,
                mother=vo_thuy_to,
                birth_order=1,
                is_alive=False
            )
            
            # Bà Cả (Đời 2)
            ba_ca = Member.objects.create(
                full_name="Lê Thị Cả",
                gender=Member.GenderChoices.FEMALE,
                generation=2,
                is_alive=False
            )
            Marriage.objects.create(husband=truong_nam_doi_2, wife=ba_ca, marriage_order=1)

            # Bà Hai (Đời 2)
            ba_hai = Member.objects.create(
                full_name="Phạm Thị Hai",
                gender=Member.GenderChoices.FEMALE,
                generation=2,
                is_alive=False
            )
            Marriage.objects.create(husband=truong_nam_doi_2, wife=ba_hai, marriage_order=2)

            # --- ĐỜI 3: CON CỦA 2 BÀ ---
            # Con bà Cả (2 trai, 1 gái)
            con_trai_1_baca = Member.objects.create(
                full_name="Nguyễn Văn Ba Trưởng", gender=Member.GenderChoices.MALE, generation=3, branch=chi_truong,
                father=truong_nam_doi_2, mother=ba_ca, birth_order=1, is_alive=True, birth_date_solar=date(1965, 5, 20)
            )
            con_trai_2_baca = Member.objects.create(
                full_name="Nguyễn Văn Ba Thứ", gender=Member.GenderChoices.MALE, generation=3, branch=chi_truong,
                father=truong_nam_doi_2, mother=ba_ca, birth_order=2, is_alive=True
            )
            con_gai_1_baca = Member.objects.create(
                full_name="Nguyễn Thị Ba Nữ", gender=Member.GenderChoices.FEMALE, generation=3, branch=chi_truong,
                father=truong_nam_doi_2, mother=ba_ca, birth_order=3, is_alive=True
            )
            
            # Con bà Hai (1 trai)
            con_trai_3_bahai = Member.objects.create(
                full_name="Nguyễn Văn Ba Út", gender=Member.GenderChoices.MALE, generation=3, branch=chi_truong,
                father=truong_nam_doi_2, mother=ba_hai, birth_order=4, is_alive=True
            )

            # Đời 3 có kết hôn
            vo_ba_truong = Member.objects.create(full_name="Vũ Thị Trưởng", gender=Member.GenderChoices.FEMALE, generation=3, is_alive=True)
            Marriage.objects.create(husband=con_trai_1_baca, wife=vo_ba_truong, marriage_order=1)

            # --- ĐỜI 4: THẾ HỆ TRẺ ---
            # Con của ông Ba Trưởng
            Member.objects.create(
                full_name="Nguyễn Văn Bốn Đích", gender=Member.GenderChoices.MALE, generation=4, branch=chi_truong,
                father=con_trai_1_baca, mother=vo_ba_truong, birth_order=1, is_alive=True, birth_date_solar=date(1995, 10, 15)
            )
            Member.objects.create(
                full_name="Nguyễn Thị Bốn Gái", gender=Member.GenderChoices.FEMALE, generation=4, branch=chi_truong,
                father=con_trai_1_baca, mother=vo_ba_truong, birth_order=2, is_alive=True, birth_date_solar=date(1998, 12, 1)
            )

        self.stdout.write(self.style.SUCCESS("Đã tạo dữ liệu gia phả mẫu thành công! (1 Thủy tổ, Mô hình đa thê, Đủ 4 đời)"))