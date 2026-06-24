from django import template
from django.template import Context, Engine
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def render_footer_template(content, current_year):
    if not content:
        return ''

    template_string = Engine.get_default().from_string(str(content))
    rendered_content = template_string.render(Context({'current_year': current_year}))
    return mark_safe(rendered_content)
