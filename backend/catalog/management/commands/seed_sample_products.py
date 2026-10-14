from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from sellers.models import Seller
from catalog.models import Product, ProductImage, Brand, Category, CategoryAttribute, ProductAttributeValue
from listings.models import Listing, ListingTierPrice
from warehouses.models import Warehouse, InventoryItem
from common.enums import (
    CatalogStatus, ProductCondition, FulfillmentChannel, ListingStatus, WarehouseType
)
from common.utils import generate_id

class Command(BaseCommand):
    help = "Seed flagship construction products, listings, tier prices, and inventory for Gikitek seller"

    def handle(self, *args, **options):
        # 1. Fetch or create Gikitek Seller
        seller = Seller.objects.filter(store_slug='gikitek').first()
        if not seller:
            from identity.models import User
            from common.enums import UserRole, SellerTier, SellerAccountStatus, VerificationStatus
            user, _ = User.objects.get_or_create(
                phone="9936628446",
                defaults={
                    "username": "9936628446",
                    "email": "seller@gikitek.com",
                    "first_name": "Gikitek",
                    "last_name": "Seller",
                    "role": UserRole.SELLER,
                    "is_active": True,
                }
            )
            seller, _ = Seller.objects.get_or_create(
                store_slug="gikitek",
                defaults={
                    "user": user,
                    "legal_business_name": "Gikitek Construction Solutions Pvt Ltd",
                    "display_name": "Gikitek Certified Store",
                    "tier": SellerTier.ENTERPRISE,
                    "account_status": SellerAccountStatus.ACTIVE,
                    "verification_status": VerificationStatus.APPROVED,
                    "support_email": "seller@gikitek.com",
                    "support_phone": "9936628446",
                }
            )

        self.stdout.write(f"Using Seller: {seller.display_name} (ID: {seller.id})")


        with transaction.atomic():
            # 2. Ensure Central Warehouse
            warehouse, _ = Warehouse.objects.get_or_create(
                code="BM-WH-DEL-01",
                defaults={
                    "name": "Buildmart Central Distribution Hub (NCR)",
                    "type": WarehouseType.FBA_FULFILLMENT_CENTER,
                    "street_address": "Plot 42, Sector 8, IMT Manesar",
                    "city": "Gurugram",
                    "state_or_province": "Haryana",
                    "postal_code": "122051",
                    "country_code": "IN",
                    "is_active": True,
                }
            )
            self.stdout.write(f"Warehouse ready: {warehouse.name} ({warehouse.code})")

            # 3. Product 1: UltraTech PPC Cement
            b_ultratech = Brand.objects.filter(name="UltraTech").first()
            c_cement = Category.objects.filter(browse_node_id="cat_01_01_01_03").first()

            p1, created1 = Product.objects.update_or_create(
                asin="BM01CEMENT01",
                defaults={
                    "brand": b_ultratech,
                    "category": c_cement,
                    "title": "UltraTech Super Cement (50 kg Bag) - Premium PPC Grade",
                    "description": "UltraTech Portland Pozzolana Cement (PPC) engineered with micro-fine particles for dense concrete, preventing water penetration and providing superior long-term strength for all residential and commercial structural casting.",
                    "bullet_points": [
                        "Engineered with micro-fine pozzolanic material for highest density",
                        "Superior resistance to chemical, alkali, and sulfate attacks",
                        "Reduced heat of hydration preventing thermal cracking",
                        "Ideal for RCC foundations, columns, beams, slabs, and plastering",
                        "IS 1489 (Part 1) certified quality direct from manufacturer"
                    ],
                    "search_keywords": ["cement", "ultratech", "ppc", "50kg", "building material", "rcc cement"],
                    "package_weight_pounds": Decimal("110.23"),
                    "status": CatalogStatus.ACTIVE,
                }
            )

            # Image for Product 1
            ProductImage.objects.get_or_create(
                product=p1,
                variant_tag="MAIN",
                defaults={
                    "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
                    "sort_order": 0,
                }
            )

            # Listing for Product 1
            l1, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p1,
                defaults={
                    "seller_sku": "GIK-ULTRA-PPC-50",
                    "condition": ProductCondition.NEW,
                    "condition_note": "Direct factory supply with verified test certificates.",
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("385.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 2000,
                    "is_buy_box_winner": True,
                }
            )

            # Tier Prices for Product 1
            ListingTierPrice.objects.update_or_create(listing=l1, min_quantity=50, defaults={"discounted_price": Decimal("375.00")})
            ListingTierPrice.objects.update_or_create(listing=l1, min_quantity=200, defaults={"discounted_price": Decimal("360.00")})

            # Inventory for Product 1
            InventoryItem.objects.update_or_create(
                listing=l1,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 5000, "safety_stock": 100}
            )

            # 4. Product 2: Tata Tiscon 550D TMT Rebar (12mm)
            b_tata = Brand.objects.filter(name="TATA Tiscon").first()
            c_steel = Category.objects.filter(browse_node_id="cat_02_01_02_01").first()

            p2, created2 = Product.objects.update_or_create(
                asin="BM02STEEL012",
                defaults={
                    "brand": b_tata,
                    "category": c_steel,
                    "title": "Tata Tiscon 550D Super Ductile TMT Rebar - 12mm (12m Length)",
                    "description": "Tata Tiscon 550D is India's premier earthquake-resistant TMT rebar made from virgin iron ore with advanced primary steel making. Features superior rib pattern for exceptional concrete grip.",
                    "bullet_points": [
                        "Fe 550D grade providing 550 N/mm² minimum yield strength",
                        "Superior ductility & high energy absorption against earthquakes",
                        "Advanced ribbed surface for supreme mechanical interlocking",
                        "Corrosion resistant with superior bendability",
                        "BIS IS 1786 compliant with embossed authenticity mark"
                    ],
                    "search_keywords": ["tmt rebar", "tata tiscon", "12mm saria", "steel rod", "fe 550d"],
                    "package_weight_pounds": Decimal("23.50"),
                    "status": CatalogStatus.ACTIVE,
                }
            )

            ProductImage.objects.get_or_create(
                product=p2,
                variant_tag="MAIN",
                defaults={
                    "image_url": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
                    "sort_order": 0,
                }
            )

            l2, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p2,
                defaults={
                    "seller_sku": "GIK-TATA-TMT-12MM",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("785.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 5000,
                    "is_buy_box_winner": True,
                }
            )

            ListingTierPrice.objects.update_or_create(listing=l2, min_quantity=50, defaults={"discounted_price": Decimal("760.00")})
            ListingTierPrice.objects.update_or_create(listing=l2, min_quantity=200, defaults={"discounted_price": Decimal("735.00")})

            InventoryItem.objects.update_or_create(
                listing=l2,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 2500, "safety_stock": 50}
            )

            # 5. Product 3: Asian Paints Apex Ultima (20 Litres)
            b_asian = Brand.objects.filter(name="Asian Paints").first()
            c_paint = Category.objects.filter(browse_node_id="cat_07_02_01").first()

            p3, created3 = Product.objects.update_or_create(
                asin="BM03PAINT020",
                defaults={
                    "brand": b_asian,
                    "category": c_paint,
                    "title": "Asian Paints Apex Ultima Weather Proof Exterior Emulsion - 20 Litres (White)",
                    "description": "Asian Paints Apex Ultima is a top-of-the-line water-based 100% acrylic exterior emulsion equipped with silicone additives and Colour Stay technology to withstand extreme rain and sunlight.",
                    "bullet_points": [
                        "100% Acrylic formulation with silicone additives for ultimate water barrier",
                        "7 Years comprehensive performance and colour warranty",
                        "Anti-algal and anti-fungal formula prevents unsightly patches",
                        "High sheen exterior finish with maximum UV resistance",
                        "Direct factory sealed 20-litre packaging"
                    ],
                    "search_keywords": ["asian paints", "apex ultima", "exterior paint", "weather proof", "20 litre bucket"],
                    "package_weight_pounds": Decimal("52.00"),
                    "status": CatalogStatus.ACTIVE,
                }
            )

            ProductImage.objects.get_or_create(
                product=p3,
                variant_tag="MAIN",
                defaults={
                    "image_url": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
                    "sort_order": 0,
                }
            )

            l3, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p3,
                defaults={
                    "seller_sku": "GIK-AP-APEX-20L",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("4290.00"),
                    "sale_price": Decimal("3999.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 50,
                    "is_buy_box_winner": True,
                }
            )

            ListingTierPrice.objects.update_or_create(listing=l3, min_quantity=5, defaults={"discounted_price": Decimal("3850.00")})
            ListingTierPrice.objects.update_or_create(listing=l3, min_quantity=20, defaults={"discounted_price": Decimal("3690.00")})

            # 6. Product 4: Bosch GSB 550 Impact Drill
            b_bosch = Brand.objects.filter(name__icontains="Bosch").first() or b_ultratech
            c_tools = Category.objects.filter(name__icontains="Tool").first() or c_cement

            p4, _ = Product.objects.update_or_create(
                asin="BM04BOSCH550",
                defaults={
                    "brand": b_bosch,
                    "category": c_tools,
                    "title": "Bosch GSB 550 Impact Drill 550W (13mm Chuck)",
                    "description": "Compact and powerful 550 Watt impact drill with dual-mode functionality for drilling and impact drilling in masonry, wood, and metal.",
                    "bullet_points": ["550 Watt powerful motor", "13mm keyed chuck", "Forward/reverse rotation", "Ergonomic design with auxiliary handle"],
                    "search_keywords": ["bosch", "drill", "impact drill", "power tool", "gsb 550"],
                    "package_weight_pounds": Decimal("4.5"),
                    "status": CatalogStatus.ACTIVE,
                }
            )
            l4, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p4,
                defaults={
                    "seller_sku": "BOSCH-GSB-550W",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("2099.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 20,
                    "is_buy_box_winner": True,
                }
            )
            ListingTierPrice.objects.update_or_create(listing=l4, min_quantity=10, defaults={"discounted_price": Decimal("1999.00")})
            InventoryItem.objects.update_or_create(
                listing=l4,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 35, "safety_stock": 10}
            )

            # 7. Product 5: Stanley 16 Inch Hammer
            b_stanley = Brand.objects.filter(name__icontains="Stanley").first() or b_ultratech
            p5, _ = Product.objects.update_or_create(
                asin="BM05STANLEY16",
                defaults={
                    "brand": b_stanley,
                    "category": c_tools,
                    "title": "Stanley 16 Inch Claw Steel Hammer (Anti-Vibration)",
                    "description": "Heavy-duty anti-vibration claw hammer with high-carbon steel head for tough carpentry and masonry work.",
                    "bullet_points": ["Anti-vibration ergonomic grip", "Forged high carbon steel", "Precision-curved claw for nail pulling"],
                    "search_keywords": ["stanley", "hammer", "claw hammer", "hand tool"],
                    "package_weight_pounds": Decimal("1.8"),
                    "status": CatalogStatus.ACTIVE,
                }
            )
            l5, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p5,
                defaults={
                    "seller_sku": "STAN-16IN",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("649.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 50,
                    "is_buy_box_winner": True,
                }
            )
            InventoryItem.objects.update_or_create(
                listing=l5,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 12, "safety_stock": 15}
            )

            # 8. Product 6: Finolex PVC Pipe
            b_finolex = Brand.objects.filter(name__icontains="Finolex").first() or b_ultratech
            p6, _ = Product.objects.update_or_create(
                asin="BM06FINOLEX1",
                defaults={
                    "brand": b_finolex,
                    "category": c_cement,
                    "title": "Finolex PVC Heavy Duty Plumbing Pipe - 1 Inch (6m)",
                    "description": "High-pressure certified uPVC and PVC pipes for residential, commercial and agriculture plumbing systems.",
                    "bullet_points": ["100% lead-free formulation", "Corrosion and UV resistant", "High flow coefficient"],
                    "search_keywords": ["finolex", "pvc pipe", "plumbing pipe", "1 inch pipe"],
                    "package_weight_pounds": Decimal("8.0"),
                    "status": CatalogStatus.ACTIVE,
                }
            )
            l6, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p6,
                defaults={
                    "seller_sku": "FIN-1INCH-6M",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("340.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 500,
                    "is_buy_box_winner": True,
                }
            )
            InventoryItem.objects.update_or_create(
                listing=l6,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 65, "safety_stock": 20}
            )

            # 9. Product 7: Philips 12W LED Bulb
            b_philips = Brand.objects.filter(name__icontains="Philips").first() or b_ultratech
            p7, _ = Product.objects.update_or_create(
                asin="BM07PHILIPS12",
                defaults={
                    "brand": b_philips,
                    "category": c_tools,
                    "title": "Philips 12W LED High Brightness Bulb (B22 Cool Day Light)",
                    "description": "Energy-saving LED bulb with EyeComfort technology for glare-free illumination.",
                    "bullet_points": ["EyeComfort technology", "12W power consumption, 1200 Lumens", "Up to 15,000 hours rated life"],
                    "search_keywords": ["philips", "led bulb", "12w", "lighting", "cool day light"],
                    "package_weight_pounds": Decimal("0.3"),
                    "status": CatalogStatus.ACTIVE,
                }
            )
            l7, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p7,
                defaults={
                    "seller_sku": "PHIL-12W-CDL",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("165.00"),
                    "handling_time_days": 1,
                    "max_order_quantity": 100,
                    "is_buy_box_winner": True,
                }
            )
            InventoryItem.objects.update_or_create(
                listing=l7,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 22, "safety_stock": 25}
            )

            # 10. Product 8: Sintex Water Tank
            b_sintex = Brand.objects.filter(name__icontains="Sintex").first() or b_ultratech
            p8, _ = Product.objects.update_or_create(
                asin="BM08SINTEX1000",
                defaults={
                    "brand": b_sintex,
                    "category": c_cement,
                    "title": "Sintex 1000L Triple Layer Overhead Anti-Bacterial Water Tank",
                    "description": "Virgin plastic food-grade overhead water storage tank with 3-layer UV protection and anti-bacterial shield.",
                    "bullet_points": ["1000 Litres capacity", "100% Virgin food-grade plastic", "Triple layer with anti-microbial inside layer"],
                    "search_keywords": ["sintex", "water tank", "1000 litre", "tank", "storage"],
                    "package_weight_pounds": Decimal("65.0"),
                    "status": CatalogStatus.ACTIVE,
                }
            )
            l8, _ = Listing.objects.update_or_create(
                seller=seller,
                product=p8,
                defaults={
                    "seller_sku": "SINTEX-1000L-TL",
                    "condition": ProductCondition.NEW,
                    "fulfillment_channel": FulfillmentChannel.FBA,
                    "status": ListingStatus.ACTIVE,
                    "standard_price": Decimal("6850.00"),
                    "handling_time_days": 2,
                    "max_order_quantity": 5,
                    "is_buy_box_winner": True,
                }
            )
            InventoryItem.objects.update_or_create(
                listing=l8,
                warehouse=warehouse,
                defaults={"seller": seller, "available_stock": 8, "safety_stock": 10}
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Successfully seeded flagship products and listings for {seller.display_name}!"
            )
        )

