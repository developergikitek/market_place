from collections import defaultdict
from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Brand, Category, CategoryAttribute, Product, ProductAttributeValue
from common.enums import CatalogStatus
from common.utils import generate_asin


class Command(BaseCommand):
    help = (
        "Give every brand a few master catalog products (no seller listings), placed in the leaf categories "
        "whose brand attribute allows that brand. Safe to re-run: existing seeded products are skipped."
    )

    def add_arguments(self, parser):
        parser.add_argument('--per-brand', type=int, default=2, help="Products to create per brand (default: 2)")

    def handle(self, *args, **options):
        per_brand = max(1, options['per_brand'])
        brands = list(Brand.objects.order_by('name'))
        by_id = {b.id: b for b in brands}
        by_name = {b.name.strip().lower(): b for b in brands}

        # brand id -> leaf categories whose `brand` attribute lists it
        leaves_for = defaultdict(list)
        brand_attrs = CategoryAttribute.objects.filter(code='brand', category__is_leaf=True).select_related('category')
        for attr in brand_attrs.order_by('category__name'):
            for option in attr.allowed_options_json or []:
                if isinstance(option, dict):
                    brand = by_id.get(option.get('id')) or by_name.get((option.get('name') or '').strip().lower())
                else:
                    brand = by_name.get(str(option).strip().lower())
                if brand and attr.category not in leaves_for[brand.id]:
                    leaves_for[brand.id].append(attr.category)

        fallback_leaf = Category.objects.filter(is_leaf=True).order_by('name').first()
        attrs_by_category = defaultdict(list)
        for attr in CategoryAttribute.objects.filter(category__is_leaf=True).order_by('label'):
            attrs_by_category[attr.category_id].append(attr)

        created = skipped = unmapped = 0
        with transaction.atomic():
            for brand in brands:
                leaves = leaves_for.get(brand.id)
                if not leaves:
                    unmapped += 1
                    leaves = [fallback_leaf]
                for i in range(per_brand):
                    leaf = leaves[i % len(leaves)]
                    # Repeat visits to the same leaf pick the next option, so titles stay distinct.
                    if self._create(brand, leaf, attrs_by_category[leaf.id], variant=i // len(leaves)):
                        created += 1
                    else:
                        skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"Brand products seeded. Created: {created}, already present: {skipped}, "
            f"brands without a mapped category (placed in '{fallback_leaf.name}'): {unmapped}"
        ))

    def _create(self, brand, leaf, attrs, variant):
        values = []
        for attr in attrs:
            if attr.code == 'brand':
                values.append((attr, brand.name, None))
            elif attr.data_type == 'ENUM' and attr.allowed_options_json:
                opts = attr.allowed_options_json
                opt = opts[variant % len(opts)]
                unit = (attr.unit_of_measure_options or [None])[0]
                values.append((attr, opt if isinstance(opt, str) else opt.get('name'), unit))
            elif attr.data_type == 'BOOLEAN' and attr.is_required:
                values.append((attr, 'Yes', None))

        specs = [f"{v} {u}" if u else v for a, v, u in values if a.code != 'brand' and a.data_type == 'ENUM']
        variation_specs = [
            f"{v} {u}" if u else v for a, v, u in values if a.code != 'brand' and a.is_variation_attribute
        ]
        spec = (variation_specs or specs or [None])[0]
        title = f"{brand.name} {leaf.name}" + (f" - {spec}" if spec else "")
        if Product.objects.filter(brand=brand, category=leaf, title=title).exists():
            return False

        asin = generate_asin()
        while Product.objects.filter(asin=asin).exists():
            asin = generate_asin()
        product = Product.objects.create(
            asin=asin,
            title=title,
            brand=brand,
            category=leaf,
            description=f"{title}. Genuine {brand.name} product for {leaf.name.lower()} applications.",
            bullet_points=[f"{a.label}: {v} {u or ''}".strip() for a, v, u in values if a.code != 'brand'][:5],
            search_keywords=[brand.name, leaf.name],
            status=CatalogStatus.ACTIVE,
        )
        ProductAttributeValue.objects.bulk_create([
            ProductAttributeValue(product=product, attribute=a, value=v, unit_of_measure=u) for a, v, u in values if v
        ])
        return True
