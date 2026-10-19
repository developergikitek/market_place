from django.db import models
from common.enums import VerificationStatus, VariationTheme, CatalogStatus
from common.utils import generate_id

class Brand(models.Model):
    """
    Brand Registry entity protecting trademarks and granting enhanced content tools.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.CharField(max_length=255, unique=True)
    owner_seller = models.ForeignKey('sellers.Seller', null=True, blank=True, on_delete=models.SET_NULL, related_name='brand_registries')
    trademark_office = models.CharField(max_length=100, null=True, blank=True)
    trademark_serial_num = models.CharField(max_length=100, null=True, blank=True)
    verification_status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    is_gated = models.BooleanField(default=False)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    banner_url = models.CharField(max_length=500, null=True, blank=True)
    brand_storefront_url = models.CharField(max_length=500, null=True, blank=True)
    brand_story = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brands'
        indexes = [
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name

class Category(models.Model):
    """
    Self-referential hierarchical taxonomy tree.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.RESTRICT, related_name='children')
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    browse_node_id = models.CharField(max_length=50, unique=True)
    level = models.IntegerField(default=0)
    is_leaf = models.BooleanField(default=False)
    is_gated = models.BooleanField(default=False)
    referral_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)
    closing_fee_fixed = models.DecimalField(max_digits=6, decimal_places=2, default=0.30)
    banner_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['browse_node_id']),
        ]

    def __str__(self):
        return f"{self.name} (L{self.level})"

class CategoryAttribute(models.Model):
    """
    Category-specific dynamic schema attributes.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='attributes')
    code = models.CharField(max_length=100)
    label = models.CharField(max_length=255)
    data_type = models.CharField(max_length=50) # STRING, NUMBER, BOOLEAN, SELECT, MULTI_SELECT
    is_required = models.BooleanField(default=False)
    is_variation_attribute = models.BooleanField(default=False)
    is_filterable = models.BooleanField(default=True)
    validation_regex = models.CharField(max_length=255, null=True, blank=True)
    allowed_options_json = models.JSONField(null=True, blank=True)
    unit_of_measure_options = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'category_attributes'
        unique_together = ('category', 'code')

    def __str__(self):
        return f"{self.category.name}: {self.label} ({self.code})"

class SellerBrandAuthorization(models.Model):
    """
    Seller approval request to sell gated/restricted brands.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='brand_authorizations')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='seller_authorizations')
    status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    invoice_document_urls = models.JSONField(default=list, blank=True)
    authorization_letter_url = models.CharField(max_length=500, null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_brand_authorizations'
        unique_together = ('seller', 'brand')
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.seller.display_name} -> {self.brand.name} ({self.status})"

class SellerCategoryAuthorization(models.Model):
    """
    Seller approval request to sell in restricted categories.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='category_authorizations')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='seller_authorizations')
    status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    certification_urls = models.JSONField(default=list, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_category_authorizations'
        unique_together = ('seller', 'category')
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.seller.display_name} -> {self.category.name} ({self.status})"

class GtinExemption(models.Model):
    """
    Exemption granted to a seller to list products without standard UPC/EAN barcodes.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='gtin_exemptions')
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.SET_NULL, related_name='gtin_exemptions')
    category = models.ForeignKey(Category, on_delete=models.RESTRICT, related_name='gtin_exemptions')
    status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    reason = models.TextField()
    product_images = models.JSONField(default=list, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gtin_exemptions'
        indexes = [
            models.Index(fields=['seller', 'category']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"GTIN Exemption: {self.seller.display_name} - {self.category.name}"

class Product(models.Model):
    """
    Master Canonical Product Entry identified by ASIN.
    Parent-Child variation model supported.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    asin = models.CharField(max_length=20, unique=True)
    parent_asin = models.ForeignKey('self', null=True, blank=True, on_delete=models.RESTRICT, related_name='child_variations')
    is_parent = models.BooleanField(default=False)
    variation_theme = models.CharField(max_length=50, choices=VariationTheme.choices, null=True, blank=True)
    
    # Barcodes
    upc = models.CharField(max_length=50, unique=True, null=True, blank=True)
    ean = models.CharField(max_length=50, unique=True, null=True, blank=True)
    gtin = models.CharField(max_length=50, unique=True, null=True, blank=True)
    isbn = models.CharField(max_length=50, unique=True, null=True, blank=True)
    part_number = models.CharField(max_length=100, null=True, blank=True)
    model_number = models.CharField(max_length=100, null=True, blank=True)

    # Catalog Metadata
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.RESTRICT, related_name='products')
    title = models.CharField(max_length=500)
    description = models.TextField()
    bullet_points = models.JSONField(default=list, blank=True)
    search_keywords = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, choices=CatalogStatus.choices, default=CatalogStatus.ACTIVE)

    # Physical Package Dimensions
    package_length_inches = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    package_width_inches = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    package_height_inches = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    package_weight_pounds = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_hazmat = models.BooleanField(default=False)
    hazmat_details = models.TextField(null=True, blank=True)

    # India Tax & Legal Metrology
    hsn_code = models.CharField(max_length=8, null=True, blank=True)
    gst_rate_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    country_of_origin = models.CharField(max_length=100, default='India')
    manufacturer_details = models.TextField(null=True, blank=True)

    # A+ Content
    a_plus_content_html = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        indexes = [
            models.Index(fields=['asin']),
            models.Index(fields=['parent_asin']),
            models.Index(fields=['category']),
            models.Index(fields=['brand']),
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return f"{self.asin} - {self.title[:50]}"

class ProductImage(models.Model):
    """
    Master catalog product photography complying with marketplace image requirements.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.CharField(max_length=500)
    zoom_image_url = models.CharField(max_length=500, null=True, blank=True)
    thumbnail_url = models.CharField(max_length=500, null=True, blank=True)
    variant_tag = models.CharField(max_length=50, default="MAIN")
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_images'
        indexes = [
            models.Index(fields=['product', 'sort_order']),
        ]

    def __str__(self):
        return f"Image ({self.variant_tag}) for {self.product.asin}"

class ProductAttributeValue(models.Model):
    """
    Normalized attribute values assigned to a specific ASIN based on category schema.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attribute_values')
    attribute = models.ForeignKey(CategoryAttribute, on_delete=models.CASCADE, related_name='values')
    value = models.TextField()
    unit_of_measure = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_attribute_values'
        unique_together = ('product', 'attribute')

    def __str__(self):
        return f"{self.product.asin} - {self.attribute.code}: {self.value}"
