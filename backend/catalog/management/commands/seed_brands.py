import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from catalog.models import Brand
from common.enums import VerificationStatus

class Command(BaseCommand):
    help = "Seed master brands from data/brands.json into PostgreSQL database"

    def add_arguments(self, parser):
        default_path = Path(settings.BASE_DIR).parent / "data" / "brands.json"
        parser.add_argument(
            "--file",
            type=str,
            default=str(default_path),
            help=f"Path to brands.json (default: {default_path})",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"Brands file not found at: {file_path}"))
            return

        self.stdout.write(f"Reading brands from: {file_path}...")
        with open(file_path, "r", encoding="utf-8") as f:
            brands_data = json.load(f)

        total_brands = len(brands_data)
        self.stdout.write(f"Found {total_brands} brands in JSON. Starting database import...")

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for item in brands_data:
                brand, created = Brand.objects.update_or_create(
                    id=item["id"],
                    defaults={
                        "name": item["name"],
                        "slug": item["slug"],
                        "trademark_office": item.get("trademarkOffice"),
                        "trademark_serial_num": item.get("trademarkSerialNum"),
                        "is_gated": item.get("isGated", False),
                        "logo_url": item.get("logoUrl"),
                        "banner_url": item.get("bannerUrl"),
                        "brand_storefront_url": item.get("brandStorefrontUrl"),
                        "brand_story": item.get("brandStory"),
                        "verification_status": VerificationStatus.APPROVED,
                    },
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Successfully seeded brands into PostgreSQL! "
                f"Created: {created_count}, Updated: {updated_count}, Total: {Brand.objects.count()}"
            )
        )
