"""kiri.py"""
import click

from .ingest import load_config, get_categories

@click.command()
def ingest():
    """Ingest the messages."""
    print('Ingested messages.')
    load_config()
    get_categories()


@click.command()
def pretty():
    """Display pretty messages."""
    print('Displayed pretty messages.')


@click.command()
def raw():
    """Display raw messages."""
    print('Display raw messages.')


@click.command()
@click.option('--count', default=1,
              help='The number of times to execute.')
@click.argument('name')
def celebrate(count, name):
    """Say hello."""
    for x in range(count):
        click.echo(f"Hello {name}!")
