"""kiri.py"""
import click

from .ingest import get_categories, load_config, load_query_auth
from .store import migrate_default_store


@click.command()
def ingest():
    """Ingest the messages."""
    load_config()
    load_query_auth()
    get_categories()
    print('Ingested messages.')


@click.command()
def pretty():
    """Display pretty messages."""
    print('Displayed pretty messages.')


@click.command()
def raw():
    """Display raw messages."""
    print('Display raw messages.')


@click.command()
def migrate():
    """Apply SQLite store migrations."""
    applied = migrate_default_store()
    if applied:
        for migration in applied:
            click.echo(f"Applied {migration.number:04d}_{migration.name}")
    else:
        click.echo("No migrations to apply.")


@click.command()
@click.option('--count', default=1,
              help='The number of times to execute.')
@click.argument('name')
def celebrate(count, name):
    """Say hello."""
    for x in range(count):
        click.echo(f"Hello {name}!")
