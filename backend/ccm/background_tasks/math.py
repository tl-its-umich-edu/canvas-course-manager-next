import logging
logger = logging.getLogger(__name__)

def add(task):
    """
    A simple background task that adds two numbers.
    Call as below from Django Views
      from django_q.tasks import async_task
      task_data = {'a': 5, 'b': 8}
      async_task('backend.ccm.background_tasks.math.add', task=task_data)
    """
    a = task.get('a', 0)
    b = task.get('b', 0)
    logger.info(f"Adding 2 numbers {a} and {b}: {a + b}")