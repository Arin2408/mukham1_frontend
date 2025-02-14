# import random
# import string
# from django.db import models

# class Registration(models.Model):
#     name = models.CharField(max_length=255)
#     mobile_number = models.CharField(max_length=15, unique=True)
#     password = models.CharField(max_length=255)

#     def __str__(self):
#         return self.name

#     def generate_password(self):
#         return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

#     def save(self, *args, **kwargs):
#         if not self.password:
#             self.password = self.generate_password()
#         super(Registration, self).save(*args, **kwargs)
