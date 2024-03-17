import click
from click_default_group import DefaultGroup
import kirigami
from trogon import tui


@tui()
@click.group(cls=DefaultGroup, default='createdb', default_if_no_args=True)
@click.option(
    "--verbose", count=True, default=1, help="Increase verbosity level."
)
@click.pass_context
def cli(ctx, verbose):
    """Commands for shaping and cutting text"""
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose


@click.command()
def ingest():
    """Ingest the messages."""
    print('Ingested messages.')


@click.command()
def pretty():
    """Display pretty messages."""
    print('Displayed pretty messages.')


@click.command()
def display():
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


cli.add_command(ingest)
cli.add_command(pretty)
cli.add_command(display)
cli.add_command(celebrate)

if __name__ == '__main__':
    cli(obj={})

