from django import template
import re
from django.utils.safestring import mark_safe

register = template.Library()
CURRENT_YEAR_TOKEN_RE = re.compile(r"{{\s*current_year\s*}}")


@register.filter
def render_footer_template(content, current_year):
    if not content:
        return ""

    rendered_content = CURRENT_YEAR_TOKEN_RE.sub(str(current_year), str(content))
    return mark_safe(rendered_content)
