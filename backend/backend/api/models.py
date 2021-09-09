from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser, BaseUserManager
import datetime as dt


class UserManager(BaseUserManager):
    def create_user(self, email, username, password, is_active=True):
        if not email:
            raise ValueError("email field is required")

        if not username:
            raise ValueError("username field is required")

        if not password:
            raise ValueError("password field is required")

        user = self.model(
            email=self.normalize_email(email),
            username=username,
            date_joined=dt.date.today(),
            last_login=dt.datetime.now(),
            is_active=is_active,
        )
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, username, password, is_active=True):
        user = self.create_user(email, username, password, is_active)
        user.superuser = True
        user.staff = True
        user.save(using=self._db)

        return user


class User(AbstractUser):
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=50)

    date_joined = models.DateField()
    last_login = models.DateTimeField()

    rapid_rating = models.IntegerField(default=600)
    blitz_rating = models.IntegerField(default=600)
    bullet_rating = models.IntegerField(default=600)

    is_active = models.BooleanField(default=True)
    staff = models.BooleanField(default=False)
    superuser = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"

    REQUIRED_FIELDS = ["username", "password"]

    objects = UserManager()

    def get_full_name(self):
        return self.email

    def get_short_name(self):
        return self.email

    def __str__(self):
        return self.email

    @property
    def is_staff(self):
        return self.staff

    @property
    def is_superuser(self):
        return self.superuser

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True


def get_deleted_user():
    return get_user_model().objects.get_or_create(
        username="deleted",
        defaults={
            "email": "deleted@ariam.com",
            "password": "deleted",
            "is_active": False,
        },
    )


class Game(models.Model):
    fen = models.TextField()
    white = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET(get_deleted_user),
        related_name="white_games",
    )
    black = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET(get_deleted_user),
        related_name="black_games",
    )
