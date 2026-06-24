from django.conf import settings
from django.db import migrations


def create_footer_and_banner_flatpages(apps, schema_editor):
    FlatPage = apps.get_model('flatpages', 'FlatPage')
    Site = apps.get_model('sites', 'Site')

    site_id = getattr(settings, 'SITE_ID', 1)
    site, _ = Site.objects.get_or_create(
        id=site_id,
        defaults={
            'domain': 'example.com',
            'name': 'example.com',
        },
    )

    footer, _ = FlatPage.objects.get_or_create(
        url='/footer/',
        defaults={
            'title': 'Footer',
            'content': '<p>Copyright &copy; {{ current_year }} The Regents of the University of Michigan</p>',
            'enable_comments': False,
            'registration_required': False,
            'template_name': '',
        },
    )

    if not footer.sites.filter(id=site.id).exists():
        footer.sites.add(site)

    banner, _ = FlatPage.objects.get_or_create(
        url='/banner/',
        defaults={
            'title': 'Banner',
            'content': '',
            'enable_comments': False,
            'registration_required': False,
            'template_name': '',
        },
    )

    if not banner.sites.filter(id=site.id).exists():
        banner.sites.add(site)


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('flatpages', '0001_initial'),
        ('sites', '0002_alter_domain_unique'),
    ]

    operations = [
        migrations.RunPython(create_footer_and_banner_flatpages, migrations.RunPython.noop),
    ]
