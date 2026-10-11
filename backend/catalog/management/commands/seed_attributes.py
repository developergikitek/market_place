import json
import uuid
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from django.utils.text import slugify
from catalog.models import Category, CategoryAttribute, Brand

NAMESPACE_ATTR = uuid.NAMESPACE_DNS

class Command(BaseCommand):
    help = "Seed category attributes into PostgreSQL with UUIDs and structured brand options"

    def add_arguments(self, parser):
        default_path = Path(settings.BASE_DIR).parent / "data" / "construction_category_attributes.json"
        parser.add_argument(
            "--file",
            type=str,
            default=str(default_path),
            help=f"Path to construction_category_attributes.json (default: {default_path})",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing category attributes before importing",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"Attributes file not found at: {file_path}"))
            return

        self.stdout.write(f"Reading attributes from: {file_path}...")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Preload Brands & Categories
        self.stdout.write("Preloading brands and leaf categories from database...")
        db_brands_by_name = {b.name.strip().lower(): b for b in Brand.objects.all()}
        db_categories_by_code = {c.browse_node_id: c for c in Category.objects.filter(is_leaf=True)}

        alias_map = {
            "nuvoco (lafarge)": "nuvoco",
            "rinl vizag": "vizag steel",
            "basf master builders": "master builders solutions",
        }

        leaves = data.get("leaves", [])
        self.stdout.write(f"Found {len(leaves)} leaves with attributes. Processing...")

        attributes_to_create = []
        skipped_leaves = 0

        for leaf in leaves:
            leaf_id = leaf["leafId"]
            category = db_categories_by_code.get(leaf_id)
            if not category:
                skipped_leaves += 1
                continue

            for attr in leaf.get("attributes", []):
                key = attr["key"]
                attr_uuid = str(uuid.uuid5(NAMESPACE_ATTR, f"construction_marketplace.category_attribute.{leaf_id}.{key}"))

                # Process allowed_options_json
                raw_options = attr.get("allowedOptionsJson")
                final_options = raw_options

                if key == "brand" and raw_options and isinstance(raw_options, list):
                    brand_objects = []
                    for opt in raw_options:
                        opt_str = str(opt).strip()
                        opt_lower = opt_str.lower()

                        if opt_lower == "others":
                            brand_objects.append({
                                "id": "others",
                                "name": "Others",
                                "slug": "others",
                            })
                        else:
                            mapped_name = alias_map.get(opt_lower, opt_lower)
                            brand = db_brands_by_name.get(mapped_name)
                            if brand:
                                brand_objects.append({
                                    "id": brand.id,
                                    "name": brand.name,
                                    "slug": brand.slug,
                                })
                            else:
                                fallback_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"brand.{opt_str}"))
                                brand_objects.append({
                                    "id": fallback_id,
                                    "name": opt_str,
                                    "slug": slugify(opt_str),
                                })
                    final_options = brand_objects

                unit = attr.get("unit")
                unit_options = [unit] if unit else []

                attr_obj = CategoryAttribute(
                    id=attr_uuid,
                    category=category,
                    code=key,
                    label=attr["label"],
                    data_type=attr.get("type", "text").upper(),
                    is_required=attr.get("isRequired", False),
                    is_filterable=attr.get("isFilterable", True),
                    is_variation_attribute=attr.get("isVariationAttribute", False),
                    allowed_options_json=final_options,
                    unit_of_measure_options=unit_options,
                )
                attributes_to_create.append(attr_obj)

        self.stdout.write(f"Prepared {len(attributes_to_create)} category attributes.")

        # 2. Bulk insert inside atomic transaction
        with transaction.atomic():
            if options.get("clear"):
                del_count, _ = CategoryAttribute.objects.all().delete()
                self.stdout.write(f"Cleared {del_count} existing category attributes.")

            CategoryAttribute.objects.bulk_create(
                attributes_to_create,
                batch_size=1000,
                ignore_conflicts=True,
            )

        total_in_db = CategoryAttribute.objects.count()
        brand_attrs_count = CategoryAttribute.objects.filter(code="brand").count()

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Successfully seeded category attributes into PostgreSQL!\n"
                f"   - Total attributes in DB: {total_in_db}\n"
                f"   - Brand attributes configured: {brand_attrs_count}\n"
                f"   - Skipped leaves (not in DB): {skipped_leaves}"
            )
        )
