
from django.db import models
# from userauth.models import Customuser
class Organisation(models.Model):
    org_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class UserOrganisation(models.Model):
    org = models.ForeignKey('organisation.Organisation', on_delete=models.CASCADE)
    user = models.ForeignKey('employees.Customuser', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.org.name}"
