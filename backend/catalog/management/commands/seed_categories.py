import json
import uuid
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from catalog.models import Category

NAMESPACE_CATEGORY = uuid.NAMESPACE_DNS

class Command(BaseCommand):
    help = "Seed construction categories hierarchy into PostgreSQL with UUID primary keys"

    def add_arguments(self, parser):
        default_path = Path(settings.BASE_DIR).parent / "data" / "construction_categories.json"
        parser.add_argument(
            "--file",
            type=str,
            default=str(default_path),
            help=f"Path to construction_categories.json (default: {default_path})",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing categories before importing",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file"])
        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"Categories file not found at: {file_path}"))
            return

        self.stdout.write(f"Reading categories from: {file_path}...")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Group nodes by level to preserve top-down foreign key insertion order
        nodes_by_level = {}

        def traverse(node, parent_id=None):
            lvl = node["level"]
            if lvl not in nodes_by_level:
                nodes_by_level[lvl] = []

            nodes_by_level[lvl].append({
                "code": node["id"],
                "name": node["name"],
                "slug": node["slug"],
                "level": node["level"],
                "parent_code": node.get("parent_id") or parent_id,
                "is_leaf": node.get("is_leaf", False),
            })

            for child in node.get("children", []):
                traverse(child, node["id"])

        for cat in data.get("categories", []):
            traverse(cat)

        total_nodes = sum(len(nodes) for nodes in nodes_by_level.values())
        self.stdout.write(f"Found {total_nodes} categories across {len(nodes_by_level)} levels.")

        # 2. Bulk insert level by level in an atomic transaction
        code_to_instance = {}
        inserted_count = 0

        with transaction.atomic():
            if options.get("clear"):
                deleted_count, _ = Category.objects.all().delete()
                self.stdout.write(f"Cleared {deleted_count} existing categories.")

            # Load any existing categories into code_to_instance mapping
            for existing in Category.objects.all():
                code_to_instance[existing.browse_node_id] = existing

            for lvl in sorted(nodes_by_level.keys()):
                nodes = nodes_by_level[lvl]
                level_to_create = []

                for n in nodes:
                    if n["code"] in code_to_instance:
                        continue  # Already exists

                    cat_uuid = str(uuid.uuid5(NAMESPACE_CATEGORY, f"construction_marketplace.category.{n['code']}"))
                    parent_instance = code_to_instance.get(n["parent_code"]) if n["parent_code"] else None

                    cat_obj = Category(
                        id=cat_uuid,
                        browse_node_id=n["code"],
                        name=n["name"],
                        slug=n["slug"],
                        level=n["level"],
                        parent=parent_instance,
                        is_leaf=n["is_leaf"],
                    )
                    level_to_create.append(cat_obj)
                    code_to_instance[n["code"]] = cat_obj

                if level_to_create:
                    Category.objects.bulk_create(level_to_create)
                    inserted_count += len(level_to_create)
                    self.stdout.write(f"  ⚡ Level {lvl}: Bulk-inserted {len(level_to_create)} categories.")

        total_in_db = Category.objects.count()
        leaf_in_db = Category.objects.filter(is_leaf=True).count()
        l1_in_db = Category.objects.filter(level=1).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Successfully seeded categories into PostgreSQL!\n"
                f"   - Total categories in DB: {total_in_db}\n"
                f"   - Level 1 Groups: {l1_in_db}\n"
                f"   - Leaf Categories: {leaf_in_db}\n"
                f"   - Newly Inserted: {inserted_count}"
            )
        )
