import uuid
import secrets
import string

def generate_id():
    return str(uuid.uuid4())

def generate_asin():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(chars) for _ in range(8))
    return f"BM{suffix}"
